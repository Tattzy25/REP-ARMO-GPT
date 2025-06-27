import { db } from "./db";
import { 
  believabilityMetrics,
  achievements,
  userAchievements,
  alibiTemplates,
  seasonalEvents,
  type InsertBelievabilityMetrics,
  type InsertUserAchievement,
  type Achievement,
  type AlibiTemplate
} from "@shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";

// Multi-Model AI Ensemble
export class MultiModelAIEnsemble {
  
  async generateEnhancedAlibi(
    answers: any[], 
    scenario: string, 
    userContext: any
  ): Promise<{
    primaryAlibi: string;
    alternativeEndings: string[];
    believabilityScore: number;
    improvementSuggestions: string[];
    emotionalTone: string;
    chunks: string[];
  }> {
    try {
      // Generate primary alibi using Groq
      const groqAlibi = await this.generateGroqAlibi(answers, scenario, userContext);
      
      // Generate alternative using OpenAI for diversity
      const openaiAlternatives = await this.generateOpenAIAlternatives(groqAlibi, answers, userContext);
      
      // Fact-check the alibi
      const factCheckResults = await this.performFactCheck(groqAlibi, answers);
      
      // Analyze emotional tone and adjust if needed
      const emotionalTone = await this.detectEmotionalTone(answers);
      const adjustedAlibi = await this.adjustForEmotionalTone(groqAlibi, emotionalTone, userContext);
      
      // Calculate believability score
      const believabilityScore = await this.calculateBelievabilityScore(adjustedAlibi, answers, factCheckResults);
      
      // Generate improvement suggestions
      const improvementSuggestions = await this.generateImprovementSuggestions(
        adjustedAlibi, 
        believabilityScore, 
        factCheckResults
      );
      
      // Break alibi into progressive chunks
      const chunks = this.createProgressiveChunks(adjustedAlibi);
      
      return {
        primaryAlibi: adjustedAlibi,
        alternativeEndings: openaiAlternatives,
        believabilityScore,
        improvementSuggestions,
        emotionalTone,
        chunks
      };
    } catch (error) {
      console.error('Error in multi-model AI ensemble:', error);
      throw error;
    }
  }

