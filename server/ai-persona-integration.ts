// Enhanced AI Persona Integration System for Armo-GPT
import { storage } from "./storage";
import { getPersonaByLevel, PERSONA_LIBRARY } from "./persona-content";

export interface PersonaContext {
  currentPersonaLevel: number;
  systemPrompt: string;
  languageRules: any;
  userProfile: {
    gender?: string;
    recentMood: string;
    dominantEmotion: string;
    behaviorPattern: string;
    engagementLevel: string;
    primaryIntent: string;
  };
  contentSuggestions: string[];
}

export class PersonaAIIntegration {
  getPersonaContext(arg0: number, arg1: number, arg2: string) {
    throw new Error("Method not implemented.");
  }
  getPersonaContextForUser(userId: number, id: number, arg2: string) {
    throw new Error("Method not implemented.");
  }
  
  /**
   * Comprehensive user analysis for Armo-GPT dynamic persona system
   */
 async analyzeUserMessage(
    userId: number, 
    sessionId: number, 
    messageId: number,
    message: string, 
    messageLength: number,
    responseTime: number = 1000
  ): Promise<void> {
    
    try {
      // Run all detection systems in parallel
      await Promise.all([
        this.detectAndStoreMood(userId, sessionId, messageId, message),
        this.detectAndStoreEmotion(userId, sessionId, messageId, message),
        this.detectAndStoreBehavior(userId, sessionId, messageId, message, messageLength),
        this.detectAndStoreEngagement(userId, sessionId, messageId, message, messageLength, responseTime),
        this.detectAndStoreIntent(userId, sessionId, messageId, message),
        this.detectAndStoreGender(userId, sessionId, messageId, message),
        this.analyzeReusableContent(userId, sessionId, messageId, message)
      ]);
      
      // Log successful analysis
      await this.logActivity(userId, sessionId, 'comprehensive_user_analysis', {
        messageLength,
        responseTime,
        timestamp: new Date().toISOString(),
        detectionSystems: ['mood', 'emotion', 'behavior', 'engagement', 'intent', 'gender', 'content']
      });
      
    } catch (error) {
      await this.logError(userId, sessionId, 'user_analysis_failed', error);
      console.error('User analysis failed:', error);
    }
  }

  /**
   * Enhanced mood detection with sentiment analysis
   */
  private async detectAndStoreMood(userId: number, sessionId: number, messageId: number, message: string): Promise<void> {
    const moodData = this.analyzeMoodFromText(message);
    
    if (moodData.confidence > 0.5) {
      try {
        await storage.recordMoodDetection({
          id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          sessionId,
          messageId,
          detectedMood: moodData.mood,
          sentimentScore: moodData.sentimentScore,
          indicators: moodData.triggers
        });
      } catch (error) {
        console.error('Failed to store mood detection:', error);
      }
    }
  }

  /**
   * Emotion pattern detection
   */
  private async detectAndStoreEmotion(userId: number, sessionId: number, messageId: number, message: string): Promise<void> {
    const emotionData = this.analyzeEmotionFromText(message);
    
    if (emotionData.confidence > 0.5) {
      try {
        await storage.recordEmotionDetection({
          id: `emotion_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          userId,
          sessionId,
          primaryEmotion: emotionData.primary,
          emotionIntensity: emotionData.intensity,
          indicators: emotionData.triggers,
          secondaryEmotion: emotionData.secondary
        });
      } catch (error) {
        console.error('Failed to store emotion detection:', error);
      }
    }
  }

  /**
   * Behavior pattern analysis
   */
  private async detectAndStoreBehavior(userId: number, sessionId: number, messageId: number, message: string, messageLength: number): Promise<void> {
    const behaviorData = this.analyzeBehaviorFromText(message, messageLength);
    
    if (behaviorData.confidence > 0.5) {
      try {
        await storage.recordBehaviorDetection({
          id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          sessionId,
          messageId,
          behaviorStyle: behaviorData.style,
          confidenceScore: behaviorData.confidence,
          indicators: behaviorData.triggers
        });
      } catch (error) {
        console.error('Failed to store behavior detection:', error);
      }
    }
  }

  /**
   * Engagement level assessment
   */
  private async detectAndStoreEngagement(userId: number, sessionId: number, messageId: number, message: string, messageLength: number, responseTime: number): Promise<void> {
    const engagementData = this.analyzeEngagementFromText(message, messageLength, responseTime);
    
    if (engagementData.confidence > 0.5) {
      try {
        await storage.recordEngagementDetection({
          id: `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          sessionId,
          messageId,
          engagementLevel: engagementData.level,
          messageLength: messageLength,
          responseTime: responseTime,
          questionCount: engagementData.questionCount,
          emojiCount: engagementData.emojiCount,
          enthusiasmScore: engagementData.enthusiasmScore
        });
      } catch (error) {
        console.error('Failed to store engagement detection:', error);
      }
    }
  }

