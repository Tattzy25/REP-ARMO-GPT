import { db } from "./db";
import { storage } from "./storage";
import { 
  autoCompleteCache,
  contradictionRules,
  plausibilityHints,
  sessionHandoff,
  quickResume,
  smartBookmarks,
  type InsertAutoCompleteCache,
  type InsertContradictionRule,
  type InsertPlausibilityHint,
  type InsertSessionHandoff,
  type InsertQuickResume,
  type InsertSmartBookmark,
  type AutoCompleteCache,
  type SessionHandoff,
  type QuickResume,
  type SmartBookmark
} from "@shared/schema";
import { eq, and, desc, gt, like, gte } from "drizzle-orm";
import crypto from "crypto";

// Contextual Intelligence System
export class ContextualIntelligenceManager {

  // Auto-Complete Suggestions System
  async getAutoCompleteSuggestions(
    questionPattern: string, 
    userInput: string, 
    context: any
  ): Promise<string[]> {
    try {
      // Get cached suggestions that match pattern and input
      const suggestions = await db
        .select()
        .from(autoCompleteCache)
        .where(and(
          eq(autoCompleteCache.questionPattern, questionPattern),
          like(autoCompleteCache.userInput, `${userInput}%`),
          eq(autoCompleteCache.isActive, true),
          gte(autoCompleteCache.successRate, 0.3) // Only suggest high-success options
        ))
        .orderBy(desc(autoCompleteCache.successRate))
        .limit(5);

      // Extract suggestion text
      const suggestionTexts = suggestions.map(s => s.suggestion);

      // If no cached suggestions, generate new ones using AI
      if (suggestionTexts.length === 0) {
        const aiSuggestions = await this.generateAISuggestions(questionPattern, userInput, context);
        
        // Cache the AI suggestions for future use
        for (const suggestion of aiSuggestions) {
          await this.cacheAutoCompleteSuggestion({
            questionPattern,
            userInput,
            suggestion,
            context,
            isActive: true,
          });
        }
        
        return aiSuggestions;
      }

      return suggestionTexts;
    } catch (error) {
      console.error('Error getting auto-complete suggestions:', error);
      return [];
    }
  }

