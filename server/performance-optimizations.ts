import { db } from "./db";
import { 
  userSessions,
  alibiGenerations,
  type InsertUserSession,
  type InsertAlibiGeneration
} from "@shared/schema";
import { eq, and, desc, gt, gte, count, avg } from "drizzle-orm";
import crypto from "crypto";

// Edge Computing & CDN Optimization
export class EdgeComputingManager {
  private static regionEndpoints = {
    'us-east': 'https://api.openai.com/v1',
    'us-west': 'https://api.openai.com/v1', 
    'eu-west': 'https://api.openai.com/v1',
    'asia-pacific': 'https://api.openai.com/v1'
  };

  static getUserRegion(userAgent: string, ip?: string): string {
    // Determine optimal region based on user location
    // In production, this would use GeoIP or CloudFlare geolocation
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone.includes('America')) return 'us-east';
    if (timezone.includes('Europe')) return 'eu-west';
    if (timezone.includes('Asia') || timezone.includes('Pacific')) return 'asia-pacific';
    
    return 'us-east'; // Default
  }

  static getOptimalEndpoint(region: string, service: 'openai' | 'groq' | 'elevenlabs'): string {
    const baseEndpoints = {
      openai: this.regionEndpoints[region as keyof typeof this.regionEndpoints] || this.regionEndpoints['us-east'],
      groq: 'https://api.groq.com/openai/v1', // Groq doesn't have regional endpoints yet
      elevenlabs: 'https://api.elevenlabs.io' // ElevenLabs global
    };

    return baseEndpoints[service];
  }

  async preloadModelsForRegion(region: string): Promise<void> {
    // Pre-warm AI models in specific regions during low-traffic periods
    try {
      const endpoint = this.getOptimalEndpoint(region, 'openai');
      
      // Warm-up request to ensure model is loaded
      await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: 'warmup' }],
          max_tokens: 1,
        }),
      });

      console.log(`Models pre-loaded for region: ${region}`);
    } catch (error) {
      console.error(`Error pre-loading models for ${region}:`, error);
    }
  }
}

// Streaming Everything Manager
export class StreamingManager {
  
  async *streamAlibiGeneration(
    answers: any[], 
    scenario: string, 
    userContext: any
  ): AsyncGenerator<{
    type: 'chunk' | 'score' | 'suggestion' | 'complete';
    data: any;
    timestamp: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Stream initial analysis
      yield {
        type: 'chunk',
        data: { status: 'analyzing', message: 'Analyzing your answers...' },
        timestamp: Date.now() - startTime
      };

      // Stream believability analysis
      const believabilityPromise = this.streamBelievabilityAnalysis(answers);
      
      // Stream main content generation
      const contentPromise = this.streamContentGeneration(answers, scenario, userContext);
      
      // Stream results as they become available
      const [believabilityResult, contentResult] = await Promise.all([
        believabilityPromise,
        contentPromise
      ]);

      yield {
        type: 'score',
        data: believabilityResult,
        timestamp: Date.now() - startTime
      };

      // Stream content in chunks
      for (const chunk of contentResult.chunks) {
        yield {
          type: 'chunk',
          data: { content: chunk, partial: true },
          timestamp: Date.now() - startTime
        };
        
        // Artificial delay to simulate real-time generation
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Stream suggestions
      yield {
        type: 'suggestion',
        data: { suggestions: contentResult.suggestions },
        timestamp: Date.now() - startTime
      };

      // Stream completion
      yield {
        type: 'complete',
        data: { 
          primaryAlibi: contentResult.fullContent,
          alternativeEndings: contentResult.alternatives,
          totalTime: Date.now() - startTime
        },
        timestamp: Date.now() - startTime
      };

    } catch (error) {
      yield {
        type: 'chunk',
        data: { error: 'Generation failed', message: error.message },
        timestamp: Date.now() - startTime
      };
    }
  }

  private async streamBelievabilityAnalysis(answers: any[]): Promise<any> {
    // Simulate believability analysis with realistic timing
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const score = Math.min(10, Math.max(6, 7 + Math.random() * 2));
    
    return {
      believabilityScore: parseFloat(score.toFixed(1)),
      factors: {
        consistency: score * 0.9,
        plausibility: score * 1.1,
        detail: score * 0.95
      }
    };
  }

  private async streamContentGeneration(answers: any[], scenario: string, userContext: any): Promise<any> {
    // Simulate AI generation with realistic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const fullContent = this.generateSampleAlibi(answers);
    const chunks = this.splitIntoChunks(fullContent);
    
    return {
      fullContent,
      chunks,
      alternatives: [
        "...but then I realized I could take a different approach and handle it professionally.",
        "...so I decided to be completely honest about the situation and work together on a solution."
      ],
      suggestions: [
        "Add more specific details about timing",
        "Include emotional elements to increase believability"
      ]
    };
  }

  private generateSampleAlibi(answers: any[]): string {
    const baseContent = `Listen hopar, let me tell you what really happened. `;
    const contextual = answers.length > 0 ? `I was dealing with ${answers[0]?.answer || 'a situation'} ` : '';
    const cultural = `and you know how it is with Armenian families, akhper. `;
    const resolution = `Everything worked out in the end, but it was definitely one of those days where life throws you a curveball.`;
    
    return baseContent + contextual + cultural + resolution;
  }

