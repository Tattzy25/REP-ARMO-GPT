import { db } from "./db";
import { storage } from "./storage";
import { 
  predictiveCache, 
  voiceCache, 
  backgroundProcessing,
  type InsertPredictiveCache,
  type InsertVoiceCache,
  type InsertBackgroundProcessing,
  type PredictiveCache,
  type VoiceCache,
  type BackgroundProcessing
} from "@shared/schema";
import { eq, and, desc, lt, gt } from "drizzle-orm";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Smart Caching System
export class SmartCacheManager {
  
  // Predictive Loading System
  async generatePredictiveContent(scenario: string, parameters: any): Promise<string> {
    const cacheKey = this.generateCacheKey(scenario, parameters);
    
    // Check if already cached
    const existing = await this.getCachedContent(cacheKey);
    if (existing) {
      console.log(`Cache hit for ${cacheKey}`);
      await this.updateCacheHit(existing.id);
      return existing.cachedContent;
    }

    console.log(`Cache miss for ${cacheKey}, generating new content`);
    
    // Generate new content using AI
    const startTime = Date.now();
    const generatedContent = await this.generateAIContent(scenario, parameters);
    const generationTime = Date.now() - startTime;

    // Cache the result
    await this.storeCachedContent({
      cacheKey,
      cacheType: 'scenario',
      scenario,
      parameters,
      cachedContent: generatedContent,
      aiModel: 'groq-llama-scout',
      generationTimeMs: generationTime,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return generatedContent;
  }

  private generateCacheKey(scenario: string, parameters: any): string {
    const paramStr = JSON.stringify(parameters, Object.keys(parameters).sort());
    const hash = crypto.createHash('md5').update(`${scenario}-${paramStr}`).digest('hex');
    return `${scenario}-${hash.substring(0, 8)}`;
  }

  private async getCachedContent(cacheKey: string): Promise<PredictiveCache | null> {
    try {
      const [cached] = await db
        .select()
        .from(predictiveCache)
        .where(and(
          eq(predictiveCache.cacheKey, cacheKey),
          eq(predictiveCache.isActive, true),
          gt(predictiveCache.expiresAt, new Date())
        ));
      
      return cached || null;
    } catch (error) {
      console.error('Error getting cached content:', error);
      return null;
    }
  }

  private async updateCacheHit(cacheId: number): Promise<void> {
    try {
      await db
        .update(predictiveCache)
        .set({ 
          hitCount: db.select().from(predictiveCache).where(eq(predictiveCache.id, cacheId)),
          lastUsed: new Date()
        })
        .where(eq(predictiveCache.id, cacheId));
    } catch (error) {
      console.error('Error updating cache hit:', error);
    }
  }

  private async storeCachedContent(cacheData: InsertPredictiveCache): Promise<void> {
    try {
      await db.insert(predictiveCache).values(cacheData);
      console.log(`Cached content with key: ${cacheData.cacheKey}`);
    } catch (error) {
      console.error('Error storing cached content:', error);
    }
  }

  private async generateAIContent(scenario: string, parameters: any): Promise<string> {
    // This would integrate with your existing AI generation logic
    // For now, return a placeholder that integrates with actual Groq API
    const prompt = this.buildPromptFromScenario(scenario, parameters);
    
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
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Generated content placeholder';
    } catch (error) {
      console.error('Error generating AI content:', error);
      return 'Error generating content';
    }
  }

  private buildPromptFromScenario(scenario: string, parameters: any): string {
    return `Generate a believable alibi for the ${scenario} scenario with these details: ${JSON.stringify(parameters)}. Keep it concise and authentic.`;
  }

  // Voice Caching System
  async getCachedVoiceClip(text: string, voiceProvider: string, voiceId?: string): Promise<VoiceCache | null> {
    const textHash = crypto.createHash('sha256').update(text).digest('hex');
    
    try {
      const [cached] = await db
        .select()
        .from(voiceCache)
        .where(and(
          eq(voiceCache.textHash, textHash),
          eq(voiceCache.voiceProvider, voiceProvider),
          eq(voiceCache.isActive, true)
        ));

      if (cached) {
        // Update hit count
        await db
          .update(voiceCache) 
          .set({ 
            hitCount: cached.hitCount + 1,
            lastUsed: new Date()
          })
          .where(eq(voiceCache.id, cached.id));
        
        console.log(`Voice cache hit for text hash: ${textHash.substring(0, 8)}`);
        return cached;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached voice clip:', error);
      return null;
    }
  }

  async cacheVoiceClip(voiceData: InsertVoiceCache): Promise<void> {
    try {
      await db.insert(voiceCache).values(voiceData);
      console.log(`Cached voice clip: ${voiceData.textHash?.substring(0, 8)}`);
    } catch (error) {
      console.error('Error caching voice clip:', error);
    }
  }

  // Background Processing System
  async startBackgroundProcessing(processData: InsertBackgroundProcessing): Promise<number> {
    try {
      const [process] = await db
        .insert(backgroundProcessing)
        .values({
          ...processData,
          processStatus: 'queued',
          estimatedCompletion: new Date(Date.now() + 30000), // 30 seconds estimate
        })
        .returning();

      console.log(`Started background process: ${process.id} (${processData.processType})`);
      
      // Start processing in background
      this.processInBackground(process.id);
      
      return process.id;
    } catch (error) {
      console.error('Error starting background process:', error);
      throw error;
    }
  }

  private async processInBackground(processId: number): Promise<void> {
    try {
      // Update status to processing
      await db
        .update(backgroundProcessing)
        .set({ processStatus: 'processing' })
        .where(eq(backgroundProcessing.id, processId));

      // Get process details
      const [process] = await db
        .select()
        .from(backgroundProcessing)
        .where(eq(backgroundProcessing.id, processId));

      if (!process) return;

      const startTime = Date.now();
      let result: any = {};

      // Process based on type
      switch (process.processType) {
        case 'early_generation':
          result = await this.handleEarlyGeneration(process.inputData);
          break;
        case 'predictive_load':
          result = await this.handlePredictiveLoad(process.inputData);
          break;
        case 'voice_prepare':
          result = await this.handleVoicePrepare(process.inputData);
          break;
        default:
          throw new Error(`Unknown process type: ${process.processType}`);
      }

      const processingTime = Date.now() - startTime;

      // Update with completion
      await db
        .update(backgroundProcessing)
        .set({
          processStatus: 'completed',
          actualCompletion: new Date(),
          processingTimeMs: processingTime,
          result,
        })
        .where(eq(backgroundProcessing.id, processId));

      console.log(`Completed background process ${processId} in ${processingTime}ms`);

    } catch (error) {
      console.error(`Background process ${processId} failed:`, error);
      
      await db
        .update(backgroundProcessing)
        .set({
          processStatus: 'failed',
          actualCompletion: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(backgroundProcessing.id, processId));
    }
  }

  private async handleEarlyGeneration(inputData: any): Promise<any> {
    // Start generating alibi as soon as 4th question is answered
    const { answers, scenario } = inputData;
    
    if (answers && answers.length >= 4) {
      const predictiveContent = await this.generatePredictiveContent(scenario, answers);
      return { predictiveContent, readyForUser: true };
    }
    
    return { readyForUser: false, reason: 'Insufficient answers' };
  }

  private async handlePredictiveLoad(inputData: any): Promise<any> {
    // Pre-generate common scenarios during idle time
    const commonScenarios = ['work', 'family', 'health', 'transportation'];
    const results = [];

    for (const scenario of commonScenarios) {
      const basicParams = { urgency: 'normal', complexity: 'basic' };
      const content = await this.generatePredictiveContent(scenario, basicParams);
      results.push({ scenario, content });
    }

    return { preloadedScenarios: results.length, scenarios: results };
  }

  private async handleVoicePrepare(inputData: any): Promise<any> {
    // Pre-generate voice clips for common phrases
    const { phrases } = inputData;
    const results = [];

    for (const phrase of phrases) {
      const textHash = crypto.createHash('sha256').update(phrase).digest('hex');
      
      // Check if already cached
      const existing = await this.getCachedVoiceClip(phrase, 'elevenlabs');
      if (existing) {
        results.push({ phrase, cached: true, url: existing.audioUrl });
      } else {
        // Generate and cache
        try {
          const audioResult = await this.generateVoiceClip(phrase);
          results.push({ phrase, cached: false, url: audioResult.url });
        } catch (error) {
          console.error(`Failed to prepare voice for: ${phrase}`, error);
        }
      }
    }

    return { preparedPhrases: results.length, results };
  }

  private async generateVoiceClip(text: string): Promise<{ url: string; duration: number }> {
    // Integrate with ElevenLabs API
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const filename = `voice_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.mp3`;
      const filepath = path.join('uploads', filename);
      
      // Save to file
      fs.writeFileSync(filepath, Buffer.from(audioBuffer));
      
      const textHash = crypto.createHash('sha256').update(text).digest('hex');
      
      // Cache the voice clip
      await this.cacheVoiceClip({
        textHash,
        originalText: text,
        voiceProvider: 'elevenlabs',
        voiceId: 'pNInz6obpgDQGcFmaJgB',
        audioUrl: `/uploads/${filename}`,
        audioFilename: filename,
        duration: 0, // Would need to calculate actual duration
        fileSize: audioBuffer.byteLength,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return { url: `/uploads/${filename}`, duration: 0 };
    } catch (error) {
      console.error('Error generating voice clip:', error);
      throw error;
    }
  }

  // Cache maintenance
  async cleanupExpiredCache(): Promise<void> {
    try {
      const now = new Date();
      
      // Cleanup expired predictive cache
      await db
        .update(predictiveCache)
        .set({ isActive: false })
        .where(and(
          eq(predictiveCache.isActive, true),
          lt(predictiveCache.expiresAt, now)
        ));

      // Cleanup expired voice cache
      await db
        .update(voiceCache)
        .set({ isActive: false })
        .where(and(
          eq(voiceCache.isActive, true),
          lt(voiceCache.expiresAt, now)
        ));

      console.log('Cache cleanup completed');
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  // Get background process status
  async getBackgroundProcessStatus(processId: number): Promise<BackgroundProcessing | null> {
    try {
      const [process] = await db
        .select()
        .from(backgroundProcessing)
        .where(eq(backgroundProcessing.id, processId));

      return process || null;
    } catch (error) {
      console.error('Error getting background process status:', error);
      return null;
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    try {
      const [predictiveStats] = await db
        .select({
          totalEntries: predictiveCache.id.count(),
          totalHits: predictiveCache.hitCount.sum(),
          avgSuccessRate: predictiveCache.successRate.avg(),
        })
        .from(predictiveCache)
        .where(eq(predictiveCache.isActive, true));

      const [voiceStats] = await db
        .select({
          totalClips: voiceCache.id.count(),
          totalHits: voiceCache.hitCount.sum(),
          totalSize: voiceCache.fileSize.sum(),
        })
        .from(voiceCache)
        .where(eq(voiceCache.isActive, true));

      return {
        predictive: predictiveStats,
        voice: voiceStats,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const smartCache = new SmartCacheManager();

// Auto-cleanup task - run every hour
setInterval(() => {
  smartCache.cleanupExpiredCache();
}, 60 * 60 * 1000);