  private async generateGroqAlibi(answers: any[], scenario: string, userContext: any): Promise<string> {
    const prompt = this.buildEnhancedPrompt(answers, scenario, userContext);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async generateOpenAIAlternatives(primaryAlibi: string, answers: any[], userContext: any): Promise<string[]> {
    try {
      const prompt = `Based on this alibi: "${primaryAlibi}"
      
      Create 2 alternative endings that:
      1. Keep the same setup and middle part
      2. Provide different creative conclusions
      3. Maintain believability and humor
      4. Consider Armenian cultural context
      
      Return only the alternative ending portions, separated by "---"`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Using latest OpenAI model
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.9,
          max_tokens: 400,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      return content.split('---').map((alt: string) => alt.trim()).filter(Boolean);
    } catch (error) {
      console.error('Error generating OpenAI alternatives:', error);
      // Fallback to Groq-generated alternatives
      return await this.generateGroqAlternatives(primaryAlibi);
    }
  }

  private async generateGroqAlternatives(primaryAlibi: string): Promise<string[]> {
    const prompt = `Based on this alibi: "${primaryAlibi}"
    
    Create 2 alternative endings. Return only the ending portions, separated by "---"`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    return content.split('---').map((alt: string) => alt.trim()).filter(Boolean);
  }

  private async performFactCheck(alibi: string, answers: any[]): Promise<{
    plausibilityScore: number;
    flaggedElements: string[];
    suggestions: string[];
  }> {
    // Real-time fact checking using AI reasoning
    const prompt = `Analyze this alibi for logical consistency and plausibility:

"${alibi}"

Based on these user answers: ${JSON.stringify(answers)}

Check for:
1. Time consistency
2. Location plausibility  
3. Character behavior logic
4. Cause-and-effect relationships

Return JSON: {
  "plausibilityScore": 0-10,
  "flaggedElements": ["list of concerns"],
  "suggestions": ["improvement suggestions"]
}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      try {
        return JSON.parse(content);
      } catch {
        return {
          plausibilityScore: 7,
          flaggedElements: [],
          suggestions: []
        };
      }
    } catch (error) {
      console.error('Error in fact checking:', error);
      return {
        plausibilityScore: 7,
        flaggedElements: [],
        suggestions: []
      };
    }
  }

  private async detectEmotionalTone(answers: any[]): Promise<string> {
    // Analyze user's emotional state from typing patterns and content
    const answerTexts = answers.map(a => a.answer).join(' ');
    const avgLength = answerTexts.length / answers.length;
    const urgentWords = ['urgent', 'emergency', 'asap', 'quickly', 'help', 'stress'];
    const humorWords = ['funny', 'joke', 'laugh', 'haha', 'lol'];
    
    const hasUrgentWords = urgentWords.some(word => 
      answerTexts.toLowerCase().includes(word)
    );
    const hasHumorWords = humorWords.some(word => 
      answerTexts.toLowerCase().includes(word)
    );

    if (hasUrgentWords || avgLength < 20) {
      return 'stressed';
    } else if (hasHumorWords || avgLength > 60) {
      return 'humorous';
    } else {
      return 'neutral';
    }
  }

  private async adjustForEmotionalTone(
    alibi: string, 
    emotionalTone: string, 
    userContext: any
  ): Promise<string> {
    if (emotionalTone === 'neutral') return alibi;

    const toneAdjustments = {
      stressed: 'Make this alibi more concise and practical, less elaborate.',
      humorous: 'Add more humor and Armenian cultural references to this alibi.'
    };

    const adjustment = toneAdjustments[emotionalTone as keyof typeof toneAdjustments];
    if (!adjustment) return alibi;

    const prompt = `${adjustment}

Original alibi: "${alibi}"

Return the adjusted version:`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || alibi;
    } catch (error) {
      console.error('Error adjusting for emotional tone:', error);
      return alibi;
    }
  }

  private async calculateBelievabilityScore(
    alibi: string, 
    answers: any[], 
    factCheckResults: any
  ): Promise<number> {
    let score = 10;

    // Deduct points for flagged elements
    score -= factCheckResults.flaggedElements.length * 1.5;

    // Factor in plausibility score
    score = (score + factCheckResults.plausibilityScore) / 2;

    // Check answer-alibi consistency
    const consistencyScore = await this.checkAnswerConsistency(alibi, answers);
    score = (score + consistencyScore) / 2;

    // Ensure score is between 1-10
    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  private async checkAnswerConsistency(alibi: string, answers: any[]): Promise<number> {
    const prompt = `Rate how well this alibi incorporates the user's answers (1-10):

Alibi: "${alibi}"

User answers: ${JSON.stringify(answers)}

Return only a number 1-10:`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 10,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '7';
      const score = parseInt(content.trim());
      
      return isNaN(score) ? 7 : Math.max(1, Math.min(10, score));
    } catch (error) {
      console.error('Error checking answer consistency:', error);
      return 7;
    }
  }

  private async generateImprovementSuggestions(
    alibi: string, 
    believabilityScore: number, 
    factCheckResults: any
  ): Promise<string[]> {
    if (believabilityScore >= 8.5) {
      return ['Great job! Your alibi is highly believable.'];
    }

    const suggestions = [...factCheckResults.suggestions];

    if (believabilityScore < 6) {
      suggestions.push('Consider adding more specific details to make your story more convincing.');
    }

    if (believabilityScore < 7) {
      suggestions.push('Try to make the sequence of events more logical and natural.');
    }

    if (suggestions.length === 0) {
      suggestions.push('Consider adding more personal touches or emotional elements.');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private createProgressiveChunks(alibi: string): string[] {
    // Split alibi into meaningful chunks for progressive reveal
    const sentences = alibi.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    
    if (sentences.length <= 3) {
      return sentences.map(s => s.trim() + '.');
    }

    // Create 3-5 chunks
    const chunkSize = Math.ceil(sentences.length / 4);
    
    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunkSentences = sentences.slice(i, i + chunkSize);
      chunks.push(chunkSentences.join('. ').trim() + '.');
    }

    return chunks;
  }

  private buildEnhancedPrompt(answers: any[], scenario: string, userContext: any): string {
    const personaLevel = userContext.personaLevel || 3;
    const armenianMix = userContext.armenianMix || 0.3;
    
    return `You are Armo Hopar, an Armenian-American AI with personality level ${personaLevel}.

Scenario: ${scenario}

User answers:
${answers.map((a, i) => `${i + 1}. ${a.question}: ${a.answer}`).join('\n')}

Create a believable, engaging alibi story that:
- Uses ${Math.round(armenianMix * 100)}% Armenian phrases naturally
- Incorporates ALL user answers logically
- Matches personality level ${personaLevel} (1=polite, 2=mild, 3=edgy, 4=savage)
- Is 200-300 words with natural flow
- Includes specific details for believability

Armenian phrases to use: "Listen hopar", "Inch es anum?", "Ախպեր", cultural references.

Generate the complete alibi story:`;
  }

  // Store believability metrics
  async storeBelievabilityMetrics(
    userId: number, 
    sessionId: number, 
    alibiId: string,
    score: number,
    factorBreakdown: any,
    improvementSuggestions: string[]
  ): Promise<void> {
    try {
      const metricData: InsertBelievabilityMetrics = {
        userId,
        sessionId,
        alibiId,
        believabilityScore: score,
        factorBreakdown,
        improvementSuggestions,
        calculatedAt: new Date(),
      };

      await db.insert(believabilityMetrics).values(metricData);
      console.log(`Stored believability metrics: ${score}/10 for user ${userId}`);
    } catch (error) {
      console.error('Error storing believability metrics:', error);
    }
  }
}

// Achievement System
export class AchievementSystem {
  
  async checkAndUnlockAchievements(
    userId: number, 
    sessionId: number, 
    alibiData: any
  ): Promise<string[]> {
    try {
      const newAchievements = [];

      // Check various achievement criteria
      if (alibiData.believabilityScore >= 9) {
        await this.unlockAchievement(userId, 'master_storyteller', sessionId);
        newAchievements.push('Master Storyteller');
      }

      if (alibiData.believabilityScore >= 8.5) {
        await this.unlockAchievement(userId, 'believable_artist', sessionId);
        newAchievements.push('Believable Artist');
      }

      if (alibiData.primaryAlibi.includes('Ախպեր') || alibiData.primaryAlibi.includes('hopar')) {
        await this.unlockAchievement(userId, 'armenian_pride', sessionId);
        newAchievements.push('Armenian Pride');
      }

      if (alibiData.primaryAlibi.length > 400) {
        await this.unlockAchievement(userId, 'detail_master', sessionId);
        newAchievements.push('Detail Master');
      }

      // Check session count achievements
      const sessionCount = await this.getUserSessionCount(userId);
      if (sessionCount === 10) {
        await this.unlockAchievement(userId, 'frequent_fibber', sessionId);
        newAchievements.push('Frequent Fibber');
      }

      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  private async unlockAchievement(userId: number, achievementId: string, sessionId: number): Promise<void> {
    try {
      // Check if already unlocked
      const existing = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        ));

      if (existing.length > 0) return;

      // Unlock achievement
      const achievementData: InsertUserAchievement = {
        userId,
        achievementId,
        sessionId,
        unlockedAt: new Date(),
      };

      await db.insert(userAchievements).values(achievementData);
      console.log(`Achievement unlocked: ${achievementId} for user ${userId}`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  private async getUserSessionCount(userId: number): Promise<number> {
    try {
      const sessions = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId));

      return sessions.length;
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    try {
      const userAchievs = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, userId))
        .orderBy(desc(userAchievements.unlockedAt));

      // Get achievement details
      const achievementDetails = await db
        .select()
        .from(achievements);

      return userAchievs.map(ua => {
        const details = achievementDetails.find(a => a.achievementId === ua.achievementId);
        return {
          ...ua,
          ...details
        };
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }
}

// Enhanced Template System
export class EnhancedTemplateSystem {
  
  async getSeasonalTemplates(): Promise<AlibiTemplate[]> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      // Get seasonal events
      const seasonalEvents = await db
        .select()
        .from(seasonalEvents)
        .where(and(
          eq(seasonalEvents.eventMonth, currentMonth),
          gte(seasonalEvents.eventDay, currentDay - 7) // Within a week
        ));

      // Get templates for current season
      const templates = await db
        .select()
        .from(alibiTemplates)
        .where(eq(alibiTemplates.isActive, true))
        .orderBy(desc(alibiTemplates.popularity));

      return templates;
    } catch (error) {
      console.error('Error getting seasonal templates:', error);
      return [];
    }
  }

  async generateRapidEmergencyAlibi(scenario: string, urgencyLevel: string): Promise<string> {
    const prompt = `EMERGENCY MODE: Generate a quick, believable alibi for:

Scenario: ${scenario}
Urgency: ${urgencyLevel}

Requirements:
- 30-50 words maximum
- Immediately usable
- Culturally appropriate
- No complex details

Generate alibi:`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 100,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Traffic was unexpectedly heavy due to an accident.';
    } catch (error) {
      console.error('Error generating emergency alibi:', error);
      return 'Sorry, had an urgent family matter come up suddenly.';
    }
  }
}

// Export singleton instances
export const multiModelAI = new MultiModelAIEnsemble();
export const achievementSystem = new AchievementSystem();
export const enhancedTemplates = new EnhancedTemplateSystem();