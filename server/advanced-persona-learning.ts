import { db } from "./db";
import { 
  userPersonaProfiles, 
  contextualFactors, 
  adaptiveLearning, 
  crossSessionMemory,
  alibiGenerations,
  belivaibilityMetrics,
  InsertUserPersonaProfile,
  InsertContextualFactor,
  InsertAdaptiveLearning,
  InsertCrossSessionMemory
} from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export interface PersonaAdaptationContext {
  userId: number;
  sessionId: number;
  timeOfDay: string;
  dayOfWeek: string;
  deviceType: string;
  urgencyLevel: 'low' | 'normal' | 'high' | 'emergency';
  socialContext?: string;
  locationContext?: string;
}

export interface UserPersonaInsights {
  humorStylePreference: string;
  topicPreferences: string[];
  languageMixRatio: number;
  complexityLevel: number;
  responsePattern: string;
  adaptationScore: number;
  contextualPreferences: {
    morning?: any;
    afternoon?: any;
    evening?: any;
    late_night?: any;
  };
}

export class AdvancedPersonaLearning {
  
  /**
   * Initialize or update user persona profile with contextual factors
   */
  async initializeUserPersona(context: PersonaAdaptationContext): Promise<UserPersonaInsights> {
    // Record contextual factors for this session
    await this.recordContextualFactors(context);
    
    // Get or create user persona profile
    let [userProfile] = await db
      .select()
      .from(userPersonaProfiles)
      .where(eq(userPersonaProfiles.userId, context.userId));

    if (!userProfile) {
      // Create new profile with intelligent defaults based on context
      const defaultProfile = this.generateIntelligentDefaults(context);
      
      [userProfile] = await db
        .insert(userPersonaProfiles)
        .values({
          userId: context.userId,
          ...defaultProfile
        })
        .returning();
    }

    // Get cross-session memories
    const memories = await this.getCrossSessionMemories(context.userId);
    
    // Apply contextual adaptations
    const adaptedProfile = await this.applyContextualAdaptations(userProfile, context, memories);
    
    return adaptedProfile;
  }

  /**
   * Record contextual factors for pattern detection
   */
  private async recordContextualFactors(context: PersonaAdaptationContext): Promise<void> {
    const now = new Date();
    const timeOfDay = this.determineTimeOfDay(now);
    const dayOfWeek = now.toLocaleLowerCase().split(' ')[0]; // monday, tuesday, etc.
    const usageFrequency = await this.determineUsageFrequency(context.userId);

    const contextualData: InsertContextualFactor = {
      userId: context.userId,
      sessionId: context.sessionId,
      timeOfDay: context.timeOfDay || timeOfDay,
      dayOfWeek: dayOfWeek,
      seasonalContext: this.determineSeasonalContext(now),
      usageFrequency: usageFrequency,
      deviceType: context.deviceType,
      urgencyLevel: context.urgencyLevel,
      locationContext: context.locationContext,
      socialContext: context.socialContext
    };

    await db.insert(contextualFactors).values(contextualData);
  }

  /**
   * Generate intelligent defaults based on initial context
   */
  private generateIntelligentDefaults(context: PersonaAdaptationContext): Partial<InsertUserPersonaProfile> {
    // Start with contextual intelligence
    let humorStyle = 'balanced';
    let complexityLevel = 3;
    let responsePattern = 'detailed';

    // Adjust based on time of day
    if (context.timeOfDay === 'late_night') {
      humorStyle = 'edgy'; // People tend to be more relaxed late at night
      responsePattern = 'creative';
    } else if (context.timeOfDay === 'morning') {
      humorStyle = 'polite'; // More professional in morning
      complexityLevel = 4; // Higher detail in morning
    }

    // Adjust based on urgency
    if (context.urgencyLevel === 'emergency') {
      responsePattern = 'concise';
      complexityLevel = 2; // Faster, simpler responses for emergencies
    }

    // Adjust based on device type
    if (context.deviceType === 'mobile') {
      responsePattern = 'concise'; // Shorter responses for mobile
      complexityLevel = Math.max(2, complexityLevel - 1);
    }

    return {
      humorStylePreference: humorStyle,
      topicPreferences: ['general'], // Start neutral
      languageMixRatio: 0.5, // Balanced Armenian-English
      complexityLevel,
      responsePattern,
      timeOfDayPreferences: {
        [context.timeOfDay]: {
          preferredStyle: humorStyle,
          preferredComplexity: complexityLevel
        }
      },
      frequencyPattern: 'first_time',
      recentTopics: [],
      adaptationScore: 0.1 // Low initially, will improve with learning
    };
  }