  private async generateAISuggestions(pattern: string, input: string, context: any): Promise<string[]> {
    try {
      const prompt = `Based on the question pattern "${pattern}" and user input "${input}", 
                     suggest 3-5 believable completions. Context: ${JSON.stringify(context)}
                     Return only the suggestions, one per line.`;

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
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      return content.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.trim())
        .slice(0, 5);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return [];
    }
  }

  private async cacheAutoCompleteSuggestion(suggestionData: InsertAutoCompleteCache): Promise<void> {
    try {
      await db.insert(autoCompleteCache).values(suggestionData);
    } catch (error) {
      console.error('Error caching auto-complete suggestion:', error);
    }
  }

  async recordSuggestionUsage(suggestionId: number, wasAccepted: boolean): Promise<void> {
    try {
      const [suggestion] = await db
        .select()
        .from(autoCompleteCache)
        .where(eq(autoCompleteCache.id, suggestionId));

      if (suggestion) {
        const newTimesShown = suggestion.timesShown + 1;
        const newSuccessfulUsage = wasAccepted ? suggestion.successfulUsage + 1 : suggestion.successfulUsage;
        const newSuccessRate = newSuccessfulUsage / newTimesShown;

        await db
          .update(autoCompleteCache)
          .set({
            timesShown: newTimesShown,
            successfulUsage: newSuccessfulUsage,
            successRate: newSuccessRate,
            updatedAt: new Date(),
          })
          .where(eq(autoCompleteCache.id, suggestionId));
      }
    } catch (error) {
      console.error('Error recording suggestion usage:', error);
    }
  }

  // Contradiction Detection System
  async checkContradictions(answers: any[]): Promise<any[]> {
    try {
      const contradictions = [];
      
      // Get active contradiction rules
      const rules = await db
        .select()
        .from(contradictionRules)
        .where(eq(contradictionRules.isActive, true));

      for (const rule of rules) {
        const violation = this.checkRuleViolation(rule, answers);
        if (violation) {
          contradictions.push({
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            severity: rule.severity,
            warningMessage: rule.warningMessage,
            fixSuggestions: rule.fixSuggestions,
            violatingAnswers: violation.violatingAnswers,
          });

          // Update trigger count
          await db
            .update(contradictionRules)
            .set({ triggerCount: rule.triggerCount + 1 })
            .where(eq(contradictionRules.ruleId, rule.ruleId));
        }
      }

      return contradictions;
    } catch (error) {
      console.error('Error checking contradictions:', error);
      return [];
    }
  }

  private checkRuleViolation(rule: any, answers: any[]): any | null {
    // Implement rule checking logic based on rule type
    switch (rule.ruleId) {
      case 'time-consistency':
        return this.checkTimeConsistency(answers);
      case 'location-logic':
        return this.checkLocationLogic(answers);
      case 'witness-alignment':
        return this.checkWitnessAlignment(answers);
      default:
        return null;
    }
  }

  private checkTimeConsistency(answers: any[]): any | null {
    // Check if time-related answers are consistent
    const timeAnswers = answers.filter(a => a.type === 'time' || a.question.includes('time'));
    
    if (timeAnswers.length >= 2) {
      // Basic time consistency check
      const times = timeAnswers.map(a => a.answer).filter(Boolean);
      
      // Look for obvious contradictions (simplified logic)
      for (let i = 0; i < times.length - 1; i++) {
        for (let j = i + 1; j < times.length; j++) {
          if (this.timesContradict(times[i], times[j])) {
            return {
              violatingAnswers: [timeAnswers[i], timeAnswers[j]],
              issue: 'Time inconsistency detected'
            };
          }
        }
      }
    }
    
    return null;
  }

  private checkLocationLogic(answers: any[]): any | null {
    // Check if location answers make logical sense together
    const locationAnswers = answers.filter(a => 
      a.type === 'location' || 
      a.question.toLowerCase().includes('where') ||
      a.question.toLowerCase().includes('location')
    );

    if (locationAnswers.length >= 2) {
      // Check for impossible location combinations
      const locations = locationAnswers.map(a => a.answer?.toLowerCase()).filter(Boolean);
      
      if (this.locationsContradict(locations)) {
        return {
          violatingAnswers: locationAnswers,
          issue: 'Location inconsistency detected'
        };
      }
    }

    return null;
  }

  private checkWitnessAlignment(answers: any[]): any | null {
    // Check if witness-related answers align
    const witnessAnswers = answers.filter(a => 
      a.question.toLowerCase().includes('witness') ||
      a.question.toLowerCase().includes('who') ||
      a.question.toLowerCase().includes('with')
    );

    if (witnessAnswers.length >= 2) {
      const witnesses = witnessAnswers.map(a => a.answer).filter(Boolean);
      
      if (this.witnessesContradict(witnesses)) {
        return {
          violatingAnswers: witnessAnswers,
          issue: 'Witness information inconsistency'
        };
      }
    }

    return null;
  }

  private timesContradict(time1: string, time2: string): boolean {
    // Simplified time contradiction detection
    // In production, this would be more sophisticated
    return false; // Placeholder
  }

  private locationsContradict(locations: string[]): boolean {
    // Check for impossible location combinations
    // e.g., "at home" and "at the office" simultaneously
    const homeKeywords = ['home', 'house', 'apartment'];
    const officeKeywords = ['office', 'work', 'workplace'];
    
    const hasHome = locations.some(loc => homeKeywords.some(kw => loc.includes(kw)));
    const hasOffice = locations.some(loc => officeKeywords.some(kw => loc.includes(kw)));
    
    return hasHome && hasOffice; // Simplified logic
  }

  private witnessesContradict(witnesses: string[]): boolean {
    // Check for witness contradictions
    // e.g., "alone" and "with John"
    const aloneKeywords = ['alone', 'by myself', 'solo'];
    const hasAlone = witnesses.some(w => aloneKeywords.some(kw => w.toLowerCase().includes(kw)));
    const hasOthers = witnesses.some(w => !aloneKeywords.some(kw => w.toLowerCase().includes(kw)) && w.trim());
    
    return hasAlone && hasOthers;
  }

  // Plausibility Hints System
  async getPlausibilityHints(scenario: string, questionType: string, context: any): Promise<any[]> {
    try {
      const hints = await db
        .select()
        .from(plausibilityHints)
        .where(and(
          eq(plausibilityHints.scenario, scenario),
          eq(plausibilityHints.questionType, questionType),
          eq(plausibilityHints.isActive, true)
        ))
        .orderBy(desc(plausibilityHints.priority));

      const relevantHints = hints.filter(hint => 
        this.hintConditionMatches(hint.condition, context)
      );

      // Update times shown
      for (const hint of relevantHints) {
        await db
          .update(plausibilityHints)
          .set({ timesShown: hint.timesShown + 1 })
          .where(eq(plausibilityHints.id, hint.id));
      }

      return relevantHints.map(hint => ({
        id: hint.id,
        hint: hint.hint,
        hintType: hint.hintType,
        believabilityImpact: hint.believabilityImpact,
        priority: hint.priority,
      }));
    } catch (error) {
      console.error('Error getting plausibility hints:', error);
      return [];
    }
  }

  private hintConditionMatches(condition: any, context: any): boolean {
    // Check if hint condition matches current context
    try {
      const conditionObj = typeof condition === 'string' ? JSON.parse(condition) : condition;
      
      // Simple condition matching logic
      for (const [key, value] of Object.entries(conditionObj)) {
        if (context[key] !== value) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return true; // Show hint if condition parsing fails
    }
  }

  async recordHintFollowed(hintId: number): Promise<void> {
    try {
      const [hint] = await db
        .select()
        .from(plausibilityHints)
        .where(eq(plausibilityHints.id, hintId));

      if (hint) {
        const newTimesFollowed = hint.timesFollowed + 1;
        const newEffectiveness = newTimesFollowed / hint.timesShown;

        await db
          .update(plausibilityHints)
          .set({
            timesFollowed: newTimesFollowed,
            effectiveness: newEffectiveness,
          })
          .where(eq(plausibilityHints.id, hintId));
      }
    } catch (error) {
      console.error('Error recording hint followed:', error);
    }
  }
}

