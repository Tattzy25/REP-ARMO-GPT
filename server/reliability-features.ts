import { db } from "./db";
import { 
  alibiTemplates,
  userSessions,
  type InsertUserSession
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Graceful Degradation Manager
export class GracefulDegradationManager {
  private static fallbackTemplates = [
    {
      id: 'emergency_work',
      title: 'Work Emergency',
      content: 'I had an unexpected family emergency that required my immediate attention. I apologize for any inconvenience and will make sure to catch up on everything I missed.',
      category: 'work',
      believability: 8.5
    },
    {
      id: 'emergency_social',
      title: 'Social Event',
      content: 'Unfortunately, I came down with something sudden and don\'t want to risk getting others sick. I was really looking forward to this and hope we can reschedule soon.',
      category: 'social',
      believability: 8.0
    },
    {
      id: 'emergency_family',
      title: 'Family Commitment',
      content: 'I had a prior family commitment that I completely forgot about. You know how Armenian families can be - when they call, you have to show up. Sorry for the last-minute notice.',
      category: 'family',
      believability: 8.2
    },
    {
      id: 'emergency_health',
      title: 'Health Issue',
      content: 'I woke up feeling really unwell and don\'t think it would be wise for me to come in today. I should be feeling better by tomorrow and will keep you updated.',
      category: 'health',
      believability: 8.8
    },
    {
      id: 'emergency_transport',
      title: 'Transportation',
      content: 'My car broke down unexpectedly this morning and I\'m waiting for roadside assistance. I\'m trying to arrange alternative transportation but it might take a while.',
      category: 'transport',
      believability: 8.3
    }
  ];

  async getOfflineMode(): Promise<{
    isOnline: boolean;
    availableFeatures: string[];
    fallbackTemplates: any[];
    offlineMessage: string;
  }> {
    const isOnline = await this.checkOnlineStatus();
    
    return {
      isOnline,
      availableFeatures: isOnline 
        ? ['ai_generation', 'voice_synthesis', 'achievement_tracking', 'social_features']
        : ['basic_templates', 'manual_creation', 'local_storage'],
      fallbackTemplates: GracefulDegradationManager.fallbackTemplates,
      offlineMessage: isOnline 
        ? 'All features available'
        : 'Limited offline mode - using cached templates and basic functionality'
    };
  }

  private async checkOnlineStatus(): Promise<boolean> {
    try {
      // Test connection to primary services
      const tests = [
        this.testAPIConnection('https://api.groq.com/openai/v1/models', process.env.GROQ_API_KEY),
        this.testAPIConnection('https://api.elevenlabs.io/v1/voices', process.env.ELEVENLABS_API_KEY),
        this.testDatabaseConnection()
      ];

      const results = await Promise.allSettled(tests);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      // Consider online if at least 2 out of 3 services are available
      return successCount >= 2;
    } catch (error) {
      console.error('Error checking online status:', error);
      return false;
    }
  }

  private async testAPIConnection(url: string, apiKey?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      
      if (apiKey) {
        if (url.includes('groq.com')) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        } else if (url.includes('elevenlabs.io')) {
          headers['xi-api-key'] = apiKey;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async testDatabaseConnection(): Promise<boolean> {
    try {
      await db.select().from(alibiTemplates).limit(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateOfflineAlibi(
    scenario: string,
    urgency: 'low' | 'medium' | 'high' = 'medium',
    category?: string
  ): Promise<{
    alibi: string;
    believabilityScore: number;
    source: 'template' | 'basic_generation';
    limitations: string[];
  }> {
    try {
      // Find best matching template
      const matchingTemplates = GracefulDegradationManager.fallbackTemplates.filter(t => 
        !category || t.category === category
      );

      if (matchingTemplates.length === 0) {
        return this.generateBasicAlibi(scenario, urgency);
      }

      // Select template based on urgency and believability
      const template = urgency === 'high' 
        ? matchingTemplates.reduce((best, current) => 
            current.believability > best.believability ? current : best
          )
        : matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)];

      return {
        alibi: template.content,
        believabilityScore: template.believability,
        source: 'template',
        limitations: [
          'No AI personalization available',
          'Limited to pre-built templates',
          'No voice synthesis available',
          'Achievement tracking disabled'
        ]
      };
    } catch (error) {
      console.error('Error generating offline alibi:', error);
      return this.generateBasicAlibi(scenario, urgency);
    }
  }

  private generateBasicAlibi(scenario: string, urgency: 'low' | 'medium' | 'high'): any {
    const basicExcuses = {
      low: [
        'I had a scheduling conflict that I couldn\'t avoid.',
        'Something unexpected came up that required my attention.',
        'I had a prior commitment that I had forgotten about.'
      ],
      medium: [
        'I had a family emergency that required immediate attention.',
        'I came down with something and don\'t want to spread it.',
        'I had transportation issues that prevented me from attending.'
      ],
      high: [
        'There was a serious family emergency that required my immediate presence.',
        'I had a medical emergency that needed urgent attention.',
        'There was an unexpected crisis that I had to handle immediately.'
      ]
    };

    const excuses = basicExcuses[urgency];
    const selectedExcuse = excuses[Math.floor(Math.random() * excuses.length)];

    return {
      alibi: selectedExcuse,
      believabilityScore: urgency === 'high' ? 8.5 : urgency === 'medium' ? 7.5 : 6.5,
      source: 'basic_generation',
      limitations: [
        'No AI enhancement available',
        'Basic template only',
        'No personalization',
        'Limited believability optimization'
      ]
    };
  }

  async enableProgressiveEnhancement(
    baseAlibi: string,
    userPreferences: any
  ): Promise<{
    enhancedAlibi: string;
    enhancementLevel: 'basic' | 'intermediate' | 'advanced';
    featuresEnabled: string[];
  }> {
    const onlineStatus = await this.getOfflineMode();
    
    if (!onlineStatus.isOnline) {
      return {
        enhancedAlibi: baseAlibi,
        enhancementLevel: 'basic',
        featuresEnabled: ['basic_text']
      };
    }

    // Progressive enhancement based on available services
    const enhancements = [];
    const featuresEnabled = ['basic_text'];

    try {
      // Level 1: Basic AI enhancement
      if (await this.testAPIConnection('https://api.groq.com/openai/v1/models', process.env.GROQ_API_KEY)) {
        const enhanced = await this.applyBasicAIEnhancement(baseAlibi, userPreferences);
        enhancements.push(enhanced);
        featuresEnabled.push('ai_enhancement');
      }

      // Level 2: Cultural and personality enhancement
      if (enhancements.length > 0 && userPreferences.armenianMix > 0) {
        const cultural = await this.applyCulturalEnhancement(enhancements[0] || baseAlibi, userPreferences);
        enhancements.push(cultural);
        featuresEnabled.push('cultural_context');
      }

      // Level 3: Believability optimization
      if (enhancements.length > 0) {
        const optimized = await this.applyBelievabilityOptimization(enhancements[enhancements.length - 1] || baseAlibi);
        enhancements.push(optimized);
        featuresEnabled.push('believability_optimization');
      }

      const finalAlibi = enhancements[enhancements.length - 1] || baseAlibi;
      const enhancementLevel = 
        featuresEnabled.length >= 4 ? 'advanced' : 
        featuresEnabled.length >= 3 ? 'intermediate' : 'basic';

      return {
        enhancedAlibi: finalAlibi,
        enhancementLevel,
        featuresEnabled
      };
    } catch (error) {
      console.error('Error in progressive enhancement:', error);
      return {
        enhancedAlibi: baseAlibi,
        enhancementLevel: 'basic',
        featuresEnabled: ['basic_text']
      };
    }
  }

  private async applyBasicAIEnhancement(alibi: string, userPreferences: any): Promise<string> {
    // Apply basic AI improvements if Groq is available
    const prompt = `Improve this alibi by making it more natural and believable:

"${alibi}"

Make it sound more conversational and authentic. Keep it concise.`;

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
          max_tokens: 200,
        }),
      });

      const data = await response.json();
      return data.choices[0]?.message?.content || alibi;
    } catch (error) {
      return alibi;
    }
  }

  private async applyCulturalEnhancement(alibi: string, userPreferences: any): Promise<string> {
    if (userPreferences.armenianMix <= 0) return alibi;

    // Add Armenian cultural elements
    const armenianPhrases = ['Listen hopar', 'akhper', 'you know how it is'];
    const culturalRefs = ['family', 'Armenian', 'cousin'];

    let enhanced = alibi;

    // Randomly add cultural elements based on user preference
    if (Math.random() < userPreferences.armenianMix) {
      const phrase = armenianPhrases[Math.floor(Math.random() * armenianPhrases.length)];
      enhanced = enhanced.replace(/\.$/, `, ${phrase}.`);
    }

    return enhanced;
  }

  private async applyBelievabilityOptimization(alibi: string): Promise<string> {
    // Add specific details to increase believability
    const timeElements = ['this morning', 'around 9 AM', 'yesterday evening', 'just now'];
    const specificDetails = ['the doctor said', 'AAA roadside assistance', 'my cousin called', 'the mechanic confirmed'];

    let optimized = alibi;

    // Add time element if not present
    if (!optimized.match(/\b(morning|afternoon|evening|today|yesterday|now)\b/i)) {
      const timeElement = timeElements[Math.floor(Math.random() * timeElements.length)];
      optimized = optimized.replace(/\b(I|My)\b/, `${timeElement}, $1`);
    }

    // Add specific detail if alibi is too vague
    if (optimized.length < 100) {
      const detail = specificDetails[Math.floor(Math.random() * specificDetails.length)];
      optimized = optimized.replace(/\.$/, ` - ${detail}.`);
    }

    return optimized;
  }
}