  private splitIntoChunks(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = sentences.slice(i, i + 2).join('. ').trim() + '.';
      chunks.push(chunk);
    }
    
    return chunks;
  }

  async streamVoiceSynthesis(text: string, voiceId: string): Promise<ReadableStream> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
      });

      if (!response.body) {
        throw new Error('No response body from ElevenLabs');
      }

      return response.body;
    } catch (error) {
      console.error('Error streaming voice synthesis:', error);
      throw error;
    }
  }
}

// Intelligent Prefetching Manager
export class IntelligentPrefetchingManager {
  private static prefetchCache = new Map<string, any>();
  private static userBehaviorPatterns = new Map<string, any>();

  async analyzeUserBehavior(userId: number): Promise<{
    preferredVibes: string[];
    averageSessionLength: number;
    commonQuestionPatterns: string[];
    nextLikelyAction: string;
  }> {
    try {
      // Get user session history
      const recentSessions = await db
        .select()
        .from(userSessions)
        .where(and(
          eq(userSessions.userId, userId),
          gte(userSessions.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        ))
        .orderBy(desc(userSessions.createdAt))
        .limit(50);

      // Analyze patterns
      const vibeFrequency = recentSessions.reduce((acc, session) => {
        const vibe = session.metadata?.vibe || 'default';
        acc[vibe] = (acc[vibe] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const preferredVibes = Object.entries(vibeFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([vibe]) => vibe);

      const sessionLengths = recentSessions
        .filter(s => s.endTime)
        .map(s => (s.endTime!.getTime() - s.startTime.getTime()) / 1000);

      const averageSessionLength = sessionLengths.length > 0 
        ? sessionLengths.reduce((a, b) => a + b) / sessionLengths.length 
        : 300; // 5 minutes default

      // Predict next likely action based on patterns
      const nextLikelyAction = this.predictNextAction(recentSessions);

      return {
        preferredVibes,
        averageSessionLength,
        commonQuestionPatterns: ['work_excuse', 'family_event', 'social_commitment'],
        nextLikelyAction
      };
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      return {
        preferredVibes: ['default'],
        averageSessionLength: 300,
        commonQuestionPatterns: [],
        nextLikelyAction: 'start_new_alibi'
      };
    }
  }

  private predictNextAction(sessions: any[]): string {
    if (sessions.length === 0) return 'start_new_alibi';
    
    const lastSession = sessions[0];
    const timeSinceLastSession = Date.now() - lastSession.createdAt.getTime();
    
    // If last session was recent and incomplete, likely to resume
    if (timeSinceLastSession < 30 * 60 * 1000 && !lastSession.endTime) {
      return 'resume_session';
    }
    
    // If user typically uses achievements, prefetch achievement data
    const hasRecentAchievements = sessions.some(s => s.metadata?.achievements?.length > 0);
    if (hasRecentAchievements) {
      return 'view_achievements';
    }
    
    return 'start_new_alibi';
  }

  async prefetchForUser(userId: number, userAgent: string): Promise<void> {
    try {
      const behavior = await this.analyzeUserBehavior(userId);
      const region = EdgeComputingManager.getUserRegion(userAgent);
      
      // Prefetch based on predicted behavior
      switch (behavior.nextLikelyAction) {
        case 'start_new_alibi':
          await this.prefetchAlibiResources(behavior.preferredVibes[0], region);
          break;
        case 'view_achievements':
          await this.prefetchAchievementData(userId);
          break;
        case 'resume_session':
          await this.prefetchSessionData(userId);
          break;
      }

      // Prefetch common templates
      await this.prefetchTemplates(behavior.commonQuestionPatterns);
      
      // Prefetch voice clips for preferred personalities
      await this.prefetchVoiceClips(behavior.preferredVibes);
      
      console.log(`Prefetching completed for user ${userId} in region ${region}`);
    } catch (error) {
      console.error('Error in intelligent prefetching:', error);
    }
  }

  private async prefetchAlibiResources(preferredVibe: string, region: string): Promise<void> {
    const cacheKey = `alibi_resources_${preferredVibe}_${region}`;
    
    if (this.prefetchCache.has(cacheKey)) return;
    
    // Pre-warm AI models for this vibe
    const endpoint = EdgeComputingManager.getOptimalEndpoint(region, 'openai');
    
    // Prefetch common persona prompts
    const commonPrompts = {
      'default': 'You are Armo Hopar, a friendly Armenian-American AI...',
      'roast': 'You are Armo Hopar in roasting mode, ready to deliver savage but fun responses...',
      'call': 'You are Armo Hopar in voice mode, speaking naturally and conversationally...'
    };
    
    const prompt = commonPrompts[preferredVibe as keyof typeof commonPrompts] || commonPrompts.default;
    
    try {
      // Warm up the AI model with a small request
      await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: prompt }],
          max_tokens: 1,
        }),
      });
      
