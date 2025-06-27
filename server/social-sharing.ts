import { db } from "./db";
import { 
  alibiGallery, 
  alibiReactions, 
  shareTemplates, 
  socialShares,
  alibiGenerations,
  belivaibilityMetrics,
  InsertAlibiGallery,
  InsertAlibiReaction,
  InsertSocialShare
} from "@shared/schema";
import { eq, and, desc, sql, gte, ne } from "drizzle-orm";

export interface AnonymizedAlibi {
  id: number;
  anonymizedContent: string;
  category: string;
  believabilityScore: number;
  funnyScore: number;
  reactionCount: number;
  shareCount: number;
  tags: string[];
  createdAt: Date;
  reactions: {
    [emoji: string]: number;
  };
}

export interface ShareTemplateData {
  platform: string;
  templateContent: string;
  alibiHighlight: string;
  believabilityScore: number;
  achievementBadges?: string[];
}

export class SocialSharingSystem {

  /**
   * Anonymize and submit alibi to community gallery
   */
  async submitToGallery(
    alibiGenerationId: number,
    userId: number,
    isPublic: boolean = false
  ): Promise<{ success: boolean; galleryId?: number; error?: string }> {
    try {
      // Get the alibi generation
      const [generation] = await db
        .select()
        .from(alibiGenerations)
        .where(eq(alibiGenerations.id, alibiGenerationId));

      if (!generation) {
        return { success: false, error: 'Alibi generation not found' };
      }

      // Get believability metrics
      const [metrics] = await db
        .select()
        .from(believabilityMetrics)
        .where(eq(believabilityMetrics.alibiGenerationId, alibiGenerationId));

      // Anonymize the content
      const anonymizedContent = this.anonymizeAlibiContent(generation.generatedAlibi, generation.userAnswers);
      
      // Determine category and tags
      const category = this.categorizeAlibi(generation.generatedAlibi, generation.templateId);
      const tags = this.generateTags(generation.generatedAlibi, category);

      // Calculate initial funny score based on content analysis
      const funnyScore = this.calculateInitialFunnyScore(anonymizedContent, generation.generatedAlibi);

      const galleryData: InsertAlibiGallery = {
        alibiGenerationId,
        anonymizedContent,
        category,
        believabilityScore: metrics?.overallScore || 7.0,
        funnyScore,
        reactionCount: 0,
        shareCount: 0,
        isPublic,
        isFeatured: false,
        moderationStatus: 'pending',
        tags
      };

      const [galleryItem] = await db
        .insert(alibiGallery)
        .values(galleryData)
        .returning();

      return { success: true, galleryId: galleryItem.id };

    } catch (error) {
      console.error('Error submitting to gallery:', error);
      return { success: false, error: 'Failed to submit to gallery' };
    }
  }

  /**
   * Get community's funniest alibis with privacy protection
   */
  async getCommunityGallery(params: {
    category?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'funny' | 'believability' | 'recent' | 'reactions';
    excludeUserId?: number;
  }): Promise<AnonymizedAlibi[]> {
    const { category, limit = 20, offset = 0, sortBy = 'funny', excludeUserId } = params;

    let query = db
      .select({
        id: alibiGallery.id,
        anonymizedContent: alibiGallery.anonymizedContent,
        category: alibiGallery.category,
        believabilityScore: alibiGallery.believabilityScore,
        funnyScore: alibiGallery.funnyScore,
        reactionCount: alibiGallery.reactionCount,
        shareCount: alibiGallery.shareCount,
        tags: alibiGallery.tags,
        createdAt: alibiGallery.createdAt,
        originalUserId: alibiGenerations.userId
      })
      .from(alibiGallery)
      .leftJoin(alibiGenerations, eq(alibiGallery.alibiGenerationId, alibiGenerations.id))
      .where(
        and(
          eq(alibiGallery.isPublic, true),
          eq(alibiGallery.moderationStatus, 'approved'),
          category ? eq(alibiGallery.category, category) : undefined,
          excludeUserId ? ne(alibiGenerations.userId, excludeUserId) : undefined
        )
      );

    // Apply sorting
    switch (sortBy) {
      case 'funny':
        query = query.orderBy(desc(alibiGallery.funnyScore));
        break;
      case 'believability':
        query = query.orderBy(desc(alibiGallery.believabilityScore));
        break;
      case 'reactions':
        query = query.orderBy(desc(alibiGallery.reactionCount));
        break;
      case 'recent':
      default:
        query = query.orderBy(desc(alibiGallery.createdAt));
        break;
    }

    const results = await query.limit(limit).offset(offset);

    // Get reactions for each gallery item
    const galleryIds = results.map(r => r.id);
    const reactions = await this.getReactionsSummary(galleryIds);

    return results.map(item => ({
      id: item.id,
      anonymizedContent: item.anonymizedContent,
      category: item.category,
      believabilityScore: item.believabilityScore,
      funnyScore: item.funnyScore,
      reactionCount: item.reactionCount,
      shareCount: item.shareCount,
      tags: item.tags || [],
      createdAt: item.createdAt,
      reactions: reactions[item.id] || {}
    }));
  }