  /**
   * Apply contextual adaptations to existing profile
   */
  private async applyContextualAdaptations(
    profile: any,
    context: PersonaAdaptationContext,
    memories: any[]
  ): Promise<UserPersonaInsights> {
    let adaptedProfile = { ...profile };

    // Apply time-of-day preferences
    const timePrefs = profile.timeOfDayPreferences?.[context.timeOfDay];
    if (timePrefs) {
      adaptedProfile.humorStylePreference = timePrefs.preferredStyle || profile.humorStylePreference;
      adaptedProfile.complexityLevel = timePrefs.preferredComplexity || profile.complexityLevel;
    }

    // Apply urgency-based adaptations
    if (context.urgencyLevel === 'emergency') {
      adaptedProfile.responsePattern = 'concise';
      adaptedProfile.complexityLevel = Math.max(1, adaptedProfile.complexityLevel - 2);
    } else if (context.urgencyLevel === 'high') {
      adaptedProfile.complexityLevel = Math.max(2, adaptedProfile.complexityLevel - 1);
    }

    // Apply cross-session memory insights
    const relevantMemories = memories.filter(m => 
      m.contextTags?.includes(context.timeOfDay) || 
      m.contextTags?.includes(context.deviceType) ||
      m.memoryType === 'success_factor'
    );

    for (const memory of relevantMemories) {
      if (memory.memoryType === 'preference' && memory.decayScore > 0.7) {
        // Apply strong preferences
        const memValue = memory.memoryValue;
        if (memValue.humorStyle) {
          adaptedProfile.humorStylePreference = memValue.humorStyle;
        }
        if (memValue.complexity) {
          adaptedProfile.complexityLevel = memValue.complexity;
        }
      }
    }

    return adaptedProfile;
  }

  /**
   * Learn from alibi generation results and user feedback
   */
  async learnFromResults(
    userId: number,
    alibiGenerationId: number,
    believabilityScore: number,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    // Get the generation details
    const [generation] = await db
      .select()
      .from(alibiGenerations)
      .where(eq(alibiGenerations.id, alibiGenerationId));

    if (!generation) return;

    // Get user's current profile
    const [profile] = await db
      .select()
      .from(userPersonaProfiles)
      .where(eq(userPersonaProfiles.userId, userId));

    if (!profile) return;

    // Analyze what worked or didn't work
    const learningInsights = this.analyzeLearningOpportunities(
      generation,
      believabilityScore,
      userFeedback,
      profile
    );

    // Apply adaptive learning
    for (const insight of learningInsights) {
      await this.recordAdaptiveLearning(userId, insight);
      await this.updatePersonaProfile(userId, insight);
    }

    // Update cross-session memory
    await this.updateCrossSessionMemory(userId, generation, believabilityScore, userFeedback);
  }