  /**
   * Intent detection for conversation flow
   */
  private async detectAndStoreIntent(userId: number, sessionId: number, messageId: number, message: string): Promise<void> {
    const intentData = this.analyzeIntentFromText(message);
    
    if (intentData.confidence > 0.5) {
      try {
        await storage.recordIntentDetection({
          id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          sessionId,
          messageId,
          intentType: intentData.intent,
          confidenceScore: intentData.confidence,
          intentDescription: intentData.context,
          responseApproach: intentData.approach
        });
      } catch (error) {
        console.error('Failed to store intent detection:', error);
      }
    }
  }

  /**
   * Gender indicator detection
   */
  private async detectAndStoreGender(userId: number, sessionId: number, messageId: number, message: string): Promise<void> {
    const genderData = this.analyzeGenderFromText(message);
    
    if (genderData.confidence > 0.6) {
      try {
        await storage.recordGenderDetection({
          id: `gender_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          userId,
          sessionId,
          detectedGender: genderData.gender,
          confidenceScore: genderData.confidence,
          detectionMethod: 'language_pattern_analysis'
        });
      } catch (error) {
        console.error('Failed to store gender detection:', error);
      }
    }
  }

  /**
   * Analyze and store reusable content for AI learning
   */
  private async analyzeReusableContent(userId: number, sessionId: number, messageId: number, message: string): Promise<void> {
    const contentData = this.extractReusableContent(message);
    
    if (contentData.isReusable && contentData.qualityScore > 0.6) {
      try {
        await storage.saveReusableContent({
          id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sourceUserId: userId,
          sourceSessionId: sessionId,
          sourceMessageId: messageId,
          contentText: contentData.content,
          contentCategory: contentData.category,
          allowedPersonaLevel: 1,
          qualityScore: contentData.qualityScore,
          usageNotes: contentData.tags.join(', ')
        });
      } catch (error) {
        console.error('Failed to store reusable content:', error);
      }
    }
  }

  /**
   * Build enhanced system prompt with persona context
   */
  buildEnhancedSystemPrompt(context: PersonaContext): string {
    const basePrompt = context.systemPrompt;
    const userProfile = context.userProfile;
    
    const enhancement = `

User Context Analysis:
- Recent Mood: ${userProfile.recentMood}
- Dominant Emotion: ${userProfile.dominantEmotion}
- Behavior Pattern: ${userProfile.behaviorPattern}
- Engagement Level: ${userProfile.engagementLevel}
- Primary Intent: ${userProfile.primaryIntent}
- Gender Indicators: ${userProfile.gender || 'unknown'}

Persona Adaptation Instructions:
- Adjust tone and language style based on user's current emotional state
- Match engagement level with appropriate response depth
- Consider behavior patterns for communication style
- Align response approach with detected intent

Content Suggestions Available: ${context.contentSuggestions.length} relevant items

Respond authentically within your persona while being contextually aware of the user's current state.`;

    return basePrompt + enhancement;
  }

  // Analysis Helper Methods

  private analyzeMoodFromText(message: string): { mood: string; confidence: number; triggers: string[]; sentimentScore: number } {
    const moodIndicators = {
      positive: {
        keywords: ['happy', 'great', 'awesome', 'excited', 'love', 'perfect', 'amazing', 'wonderful', 'fantastic', 'brilliant', 'excellent', 'thrilled', 'delighted', 'pleased', 'satisfied', 'content', 'cheerful', 'optimistic', 'hopeful', 'grateful'],
        weight: 1.0
      },
      negative: {
        keywords: ['sad', 'angry', 'frustrated', 'terrible', 'hate', 'awful', 'horrible', 'depressed', 'annoyed', 'disappointed', 'upset', 'worried', 'anxious', 'stressed', 'overwhelmed', 'exhausted', 'miserable', 'devastated', 'furious', 'irritated'],
        weight: -1.0
      },
      neutral: {
        keywords: ['okay', 'fine', 'alright', 'whatever', 'sure', 'normal', 'average', 'typical', 'usual', 'standard'],
        weight: 0.0
      }
    };

    const triggers: string[] = [];
    let sentimentScore = 0;
    let totalWeight = 0;

    const lowerMessage = message.toLowerCase();
    
    for (const [mood, data] of Object.entries(moodIndicators)) {
      for (const keyword of data.keywords) {
        if (lowerMessage.includes(keyword)) {
          triggers.push(keyword);
          sentimentScore += data.weight;
          totalWeight += Math.abs(data.weight);
        }
      }
    }

    if (triggers.length === 0) {
      return { mood: 'neutral', confidence: 0.1, triggers: [], sentimentScore: 0 };
    }

    const normalizedScore = totalWeight > 0 ? sentimentScore / totalWeight : 0;
    const dominantMood = normalizedScore > 0.2 ? 'positive' : normalizedScore < -0.2 ? 'negative' : 'neutral';
    const confidence = Math.min(triggers.length * 0.15 + Math.abs(normalizedScore) * 0.5, 1.0);

    return {
      mood: dominantMood,
      confidence,
      triggers,
      sentimentScore: Math.max(-1, Math.min(1, normalizedScore))
    };
  }

  private analyzeEmotionFromText(message: string): { primary: string; secondary: string; intensity: number; confidence: number; triggers: string[] } {
    const emotionKeywords = {
      joy: ['happy', 'excited', 'thrilled', 'elated', 'cheerful', 'delighted', 'ecstatic', 'overjoyed'],
      sadness: ['sad', 'depressed', 'down', 'blue', 'melancholy', 'heartbroken', 'devastated', 'grief'],
      anger: ['angry', 'furious', 'mad', 'pissed', 'irritated', 'enraged', 'livid', 'outraged'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified', 'panicked', 'frightened'],
      surprise: ['surprised', 'shocked', 'amazed', 'stunned', 'astonished', 'bewildered', 'startled'],
      disgust: ['disgusted', 'sick', 'revolted', 'appalled', 'repulsed', 'nauseated'],
      anticipation: ['excited', 'eager', 'hopeful', 'expectant', 'looking forward', 'anticipating'],
      trust: ['trust', 'confident', 'secure', 'comfortable', 'safe', 'reliable']
    };

    const detectedEmotions: { emotion: string; score: number; triggers: string[] }[] = [];
    const lowerMessage = message.toLowerCase();

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const triggers: string[] = [];
      let score = 0;
      
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          triggers.push(keyword);
          score += 1;
        }
      }
      
      if (score > 0) {
        detectedEmotions.push({ emotion, score, triggers });
      }
    }

    if (detectedEmotions.length === 0) {
      return { primary: 'neutral', secondary: 'calm', intensity: 0.1, confidence: 0.1, triggers: [] };
    }

    detectedEmotions.sort((a, b) => b.score - a.score);
    const primary = detectedEmotions[0];
    const secondary = detectedEmotions[1] || { emotion: 'neutral', score: 0, triggers: [] };
    
    const totalTriggers = detectedEmotions.reduce((sum, e) => sum + e.triggers.length, 0);
    const intensity = Math.min(primary.score * 0.3, 1.0);
    const confidence = Math.min(totalTriggers * 0.2, 1.0);

    return {
      primary: primary.emotion,
      secondary: secondary.emotion,
      intensity,
      confidence,
      triggers: primary.triggers
    };
  }

  private analyzeBehaviorFromText(message: string, messageLength: number): {
    triggers: string[] | null | undefined; style: string; confidence: number; indicators: string[] 
} {
    const behaviorPatterns = {
      formal: {
        indicators: ['please', 'thank you', 'would you', 'could you', 'may I', 'excuse me', 'pardon', 'sir', 'madam'],
        lengthPreference: 'medium_to_long'
      },
      casual: {
        indicators: ['hey', 'hi', 'yeah', 'ok', 'cool', 'awesome', 'lol', 'haha', 'btw', 'omg'],
        lengthPreference: 'short_to_medium'
      },
      enthusiastic: {
        indicators: ['!', '!!', '!!!', 'amazing', 'incredible', 'fantastic', 'wow', 'awesome', 'love it'],
        lengthPreference: 'any'
      },
      analytical: {
        indicators: ['because', 'therefore', 'however', 'moreover', 'furthermore', 'in conclusion', 'analysis', 'data'],
        lengthPreference: 'long'
      },
      direct: {
        indicators: ['need', 'want', 'do this', 'make it', 'fix', 'solve', 'help me', 'show me'],
        lengthPreference: 'short'
      }
    };

    const detectedPatterns: { style: string; score: number; indicators: string[] }[] = [];
    const lowerMessage = message.toLowerCase();

    for (const [style, data] of Object.entries(behaviorPatterns)) {
      const foundIndicators: string[] = [];
      let score = 0;
      
      for (const indicator of data.indicators) {
        if (lowerMessage.includes(indicator)) {
          foundIndicators.push(indicator);
          score += 1;
        }
      }
      
      // Adjust score based on message length preference
      const lengthBonus = this.calculateLengthBonus(messageLength, data.lengthPreference);
      score += lengthBonus;
      
      if (score > 0) {
        detectedPatterns.push({ style, score, indicators: foundIndicators });
      }
    }

    if (detectedPatterns.length === 0) {
      return { style: 'neutral', confidence: 0.1, indicators: [], triggers: [] };
    }

    detectedPatterns.sort((a, b) => b.score - a.score);
    const dominant = detectedPatterns[0];
    const confidence = Math.min(dominant.score * 0.2, 1.0);

    return {
      style: dominant.style,
      confidence,
      triggers: dominant.indicators,
      indicators: dominant.indicators
    };
  }

  private analyzeEngagementFromText(message: string, messageLength: number, responseTime: number): { level: string; confidence: number; questionCount: number; emojiCount: number; enthusiasmScore: number } {
    const questionCount = (message.match(/\?/g) || []).length;
    const emojiCount = (message.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || []).length;
    const exclamationCount = (message.match(/!/g) || []).length;
    
    let enthusiasmScore = 0;
    enthusiasmScore += questionCount * 0.2;
    enthusiasmScore += emojiCount * 0.3;
    enthusiasmScore += exclamationCount * 0.1;
    enthusiasmScore += Math.min(messageLength / 100, 1.0) * 0.2;
    enthusiasmScore += Math.max(0, (5000 - responseTime) / 5000) * 0.2;

    let engagementLevel = 'low';
    if (enthusiasmScore > 0.7) engagementLevel = 'high';
    else if (enthusiasmScore > 0.4) engagementLevel = 'medium';

    const confidence = Math.min(enthusiasmScore, 1.0);

    return {
      level: engagementLevel,
      confidence,
      questionCount,
      emojiCount,
      enthusiasmScore
    };
  }

  private analyzeIntentFromText(message: string): { intent: string; confidence: number; context: string; approach: string } {
    const intentPatterns = {
      question: {
        patterns: ['?', 'how', 'what', 'when', 'where', 'why', 'who', 'can you', 'do you know'],
        approach: 'informative_helpful'
      },
      request: {
        patterns: ['please', 'can you', 'would you', 'help me', 'I need', 'could you'],
        approach: 'supportive_action_oriented'
      },
      casual_chat: {
        patterns: ['hi', 'hello', 'hey', 'how are you', 'what\'s up', 'good morning'],
        approach: 'friendly_conversational'
      },
      problem_solving: {
        patterns: ['problem', 'issue', 'error', 'fix', 'solve', 'troubleshoot', 'help'],
        approach: 'analytical_solution_focused'
      },
      creative: {
        patterns: ['create', 'make', 'design', 'write', 'generate', 'come up with'],
        approach: 'creative_collaborative'
      },
      emotional_support: {
        patterns: ['feel', 'sad', 'worried', 'stressed', 'anxious', 'upset', 'frustrated'],
        approach: 'empathetic_supportive'
      }
    };

    const lowerMessage = message.toLowerCase();
    let bestMatch = { intent: 'casual_chat', confidence: 0.1, context: 'general conversation', approach: 'friendly_conversational' };

    for (const [intent, data] of Object.entries(intentPatterns)) {
      let score = 0;
      const matchedPatterns: string[] = [];
      
      for (const pattern of data.patterns) {
        if (lowerMessage.includes(pattern)) {
          score += 1;
          matchedPatterns.push(pattern);
        }
      }
      
      const confidence = Math.min(score * 0.3, 1.0);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          intent,
          confidence,
          context: `Detected patterns: ${matchedPatterns.join(', ')}`,
          approach: data.approach
        };
      }
    }

    return bestMatch;
  }