// Multi-Provider Backup System
export class MultiProviderBackupManager {
  private static providers = {
    ai: [
      { name: 'groq', endpoint: 'https://api.groq.com/openai/v1', model: 'llama-3.1-70b-versatile', priority: 1 },
      { name: 'openai', endpoint: 'https://api.openai.com/v1', model: 'gpt-4o', priority: 2 }
    ],
    voice: [
      { name: 'elevenlabs', endpoint: 'https://api.elevenlabs.io', priority: 1 },
      { name: 'browser_speech', endpoint: 'local', priority: 2 }
    ],
    database: [
      { name: 'primary_db', connection: process.env.DATABASE_URL, priority: 1 },
      { name: 'fallback_memory', connection: 'memory', priority: 2 }
    ]
  };

  async getAvailableProviders(): Promise<{
    ai: any[];
    voice: any[];
    database: any[];
    healthStatus: Record<string, boolean>;
  }> {
    const healthStatus: Record<string, boolean> = {};
    
    // Test AI providers
    for (const provider of MultiProviderBackupManager.providers.ai) {
      healthStatus[provider.name] = await this.testAIProvider(provider);
    }

    // Test voice providers
    for (const provider of MultiProviderBackupManager.providers.voice) {
      healthStatus[provider.name] = await this.testVoiceProvider(provider);
    }

    // Test database providers
    for (const provider of MultiProviderBackupManager.providers.database) {
      healthStatus[provider.name] = await this.testDatabaseProvider(provider);
    }

    return {
      ai: MultiProviderBackupManager.providers.ai.filter(p => healthStatus[p.name]),
      voice: MultiProviderBackupManager.providers.voice.filter(p => healthStatus[p.name]),
      database: MultiProviderBackupManager.providers.database.filter(p => healthStatus[p.name]),
      healthStatus
    };
  }