  /**
   * Analyze learning opportunities from generation results
   */
  private analyzeLearningOpportunities(
    generation: any,
    believabilityScore: number,
    userFeedback: string | undefined,
    profile: any
  ): any[] {
    const insights = [];

    // High believability score - reinforce current settings
    if (believabilityScore >= 8.0) {
      insights.push({
        learningType: 'success_factor',
        previousValue: 'unknown',
        newValue: JSON.stringify({
          complexityLevel: profile.complexityLevel,
          humorStyle: profile.humorStylePreference,
          responsePattern: profile.responsePattern
        }),
        triggerEvent: 'high_believability_score',
        confidenceScore: 0.8,
        adaptationReason: `High believability score (${believabilityScore}) reinforces current settings`,
        impactType: 'reinforce'
      });
    }

    // Low believability score - adjust complexity
    if (believabilityScore < 6.0) {
      const newComplexity = Math.min(5, profile.complexityLevel + 1);
      insights.push({
        learningType: 'complexity',
        previousValue: profile.complexityLevel.toString(),
        newValue: newComplexity.toString(),
        triggerEvent: 'low_believability_score',
        confidenceScore: 0.6,
        adaptationReason: `Low believability score (${believabilityScore}) suggests need for more detail`,
        impactType: 'adjust'
      });
    }

    // Positive user feedback - reinforce humor style
    if (userFeedback === 'positive') {
      insights.push({
        learningType: 'humor_style',
        previousValue: 'unknown',
        newValue: profile.humorStylePreference,
        triggerEvent: 'user_feedback',
        confidenceScore: 0.9,
        adaptationReason: 'Positive user feedback reinforces current humor style',
        impactType: 'reinforce'
      });
    }

    // Negative feedback - explore alternatives
    if (userFeedback === 'negative') {
      const alternativeStyle = this.getAlternativeHumorStyle(profile.humorStylePreference);
      insights.push({
        learningType: 'humor_style',
        previousValue: profile.humorStylePreference,
        newValue: alternativeStyle,
        triggerEvent: 'user_feedback',
        confidenceScore: 0.7,
        adaptationReason: 'Negative feedback suggests trying alternative humor style',
        impactType: 'explore'
      });
    }

    return insights;
  }

  /**
   * Record adaptive learning event
   */
  private async recordAdaptiveLearning(userId: number, insight: any): Promise<void> {
    const learningData: InsertAdaptiveLearning = {
      userId,
      learningType: insight.learningType,
      previousValue: insight.previousValue,
      newValue: insight.newValue,
      triggerEvent: insight.triggerEvent,
      confidenceScore: insight.confidenceScore,
      adaptationReason: insight.adaptationReason
    };

    await db.insert(adaptiveLearning).values(learningData);
  }

  /**
   * Update persona profile based on learning
   */
  private async updatePersonaProfile(userId: number, insight: any): Promise<void> {
    const updates: any = {
      lastUpdated: new Date(),
      adaptationScore: sql`${userPersonaProfiles.adaptationScore} + 0.1`
    };

    if (insight.learningType === 'complexity' && insight.impactType === 'adjust') {
      updates.complexityLevel = parseInt(insight.newValue);
    }

    if (insight.learningType === 'humor_style' && insight.impactType !== 'reinforce') {
      updates.humorStylePreference = insight.newValue;
    }

    await db
      .update(userPersonaProfiles)
      .set(updates)
      .where(eq(userPersonaProfiles.userId, userId));
  }

  /**
   * Update cross-session memory
   */
  private async updateCrossSessionMemory(
    userId: number,
    generation: any,
    believabilityScore: number,
    userFeedback?: string
  ): Promise<void> {
    // Store successful patterns
    if (believabilityScore >= 8.0 || userFeedback === 'positive') {
      const memoryData: InsertCrossSessionMemory = {
        userId,
        memoryType: 'success_factor',
        memoryKey: `success_pattern_${Date.now()}`,
        memoryValue: {
          aiModel: generation.aiModel,
          generationType: generation.generationType,
          believabilityScore,
          ensembleMode: generation.ensembleMode,
          interactiveMode: generation.interactiveMode,
          userFeedback
        },
        contextTags: [
          this.determineTimeOfDay(new Date()),
          generation.generationType,
          generation.aiModel
        ]
      };

      await db.insert(crossSessionMemory).values(memoryData);
    }

    // Store failure patterns for avoidance
    if (believabilityScore < 6.0 || userFeedback === 'negative') {
      const memoryData: InsertCrossSessionMemory = {
        userId,
        memoryType: 'failure_point',
        memoryKey: `failure_pattern_${Date.now()}`,
        memoryValue: {
          aiModel: generation.aiModel,
          generationType: generation.generationType,
          believabilityScore,
          userFeedback,
          issue: 'low_satisfaction'
        },
        contextTags: [
          this.determineTimeOfDay(new Date()),
          generation.generationType,
          'avoid'
        ],
        decayScore: 1.0
      };

      await db.insert(crossSessionMemory).values(memoryData);
    }
  }