// Cross-Platform Continuity System
export class CrossPlatformContinuityManager {

  // Session Handoff System
  async createSessionHandoff(
    userId: number, 
    sessionId: number, 
    sourceDevice: string, 
    sessionState: any,
    currentStep: string,
    progress: any
  ): Promise<string> {
    try {
      const handoffToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db.insert(sessionHandoff).values({
        handoffToken,
        userId,
        sourceSessionId: sessionId,
        sourceDevice,
        sessionState,
        currentStep,
        progress,
        expiresAt,
        isActive: true,
      });

      console.log(`Created session handoff token: ${handoffToken}`);
      return handoffToken;
    } catch (error) {
      console.error('Error creating session handoff:', error);
      throw error;
    }
  }

  async completeSessionHandoff(handoffToken: string, targetDevice: string): Promise<SessionHandoff | null> {
    try {
      // Get handoff data
      const [handoff] = await db
        .select()
        .from(sessionHandoff)
        .where(and(
          eq(sessionHandoff.handoffToken, handoffToken),
          eq(sessionHandoff.isActive, true),
          gt(sessionHandoff.expiresAt, new Date())
        ));

      if (!handoff) {
        console.log(`Invalid or expired handoff token: ${handoffToken}`);
        return null;
      }

      // Mark as completed
      await db
        .update(sessionHandoff)
        .set({
          targetDevice,
          completedAt: new Date(),
          isActive: false,
        })
        .where(eq(sessionHandoff.id, handoff.id));

      console.log(`Completed session handoff: ${handoffToken}`);
      return handoff;
    } catch (error) {
      console.error('Error completing session handoff:', error);
      return null;
    }
  }