  private analyzeGenderFromText(message: string): { gender: string; confidence: number } {
    const genderIndicators = {
      male: ['bro', 'dude', 'man', 'guy', 'sir', 'mr', 'he/him', 'boyfriend', 'husband', 'father', 'dad'],
      female: ['girl', 'woman', 'lady', 'ma\'am', 'mrs', 'ms', 'she/her', 'girlfriend', 'wife', 'mother', 'mom'],
      non_binary: ['they/them', 'non-binary', 'enby', 'genderfluid', 'agender']
    };

    const lowerMessage = message.toLowerCase();
    let bestMatch = { gender: 'unknown', confidence: 0.0 };

    for (const [gender, indicators] of Object.entries(genderIndicators)) {
      let score = 0;
      
      for (const indicator of indicators) {
        if (lowerMessage.includes(indicator)) {
          score += 1;
        }
      }
      
      const confidence = Math.min(score * 0.4, 1.0);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { gender, confidence };
      }
    }

    return bestMatch;
  }

  private extractReusableContent(message: string): { isReusable: boolean; content: string; category: string; qualityScore: number; tags: string[] } {
    const qualityIndicators = {
      informative: ['explain', 'because', 'reason', 'how to', 'step by step', 'tutorial'],
      creative: ['story', 'imagine', 'creative', 'artistic', 'design', 'innovative'],
      helpful: ['tip', 'advice', 'suggestion', 'recommend', 'useful', 'helpful'],
      technical: ['code', 'programming', 'algorithm', 'technical', 'implementation', 'solution']
    };

    const lowerMessage = message.toLowerCase();
    let qualityScore = 0;
    let category = 'general';
    const tags: string[] = [];

    // Base quality from message length and structure
    if (message.length > 50) qualityScore += 0.2;
    if (message.length > 150) qualityScore += 0.2;
    if (message.includes('.') || message.includes('!') || message.includes('?')) qualityScore += 0.1;

    // Category and quality detection
    for (const [cat, indicators] of Object.entries(qualityIndicators)) {
      let categoryScore = 0;
      
      for (const indicator of indicators) {
        if (lowerMessage.includes(indicator)) {
          categoryScore += 0.1;
          tags.push(indicator);
        }
      }
      
      if (categoryScore > 0) {
        qualityScore += categoryScore;
        if (categoryScore > 0.2) {
          category = cat;
        }
      }
    }

    const isReusable = qualityScore > 0.3 && message.length > 30;

    return {
      isReusable,
      content: message,
      category,
      qualityScore: Math.min(qualityScore, 1.0),
      tags
    };
  }

  private calculateLengthBonus(messageLength: number, preference: string): number {
    switch (preference) {
      case 'short':
        return messageLength < 50 ? 0.2 : 0;
      case 'short_to_medium':
        return messageLength >= 20 && messageLength <= 100 ? 0.2 : 0;
      case 'medium_to_long':
        return messageLength >= 50 && messageLength <= 200 ? 0.2 : 0;
      case 'long':
        return messageLength > 100 ? 0.2 : 0;
      default:
        return 0;
    }
  }

  // Utility methods for logging and error handling
  private async logActivity(userId: number, sessionId: number, activity: string, data: any): Promise<void> {
    try {
      console.log(`[PersonaAI] User ${userId}, Session ${sessionId}: ${activity}`, data);
      // Could store in database for analytics
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  private async logError(userId: number, sessionId: number, errorType: string, error: any): Promise<void> {
    try {
      console.error(`[PersonaAI Error] User ${userId}, Session ${sessionId}: ${errorType}`, error);
      // Could store in database for debugging
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Context building methods
  async buildPersonaContext(userId: number, sessionId: number, requestedPersonaLevel?: number): Promise<PersonaContext> {
    try {
      // Get recent user data
      const [recentMood, recentEmotion, recentBehavior, recentEngagement, recentIntent, latestGender] = await Promise.all([
        storage.getRecentMoodDetections(userId, 5),
        storage.getRecentEmotionDetections(userId, 5),
        storage.getRecentBehaviorDetections(userId, 5),
        storage.getRecentEngagementDetections(userId, 5),
        storage.getRecentIntentDetections(userId, 5),
        storage.getLatestGenderDetection(userId)
      ]);

      // Determine persona level
      const personaLevel = requestedPersonaLevel || this.calculateOptimalPersonaLevel(recentMood, recentEmotion, recentEngagement);
      const persona = getPersonaByLevel(personaLevel);

      if (!persona) {
        throw new Error(`Persona not found for level ${personaLevel}`);
      }

      // Get relevant content suggestions
      const contentSuggestions = await this.getRelevantContentSuggestions(userId, sessionId, 3);

      return {
        currentPersonaLevel: personaLevel,
        systemPrompt: persona.systemPrompt,
        languageRules: persona.languageRules,
        userProfile: {
          gender: latestGender?.detectedGender,
          recentMood: recentMood[0]?.detectedMood || "neutral",
          dominantEmotion: recentEmotion[0]?.primaryEmotion || "neutral",
          behaviorPattern: recentBehavior[0]?.behaviorStyle || "casual",
          engagementLevel: recentEngagement[0]?.engagementLevel || "medium",
          primaryIntent: recentIntent[0]?.intentType || "casual_chat"
        },
        contentSuggestions
      };
    } catch (error) {
      console.error('Failed to build persona context:', error);
      // Return default context
      const defaultPersona = getPersonaByLevel(1);
      return {
        currentPersonaLevel: 1,
        systemPrompt: defaultPersona?.systemPrompt || "You are a helpful AI assistant.",
        languageRules: defaultPersona?.languageRules || {},
        userProfile: {
          recentMood: "neutral",
          dominantEmotion: "neutral",
          behaviorPattern: "casual",
          engagementLevel: "medium",
          primaryIntent: "casual_chat"
        },
        contentSuggestions: []
      };
    }
  }

  private calculateOptimalPersonaLevel(moodData: any[], emotionData: any[], engagementData: any[]): number {
    // Simple algorithm to determine persona level based on user state
    let level = 1; // Default

    // Increase level based on engagement
    if (engagementData.length > 0 && engagementData[0].engagementLevel === 'high') {
      level += 1;
    }

    // Adjust based on mood
    if (moodData.length > 0) {
      const mood = moodData[0].detectedMood;
      if (mood === 'positive') level += 1;
      if (mood === 'negative') level = Math.max(1, level - 1);
    }

    // Cap at available persona levels
    return Math.min(level, 3);
  }

  private async getRelevantContentSuggestions(userId: number, sessionId: number, limit: number): Promise<string[]> {
    try {
      const reusableContent = await storage.getReusableContentForUser(userId, limit);
      return reusableContent.map(content => content.contentText);
    } catch (error) {
      console.error('Failed to get content suggestions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const personaAI = new PersonaAIIntegration();