  /**
   * Add emoji reaction to gallery item
   */
  async addReaction(
    galleryItemId: number, 
    userId: number, 
    reactionType: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already reacted
      const [existingReaction] = await db
        .select()
        .from(alibiReactions)
        .where(
          and(
            eq(alibiReactions.galleryItemId, galleryItemId),
            eq(alibiReactions.userId, userId)
          )
        );

      if (existingReaction) {
        // Update existing reaction
        await db
          .update(alibiReactions)
          .set({ reactionType })
          .where(eq(alibiReactions.id, existingReaction.id));
      } else {
        // Create new reaction
        const reactionData: InsertAlibiReaction = {
          galleryItemId,
          userId,
          reactionType
        };

        await db.insert(alibiReactions).values(reactionData);

        // Update reaction count
        await db
          .update(alibiGallery)
          .set({ 
            reactionCount: sql`${alibiGallery.reactionCount} + 1`,
            funnyScore: sql`${alibiGallery.funnyScore} + 0.1` // Slight boost for engagement
          })
          .where(eq(alibiGallery.id, galleryItemId));
      }

      return { success: true };

    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: 'Failed to add reaction' };
    }
  }

  /**
   * Generate pre-formatted social media share content
   */
  async generateShareContent(
    alibiGenerationId: number,
    platform: 'twitter' | 'instagram' | 'facebook' | 'tiktok'
  ): Promise<ShareTemplateData> {
    // Get alibi generation data
    const [generation] = await db
      .select()
      .from(alibiGenerations)
      .where(eq(alibiGenerations.id, alibiGenerationId));

    const [metrics] = await db
      .select()
      .from(believabilityMetrics)
      .where(eq(believabilityMetrics.alibiGenerationId, alibiGenerationId));

    // Get platform template
    const [template] = await db
      .select()
      .from(shareTemplates)
      .where(
        and(
          eq(shareTemplates.platform, platform),
          eq(shareTemplates.isActive, true)
        )
      )
      .orderBy(desc(shareTemplates.usageCount));

    if (!generation || !template) {
      throw new Error('Unable to generate share content');
    }

    // Extract alibi highlight (first 100 chars)
    const alibiHighlight = this.extractHighlight(generation.generatedAlibi);
    
    // Get achievement badges if any
    const achievementBadges = generation.achievements || [];

    // Format template content
    const shareContent = this.formatShareTemplate(
      template.templateContent,
      {
        alibiHighlight,
        believabilityScore: metrics?.overallScore || 0,
        category: generation.templateId || 'custom',
        achievements: achievementBadges
      }
    );

    return {
      platform,
      templateContent: shareContent,
      alibiHighlight,
      believabilityScore: metrics?.overallScore || 0,
      achievementBadges
    };
  }

  /**
   * Record social media share
   */
  async recordShare(
    userId: number,
    alibiGenerationId: number,
    platform: string,
    shareContent: string,
    shareUrl?: string
  ): Promise<void> {
    const shareData: InsertSocialShare = {
      userId,
      alibiGenerationId,
      shareTemplateId: `share_${platform}_highlight`,
      platform,
      shareContent,
      shareUrl,
      isSuccessful: true
    };

    await db.insert(socialShares).values(shareData);

    // Update share count in gallery if item exists
    await db
      .update(alibiGallery)
      .set({ 
        shareCount: sql`${alibiGallery.shareCount} + 1`,
        funnyScore: sql`${alibiGallery.funnyScore} + 0.2` // Boost for shares
      })
      .where(eq(alibiGallery.alibiGenerationId, alibiGenerationId));

    // Update template usage count
    await db
      .update(shareTemplates)
      .set({ usageCount: sql`${shareTemplates.usageCount} + 1` })
      .where(eq(shareTemplates.id, `share_${platform}_highlight`));
  }

  /**
   * Get user's sharing history
   */
  async getUserSharingHistory(userId: number, limit: number = 10): Promise<any[]> {
    return await db
      .select({
        id: socialShares.id,
        platform: socialShares.platform,
        shareContent: socialShares.shareContent,
        shareUrl: socialShares.shareUrl,
        createdAt: socialShares.createdAt,
        alibiId: alibiGenerations.id,
        believabilityScore: believabilityMetrics.overallScore
      })
      .from(socialShares)
      .leftJoin(alibiGenerations, eq(socialShares.alibiGenerationId, alibiGenerations.id))
      .leftJoin(believabilityMetrics, eq(believabilityMetrics.alibiGenerationId, alibiGenerations.id))
      .where(eq(socialShares.userId, userId))
      .orderBy(desc(socialShares.createdAt))
      .limit(limit);
  }

  /**
   * Get gallery statistics
   */
  async getGalleryStats(): Promise<{
    totalAlibis: number;
    totalReactions: number;
    totalShares: number;
    avgBelievabilityScore: number;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    // Total counts
    const [totals] = await db
      .select({
        totalAlibis: sql<number>`count(*)`,
        totalReactions: sql<number>`sum(${alibiGallery.reactionCount})`,
        totalShares: sql<number>`sum(${alibiGallery.shareCount})`,
        avgBelievabilityScore: sql<number>`avg(${alibiGallery.believabilityScore})`
      })
      .from(alibiGallery)
      .where(eq(alibiGallery.isPublic, true));

    // Top categories
    const topCategories = await db
      .select({
        category: alibiGallery.category,
        count: sql<number>`count(*)`
      })
      .from(alibiGallery)
      .where(eq(alibiGallery.isPublic, true))
      .groupBy(alibiGallery.category)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return {
      totalAlibis: totals.totalAlibis || 0,
      totalReactions: totals.totalReactions || 0,
      totalShares: totals.totalShares || 0,
      avgBelievabilityScore: Number(totals.avgBelievabilityScore?.toFixed(1)) || 0,
      topCategories
    };
  }

  // Private helper methods

  private anonymizeAlibiContent(alibiContent: string, userAnswers: any): string {
    let anonymized = alibiContent;

    // Remove personal identifiers
    const personalPatterns = [
      // Names (replace with generic terms)
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Full names
      /\b(?:my|our) (?:boss|manager|supervisor|colleague|coworker) [A-Z][a-z]+/gi,
      // Phone numbers
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      // Email addresses
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Addresses
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr)\b/gi,
      // Company names (simple pattern)
      /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Co)\b/g
    ];

    const replacements = [
      '[Name]',
      'my colleague [Name]',
      '[Phone]',
      '[Email]',
      '[Address]',
      '[Company]'
    ];

    personalPatterns.forEach((pattern, index) => {
      anonymized = anonymized.replace(pattern, replacements[index]);
    });

    // Remove specific personal details from user answers if provided
    if (userAnswers && Array.isArray(userAnswers)) {
      userAnswers.forEach((answer: string) => {
        if (typeof answer === 'string' && answer.length > 10) {
          // Replace long specific answers with generic versions
          const words = answer.split(' ');
          if (words.length > 3) {
            words.slice(2).forEach(word => {
              if (word.length > 6 && /^[A-Za-z]+$/.test(word)) {
                anonymized = anonymized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '[Detail]');
              }
            });
          }
        }
      });
    }

    return anonymized;
  }

  private categorizeAlibi(alibiContent: string, templateId?: string): string {
    if (templateId) {
      if (templateId.includes('work')) return 'Work';
      if (templateId.includes('family')) return 'Family';
      if (templateId.includes('health')) return 'Health';
      if (templateId.includes('car') || templateId.includes('transport')) return 'Transportation';
      if (templateId.includes('armenian') || templateId.includes('cultural')) return 'Cultural';
      if (templateId.includes('tech')) return 'Technology';
    }

    // Content-based categorization
    const workKeywords = ['work', 'job', 'boss', 'meeting', 'office', 'deadline', 'project'];
    const familyKeywords = ['family', 'mom', 'dad', 'parent', 'sibling', 'relative', 'grandmother'];
    const healthKeywords = ['doctor', 'hospital', 'sick', 'appointment', 'medical', 'health'];
    const transportKeywords = ['car', 'traffic', 'uber', 'bus', 'train', 'flight', 'airport'];
    const culturalKeywords = ['armenian', 'cultural', 'traditional', 'heritage', 'community'];

    const content = alibiContent.toLowerCase();

    if (workKeywords.some(keyword => content.includes(keyword))) return 'Work';
    if (familyKeywords.some(keyword => content.includes(keyword))) return 'Family';
    if (healthKeywords.some(keyword => content.includes(keyword))) return 'Health';
    if (transportKeywords.some(keyword => content.includes(keyword))) return 'Transportation';
    if (culturalKeywords.some(keyword => content.includes(keyword))) return 'Cultural';

    return 'General';
  }

  private generateTags(alibiContent: string, category: string): string[] {
    const tags = [category.toLowerCase()];
    const content = alibiContent.toLowerCase();

    // Add contextual tags
    if (content.includes('emergency')) tags.push('emergency');
    if (content.includes('last minute')) tags.push('last-minute');
    if (content.includes('family')) tags.push('family');
    if (content.includes('work')) tags.push('work');
    if (content.includes('armenian')) tags.push('armenian', 'cultural');
    if (content.includes('creative') || content.includes('unique')) tags.push('creative');
    if (content.includes('funny') || content.includes('hilarious')) tags.push('funny');

    // Length-based tags
    if (alibiContent.length > 500) tags.push('detailed');
    if (alibiContent.length < 200) tags.push('concise');

    return [...new Set(tags)]; // Remove duplicates
  }

  private calculateInitialFunnyScore(anonymizedContent: string, originalContent: string): number {
    let score = 5.0; // Base score

    // Check for humor indicators
    const humorKeywords = ['hilarious', 'funny', 'ridiculous', 'absurd', 'crazy', 'wild'];
    const punctuationHumor = /[!]{2,}|[?!]+/g;

    humorKeywords.forEach(keyword => {
      if (originalContent.toLowerCase().includes(keyword)) {
        score += 0.5;
      }
    });

    if (punctuationHumor.test(originalContent)) {
      score += 0.3;
    }

    // Length and creativity bonus
    if (originalContent.length > 300) score += 0.2;
    if (originalContent.includes('Armenian') || originalContent.includes('ախպեր')) score += 0.3;

    return Math.min(10.0, score);
  }

  private async getReactionsSummary(galleryIds: number[]): Promise<{[key: number]: {[emoji: string]: number}}> {
    if (galleryIds.length === 0) return {};

    const reactions = await db
      .select({
        galleryItemId: alibiReactions.galleryItemId,
        reactionType: alibiReactions.reactionType,
        count: sql<number>`count(*)`
      })
      .from(alibiReactions)
      .where(sql`${alibiReactions.galleryItemId} = ANY(${galleryIds})`)
      .groupBy(alibiReactions.galleryItemId, alibiReactions.reactionType);

    const summary: {[key: number]: {[emoji: string]: number}} = {};

    reactions.forEach(reaction => {
      if (!summary[reaction.galleryItemId]) {
        summary[reaction.galleryItemId] = {};
      }
      summary[reaction.galleryItemId][reaction.reactionType] = reaction.count;
    });

    return summary;
  }

  private extractHighlight(alibiContent: string): string {
    // Extract the most interesting part of the alibi (usually the opening or a key detail)
    const sentences = alibiContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
      return alibiContent.substring(0, 100) + '...';
    }

    // Pick the most engaging sentence (often the first or one with specific details)
    let bestSentence = sentences[0];
    
    for (const sentence of sentences.slice(1, 3)) {
      if (sentence.includes('Armenian') || 
          sentence.includes('suddenly') || 
          sentence.includes('emergency') ||
          sentence.length > bestSentence.length) {
        bestSentence = sentence;
        break;
      }
    }

    return bestSentence.trim().substring(0, 150) + (bestSentence.length > 150 ? '...' : '');
  }

  private formatShareTemplate(
    template: string, 
    data: {
      alibiHighlight: string;
      believabilityScore: number;
      category: string;
      achievements: string[];
    }
  ): string {
    return template
      .replace('{{alibi_highlight}}', data.alibiHighlight)
      .replace('{{believability_score}}', data.believabilityScore.toFixed(1))
      .replace('{{category}}', data.category)
      .replace('{{achievements}}', data.achievements.join(' '));
  }
}

export const socialSharingSystem = new SocialSharingSystem();