  // Quick Resume System
  async saveQuickResume(
    userId: number,
    sessionId: number,
    featureType: string,
    resumePoint: string,
    savedState: any,
    metadata?: any
  ): Promise<void> {
    try {
      // Deactivate existing resume points for this feature
      await db
        .update(quickResume)
        .set({ isActive: false })
        .where(and(
          eq(quickResume.userId, userId),
          eq(quickResume.featureType, featureType)
        ));

      // Create new resume point
      await db.insert(quickResume).values({
        userId,
        sessionId,
        featureType,
        resumePoint,
        savedState,
        metadata,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      console.log(`Saved quick resume: ${featureType} at ${resumePoint}`);
    } catch (error) {
      console.error('Error saving quick resume:', error);
    }
  }

  async getQuickResumeOptions(userId: number): Promise<QuickResume[]> {
    try {
      const resumeOptions = await db
        .select()
        .from(quickResume)
        .where(and(
          eq(quickResume.userId, userId),
          eq(quickResume.isActive, true),
          gt(quickResume.expiresAt, new Date())
        ))
        .orderBy(desc(quickResume.createdAt));

      return resumeOptions;
    } catch (error) {
      console.error('Error getting quick resume options:', error);
      return [];
    }
  }

  async resumeFromPoint(resumeId: number): Promise<QuickResume | null> {
    try {
      const [resumePoint] = await db
        .select()
        .from(quickResume)
        .where(eq(quickResume.id, resumeId));

      if (resumePoint) {
        // Update usage statistics
        await db
          .update(quickResume)
          .set({
            timesResumed: resumePoint.timesResumed + 1,
            lastResumed: new Date(),
          })
          .where(eq(quickResume.id, resumeId));

        console.log(`Resumed from: ${resumePoint.featureType} at ${resumePoint.resumePoint}`);
        return resumePoint;
      }

      return null;
    } catch (error) {
      console.error('Error resuming from point:', error);
      return null;
    }
  }

  // Smart Bookmarking System
  async createSmartBookmark(
    userId: number,
    sessionId: number,
    bookmarkType: 'auto_save' | 'user_manual' | 'optimal_point',
    bookmarkPoint: string,
    savedState: any,
    completionPercentage: number,
    autoSaveTrigger?: string,
    isOptimalPoint: boolean = false
  ): Promise<void> {
    try {
      const estimatedTimeRemaining = this.calculateEstimatedTime(completionPercentage);

      await db.insert(smartBookmarks).values({
        userId,
        sessionId,
        bookmarkType,
        bookmarkPoint,
        savedState,
        autoSaveTrigger,
        completionPercentage,
        estimatedTimeRemaining,
        isOptimalPoint,
      });

      console.log(`Created smart bookmark: ${bookmarkType} at ${bookmarkPoint} (${(completionPercentage * 100).toFixed(1)}% complete)`);
    } catch (error) {
      console.error('Error creating smart bookmark:', error);
    }
  }

  private calculateEstimatedTime(completionPercentage: number): number {
    // Estimate remaining time based on completion percentage
    // Average alibi generation takes 3-5 minutes
    const averageTimeMinutes = 4;
    const remainingPercentage = 1 - completionPercentage;
    return Math.round(averageTimeMinutes * remainingPercentage * 60); // Return seconds
  }

  async getSmartBookmarks(userId: number, sessionId?: number): Promise<SmartBookmark[]> {
    try {
      const whereConditions = [eq(smartBookmarks.userId, userId)];
      
      if (sessionId) {
        whereConditions.push(eq(smartBookmarks.sessionId, sessionId));
      }

      const bookmarks = await db
        .select()
        .from(smartBookmarks)
        .where(and(...whereConditions))
        .orderBy(desc(smartBookmarks.createdAt));

      return bookmarks;
    } catch (error) {
      console.error('Error getting smart bookmarks:', error);
      return [];
    }
  }

  async accessBookmark(bookmarkId: number): Promise<SmartBookmark | null> {
    try {
      const [bookmark] = await db
        .select()
        .from(smartBookmarks)
        .where(eq(smartBookmarks.id, bookmarkId));

      if (bookmark) {
        // Update access statistics
        await db
          .update(smartBookmarks)
          .set({
            accessCount: bookmark.accessCount + 1,
            lastAccessed: new Date(),
          })
          .where(eq(smartBookmarks.id, bookmarkId));

        console.log(`Accessed bookmark: ${bookmark.bookmarkPoint}`);
        return bookmark;
      }

      return null;
    } catch (error) {
      console.error('Error accessing bookmark:', error);
      return null;
    }
  }

  // Optimal Save Point Detection
  async detectOptimalSavePoint(
    userId: number,
    sessionId: number,
    currentState: any,
    completionPercentage: number
  ): Promise<boolean> {
    // Detect if current point is optimal for saving
    const optimalConditions = [
      completionPercentage >= 0.25, // At least 25% complete
      completionPercentage % 0.25 === 0, // Quarter milestones
      this.isComplexAnswerCompleted(currentState), // Just finished complex answer
      this.isBreakPoint(currentState), // Natural break in flow
    ];

    const isOptimal = optimalConditions.filter(Boolean).length >= 2;

    if (isOptimal) {
      await this.createSmartBookmark(
        userId,
        sessionId,
        'optimal_point',
        `auto_optimal_${Date.now()}`,
        currentState,
        completionPercentage,
        'optimal_point_detected',
        true
      );
    }

    return isOptimal;
  }

  private isComplexAnswerCompleted(state: any): boolean {
    // Check if user just completed a complex answer
    const lastAnswer = state.answers?.[state.answers.length - 1];
    return lastAnswer && lastAnswer.length > 50; // Simple complexity check
  }

  private isBreakPoint(state: any): boolean {
    // Check if current point is a natural break
    const breakPoints = ['details_complete', 'witnesses_done', 'timeline_set'];
    return breakPoints.includes(state.currentStep);
  }

  // Cleanup expired data
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();

      // Cleanup expired handoffs
      await db
        .update(sessionHandoff)
        .set({ isActive: false })
        .where(and(
          eq(sessionHandoff.isActive, true),
          lt(sessionHandoff.expiresAt, now)
        ));

      // Cleanup expired resume points
      await db
        .update(quickResume)
        .set({ isActive: false })
        .where(and(
          eq(quickResume.isActive, true),
          lt(quickResume.expiresAt, now)
        ));

      console.log('Cleaned up expired seamless experience data');
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
    }
  }
}

// Export singleton instances
export const contextualIntelligence = new ContextualIntelligenceManager();
export const crossPlatformContinuity = new CrossPlatformContinuityManager();

// Auto-cleanup task - run every hour
setInterval(() => {
  crossPlatformContinuity.cleanupExpiredData();
}, 60 * 60 * 1000);