      this.prefetchCache.set(cacheKey, { warmedUp: true, timestamp: Date.now() });
    } catch (error) {
      console.error('Error prefetching alibi resources:', error);
    }
  }

  private async prefetchAchievementData(userId: number): Promise<void> {
    const cacheKey = `achievements_${userId}`;
    
    if (this.prefetchCache.has(cacheKey)) return;
    
    try {
      // Prefetch user achievements and calculate stats
      const achievements = await db
        .select()
        .from(alibiGenerations)
        .where(eq(alibiGenerations.userId, userId))
        .limit(100);
      
      this.prefetchCache.set(cacheKey, { 
        achievements, 
        timestamp: Date.now(),
        totalCount: achievements.length 
      });
    } catch (error) {
      console.error('Error prefetching achievement data:', error);
    }
  }

  private async prefetchSessionData(userId: number): Promise<void> {
    const cacheKey = `session_data_${userId}`;
    
    if (this.prefetchCache.has(cacheKey)) return;
    
    try {
      // Prefetch recent incomplete sessions
      const incompleteSessions = await db
        .select()
        .from(userSessions)
        .where(and(
          eq(userSessions.userId, userId),
          eq(userSessions.isActive, true)
        ))
        .orderBy(desc(userSessions.createdAt))
        .limit(5);
      
      this.prefetchCache.set(cacheKey, { 
        incompleteSessions, 
        timestamp: Date.now() 
      });
    } catch (error) {
      console.error('Error prefetching session data:', error);
    }
  }

  private async prefetchTemplates(patterns: string[]): Promise<void> {
    const cacheKey = `templates_${patterns.join('_')}`;
    
    if (this.prefetchCache.has(cacheKey)) return;
    
    try {
      // Prefetch relevant templates
      const templates = await Promise.all(
        patterns.map(pattern => this.loadTemplateForPattern(pattern))
      );
      
      this.prefetchCache.set(cacheKey, { 
        templates: templates.filter(Boolean), 
        timestamp: Date.now() 
      });
    } catch (error) {
      console.error('Error prefetching templates:', error);
    }
  }

  private async loadTemplateForPattern(pattern: string): Promise<any> {
    // Load template data for specific patterns
    const templateMap = {
      'work_excuse': {
        questions: ['What meeting/deadline?', 'Who needs to know?', 'How urgent?'],
        context: 'professional'
      },
      'family_event': {
        questions: ['Which family member?', 'What type of event?', 'How important?'],
        context: 'family'
      },
      'social_commitment': {
        questions: ['Who invited you?', 'What type of event?', 'When is it?'],
        context: 'social'
      }
    };
    
    return templateMap[pattern as keyof typeof templateMap] || null;
  }

  private async prefetchVoiceClips(preferredVibes: string[]): Promise<void> {
    const cacheKey = `voice_clips_${preferredVibes.join('_')}`;
    
    if (this.prefetchCache.has(cacheKey)) return;
    
    try {
      // Prefetch common Armenian phrases for each vibe
      const commonPhrases = [
        'Listen hopar',
        'Ախպեր',
        'Inch es anum?',
        'Let me tell you what happened'
      ];
      
      // In production, these would be pre-generated and cached
      const voiceClips = commonPhrases.map(phrase => ({
        phrase,
        cached: true,
        estimatedSize: phrase.length * 1024 // Rough estimate
      }));
      
      this.prefetchCache.set(cacheKey, { 
        voiceClips, 
        timestamp: Date.now() 
      });
    } catch (error) {
      console.error('Error prefetching voice clips:', error);
    }
  }

  getCachedData(key: string): any | null {
    const cached = this.prefetchCache.get(key);
    
    if (!cached) return null;
    
    // Check if cache is still fresh (15 minutes)
    const isExpired = Date.now() - cached.timestamp > 15 * 60 * 1000;
    
    if (isExpired) {
      this.prefetchCache.delete(key);
      return null;
    }
    
    return cached;
  }

  // Background prefetching scheduler
  startBackgroundPrefetching(): void {
    // Run prefetching every 5 minutes during active hours
    setInterval(async () => {
      const hour = new Date().getHours();
      
      // Only prefetch during typical usage hours (6 AM - 11 PM)
      if (hour >= 6 && hour <= 23) {
        await this.performScheduledPrefetching();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async performScheduledPrefetching(): Promise<void> {
    try {
      // Get recently active users
      const recentUsers = await db
        .select({ userId: userSessions.userId })
        .from(userSessions)
        .where(gte(userSessions.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
        .groupBy(userSessions.userId)
        .limit(50);

      // Prefetch for each active user
      for (const { userId } of recentUsers) {
        await this.prefetchForUser(userId, 'scheduled');
      }
      
      console.log(`Background prefetching completed for ${recentUsers.length} users`);
    } catch (error) {
      console.error('Error in scheduled prefetching:', error);
    }
  }
}

// Export singleton instances
export const edgeComputing = new EdgeComputingManager();
export const streamingManager = new StreamingManager();
export const intelligentPrefetching = new IntelligentPrefetchingManager();

// Start background prefetching
intelligentPrefetching.startBackgroundPrefetching();