  /**
   * Get cross-session memories for user
   */
  private async getCrossSessionMemories(userId: number): Promise<any[]> {
    // Get recent, relevant memories (last 30 days, decay score > 0.3)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await db
      .select()
      .from(crossSessionMemory)
      .where(
        and(
          eq(crossSessionMemory.userId, userId),
          eq(crossSessionMemory.isActive, true),
          gte(crossSessionMemory.decayScore, 0.3),
          gte(crossSessionMemory.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(crossSessionMemory.lastReinforced));
  }

  /**
   * Get contextual persona recommendations
   */
  async getContextualRecommendations(context: PersonaAdaptationContext): Promise<{
    recommendedHumorStyle: string;
    recommendedComplexity: number;
    recommendedResponsePattern: string;
    aiModelPreference: string;
    reasoning: string[];
  }> {
    const profile = await this.initializeUserPersona(context);
    const memories = await this.getCrossSessionMemories(context.userId);
    
    const reasoning = [];
    let recommendedHumorStyle = profile.humorStylePreference;
    let recommendedComplexity = profile.complexityLevel;
    let recommendedResponsePattern = profile.responsePattern;
    let aiModelPreference = 'ensemble';

    // Time-based recommendations
    if (context.timeOfDay === 'late_night') {
      if (recommendedHumorStyle === 'polite') {
        recommendedHumorStyle = 'edgy';
        reasoning.push('Switched to edgy humor for late night session');
      }
    } else if (context.timeOfDay === 'morning') {
      if (recommendedHumorStyle === 'savage') {
        recommendedHumorStyle = 'edgy';
        reasoning.push('Moderated humor style for morning session');
      }
    }

    // Urgency-based recommendations
    if (context.urgencyLevel === 'emergency') {
      recommendedComplexity = Math.min(2, recommendedComplexity);
      recommendedResponsePattern = 'concise';
      aiModelPreference = 'groq'; // Faster model for emergencies
      reasoning.push('Optimized for emergency response speed');
    }

    // Device-based recommendations
    if (context.deviceType === 'mobile') {
      recommendedComplexity = Math.max(1, recommendedComplexity - 1);
      recommendedResponsePattern = 'concise';
      reasoning.push('Optimized for mobile device usage');
    }

    // Memory-based recommendations
    const successfulPatterns = memories.filter(m => 
      m.memoryType === 'success_factor' && 
      m.contextTags?.includes(context.timeOfDay)
    );

    if (successfulPatterns.length > 0) {
      const pattern = successfulPatterns[0].memoryValue;
      if (pattern.aiModel) {
        aiModelPreference = pattern.aiModel;
        reasoning.push(`Using ${pattern.aiModel} based on past success`);
      }
    }

    return {
      recommendedHumorStyle,
      recommendedComplexity,
      recommendedResponsePattern,
      aiModelPreference,
      reasoning
    };
  }

  // Helper methods
  private determineTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'late_night';
  }

  private determineSeasonalContext(date: Date): string {
    const month = date.getMonth();
    if (month >= 11 || month <= 1) return 'winter_holiday';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 8) return 'summer';
    if (month === 9 || month === 10) return 'autumn';
    return 'general';
  }

  private async determineUsageFrequency(userId: number): Promise<string> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentGenerations = await db
      .select({ count: sql<number>`count(*)` })
      .from(alibiGenerations)
      .where(
        and(
          eq(alibiGenerations.userId, userId),
          gte(alibiGenerations.createdAt, sevenDaysAgo)
        )
      );

    const count = recentGenerations[0]?.count || 0;
    
    if (count === 0) return 'first_time';
    if (count <= 2) return 'rare';
    if (count <= 7) return 'occasional';
    if (count <= 21) return 'frequent';
    return 'daily';
  }

  private getAlternativeHumorStyle(currentStyle: string): string {
    const alternatives = {
      'polite': 'balanced',
      'balanced': 'edgy',
      'edgy': 'savage',
      'savage': 'edgy'
    };
    return alternatives[currentStyle as keyof typeof alternatives] || 'balanced';
  }
}

export const advancedPersonaLearning = new AdvancedPersonaLearning();