  private async testAIProvider(provider: any): Promise<boolean> {
    try {
      const apiKey = provider.name === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
      
      const response = await fetch(`${provider.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(10000)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async testVoiceProvider(provider: any): Promise<boolean> {
    if (provider.name === 'browser_speech') {
      // Browser speech synthesis is always available
      return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }

    try {
      const response = await fetch(`${provider.endpoint}/v1/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        },
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async testDatabaseProvider(provider: any): Promise<boolean> {
    if (provider.name === 'fallback_memory') {
      return true; // Memory storage is always available
    }

    try {
      await db.select().from(alibiTemplates).limit(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  async generateWithFallback(
    prompt: string,
    options: any = {}
  ): Promise<{
    content: string;
    provider: string;
    fallbackUsed: boolean;
    error?: string;
  }> {
    const availableProviders = await this.getAvailableProviders();
    const aiProviders = availableProviders.ai.sort((a, b) => a.priority - b.priority);

    for (const provider of aiProviders) {
      try {
        const content = await this.callAIProvider(provider, prompt, options);
        return {
          content,
          provider: provider.name,
          fallbackUsed: provider.priority > 1
        };
      } catch (error) {
        console.error(`AI provider ${provider.name} failed:`, error);
        continue;
      }
    }

    // Ultimate fallback
    return {
      content: 'I apologize, but I\'m unable to generate a custom response right now. Please try again later or use one of our pre-built templates.',
      provider: 'fallback',
      fallbackUsed: true,
      error: 'All AI providers unavailable'
    };
  }

  private async callAIProvider(provider: any, prompt: string, options: any): Promise<string> {
    const apiKey = provider.name === 'groq' ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
    
    const response = await fetch(`${provider.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Provider ${provider.name} returned ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async synthesizeVoiceWithFallback(
    text: string,
    voiceId?: string
  ): Promise<{
    audioUrl?: string;
    audioData?: ArrayBuffer;
    provider: string;
    fallbackUsed: boolean;
    error?: string;
  }> {
    const availableProviders = await this.getAvailableProviders();
    const voiceProviders = availableProviders.voice.sort((a, b) => a.priority - b.priority);

    for (const provider of voiceProviders) {
      try {
        if (provider.name === 'elevenlabs') {
          const result = await this.callElevenLabsAPI(text, voiceId);
          return {
            audioData: result,
            provider: provider.name,
            fallbackUsed: provider.priority > 1
          };
        } else if (provider.name === 'browser_speech') {
          // Browser speech synthesis fallback
          return {
            audioUrl: 'browser_speech', // Special indicator for client-side synthesis
            provider: provider.name,
            fallbackUsed: true
          };
        }
      } catch (error) {
        console.error(`Voice provider ${provider.name} failed:`, error);
        continue;
      }
    }

    return {
      provider: 'none',
      fallbackUsed: true,
      error: 'All voice providers unavailable'
    };
  }

  private async callElevenLabsAPI(text: string, voiceId?: string): Promise<ArrayBuffer> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || 'pNInz6obpgDQGcFmaJgB'}`, {
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

    if (!response.ok) {
      throw new Error(`ElevenLabs API returned ${response.status}`);
    }

    return await response.arrayBuffer();
  }

  // Health monitoring and automatic failover
  startHealthMonitoring(): void {
    setInterval(async () => {
      const providers = await this.getAvailableProviders();
      const healthReport = {
        timestamp: new Date(),
        ai: providers.ai.length,
        voice: providers.voice.length,
        database: providers.database.length,
        status: providers.healthStatus
      };

      console.log('Provider health check:', healthReport);
      
      // Alert if primary providers are down
      if (!providers.healthStatus.groq && !providers.healthStatus.openai) {
        console.warn('WARNING: All AI providers are down - using fallback mode');
      }
      
      if (!providers.healthStatus.elevenlabs) {
        console.warn('WARNING: ElevenLabs is down - using browser speech synthesis');
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
  }
}

// Progressive Enhancement Controller
export class ProgressiveEnhancementController {
  
  async getFeatureMatrix(userCapabilities: any): Promise<{
    core: string[];
    enhanced: string[];
    premium: string[];
    experimental: string[];
  }> {
    const isOnline = await this.checkConnectivity();
    const hasModernBrowser = this.checkBrowserCapabilities(userCapabilities);
    const hasHighBandwidth = this.checkBandwidthCapabilities(userCapabilities);

    return {
      core: [
        'basic_text_input',
        'simple_templates',
        'offline_storage',
        'basic_ui'
      ],
      enhanced: isOnline ? [
        'ai_generation',
        'real_time_analysis',
        'achievement_system',
        'basic_voice_synthesis'
      ] : [],
      premium: (isOnline && hasModernBrowser) ? [
        'streaming_generation',
        'voice_personalities',
        'advanced_analytics',
        'social_features'
      ] : [],
      experimental: (isOnline && hasModernBrowser && hasHighBandwidth) ? [
        'real_time_collaboration',
        'predictive_suggestions',
        'advanced_voice_effects',
        'ar_integration'
      ] : []
    };
  }

  private async checkConnectivity(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    
    try {
      await fetch('/api/health', { method: 'HEAD' });
      return true;
    } catch {
      return false;
    }
  }

  private checkBrowserCapabilities(userCapabilities: any): boolean {
    const modernFeatures = [
      'serviceWorker',
      'webAudio',
      'webGL',
      'localStorage',
      'indexedDB'
    ];

    return modernFeatures.every(feature => 
      userCapabilities.features && userCapabilities.features.includes(feature)
    );
  }

  private checkBandwidthCapabilities(userCapabilities: any): boolean {
    // Check for high bandwidth (>= 5 Mbps)
    return userCapabilities.connection && 
           userCapabilities.connection.downlink >= 5;
  }

  async enableFeatureGracefully(
    featureName: string,
    fallbackBehavior?: () => void
  ): Promise<boolean> {
    try {
      switch (featureName) {
        case 'voice_synthesis':
          return await this.enableVoiceSynthesis(fallbackBehavior);
        case 'real_time_analytics':
          return await this.enableRealTimeAnalytics(fallbackBehavior);
        case 'advanced_ui':
          return await this.enableAdvancedUI(fallbackBehavior);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to enable feature ${featureName}:`, error);
      if (fallbackBehavior) fallbackBehavior();
      return false;
    }
  }

  private async enableVoiceSynthesis(fallback?: () => void): Promise<boolean> {
    // Try ElevenLabs first, then browser speech synthesis
    const providers = new MultiProviderBackupManager();
    const result = await providers.synthesizeVoiceWithFallback('test', 'pNInz6obpgDQGcFmaJgB');
    
    if (result.error) {
      if (fallback) fallback();
      return false;
    }
    
    return true;
  }

  private async enableRealTimeAnalytics(fallback?: () => void): Promise<boolean> {
    try {
      // Test analytics endpoint
      const response = await fetch('/api/analytics/test', { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      if (fallback) fallback();
      return false;
    }
  }

  private async enableAdvancedUI(fallback?: () => void): Promise<boolean> {
    // Check for advanced UI capabilities
    if (typeof window === 'undefined') return false;
    
    const hasModernFeatures = 'IntersectionObserver' in window && 
                             'ResizeObserver' in window &&
                             'requestAnimationFrame' in window;
    
    if (!hasModernFeatures && fallback) {
      fallback();
    }
    
    return hasModernFeatures;
  }
}

// Export singleton instances
export const gracefulDegradation = new GracefulDegradationManager();
export const multiProviderBackup = new MultiProviderBackupManager();
export const progressiveEnhancement = new ProgressiveEnhancementController();

// Start health monitoring
multiProviderBackup.startHealthMonitoring();