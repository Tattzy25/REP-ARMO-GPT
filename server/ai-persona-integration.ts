// AI Integration with Persona Detection System

import { storage } from "./storage";
import { getPersonaByLevel, PERSONA_LIBRARY } from "./persona-content";
import type { 
  UserMoodDetection, 
  UserEmotionDetection, 
  UserBehaviorDetection,
  UserEngagementDetection,
  UserIntentDetection 
} from "@shared/schema";

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
  
  /**
   * Analyze user message and detect mood, emotion, behavior, engagement, and intent
   */
  async analyzeUserMessage(
    userId: number, 
    sessionId: number, 
    message: string, 
    messageLength: number,
    responseTime: number
  ): Promise<void> {
    
    // Mood Detection - Simple keyword analysis
    const moodAnalysis = this.detectMood(message);
    if (moodAnalysis) {
      await storage.recordMoodDetection({
        id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        detectedMood: moodAnalysis.mood,
        sentimentScore: moodAnalysis.sentimentScore,
        indicators: moodAnalysis.triggers,
        aiResponseAdjustment: `Detected ${moodAnalysis.mood} mood`
      });
    }

    // Emotion Detection
    const emotionAnalysis = this.detectEmotion(message);
    if (emotionAnalysis) {
      await storage.recordEmotionDetection({
        id: `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        primaryEmotion: emotionAnalysis.primary,
        secondaryEmotion: emotionAnalysis.secondary,
        emotionIntensity: emotionAnalysis.intensity,
        indicators: emotionAnalysis.triggers,
        adaptationStrategy: `Adjusting for ${emotionAnalysis.primary} emotion`
      });
    }

    // Behavior Detection
    const behaviorAnalysis = this.detectBehavior(message, messageLength);
    if (behaviorAnalysis) {
      await storage.recordBehaviorDetection({
        id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        behaviorStyle: behaviorAnalysis.type,
        confidenceScore: behaviorAnalysis.confidence,
        indicators: behaviorAnalysis.indicators,
        aiAdjustment: behaviorAnalysis.style
      });
    }

    // Engagement Detection
    const engagementAnalysis = this.detectEngagement(message, messageLength, responseTime);
    if (engagementAnalysis) {
      await storage.recordEngagementDetection({
        id: `engagement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        engagementLevel: engagementAnalysis.level,
        messageLength,
        responseTime: responseTime,
        questionCount: engagementAnalysis.questionCount,
        emojiCount: engagementAnalysis.emojiCount,
        enthusiasmScore: engagementAnalysis.enthusiasmScore
      });
    }

    // Intent Detection
    const intentAnalysis = this.detectIntent(message);
    if (intentAnalysis) {
      await storage.recordIntentDetection({
        id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        intentType: intentAnalysis.intent,
        confidenceScore: intentAnalysis.confidence,
        intentDescription: intentAnalysis.context,
        responseApproach: intentAnalysis.approach,
        requiresPersonaAdjustment: true
      });
    }
  }

  /**
   * Get comprehensive persona context for AI response generation
   */
  async getPersonaContext(userId: number, sessionId: number, currentVibe: string): Promise<PersonaContext> {
    // Import vibe mapping dynamically to avoid circular imports
    const { getPersonaLevelForVibe, getPersonaIdForVibe } = await import('./vibe-persona-mapping.js');
    // Get persona level based on user's vibe mapping
    const personaLevel = getPersonaLevelForVibe(currentVibe);

    const persona = getPersonaByLevel(personaLevel);

    // Get recent user analytics
    const [
      latestGender,
      recentMood,
      recentEmotion, 
      recentBehavior,
      recentEngagement,
      recentIntent
    ] = await Promise.all([
      storage.getLatestGenderDetection(userId),
      storage.getMoodHistory(userId, sessionId, 1),
      storage.getEmotionHistory(userId, sessionId, 1),
      storage.getBehaviorHistory(userId, sessionId, 1),
      storage.getEngagementHistory(userId, sessionId, 1),
      storage.getIntentHistory(userId, sessionId, 1)
    ]);

    // Get content suggestions based on current context
    const contentSuggestions = await this.getRelevantContent(
      recentIntent[0]?.detectedIntent || "casual_chat",
      personaLevel,
      userId
    );

    return {
      currentPersonaLevel: personaLevel,
      systemPrompt: persona.systemPrompt,
      languageRules: persona.languageRules,
      userProfile: {
        gender: latestGender?.detectedGender,
        recentMood: recentMood[0]?.detectedMood || "neutral",
        dominantEmotion: recentEmotion[0]?.primaryEmotion || "neutral",
        behaviorPattern: recentBehavior[0]?.behaviorType || "casual_friendly",
        engagementLevel: recentEngagement[0]?.engagementLevel || "moderate",
        primaryIntent: recentIntent[0]?.detectedIntent || "casual_chat"
      },
      contentSuggestions
    };
  }

  /**
   * Enhanced system prompt with persona context
   */
  buildEnhancedSystemPrompt(context: PersonaContext): string {
    const { systemPrompt, userProfile, contentSuggestions } = context;
    
    let enhancedPrompt = systemPrompt + "\n\n";
    
    enhancedPrompt += "CURRENT USER CONTEXT:\n";
    if (userProfile.gender) {
      enhancedPrompt += `- User Gender: ${userProfile.gender}\n`;
    }
    enhancedPrompt += `- Recent Mood: ${userProfile.recentMood}\n`;
    enhancedPrompt += `- Dominant Emotion: ${userProfile.dominantEmotion}\n`;
    enhancedPrompt += `- Behavior Pattern: ${userProfile.behaviorPattern}\n`;
    enhancedPrompt += `- Engagement Level: ${userProfile.engagementLevel}\n`;
    enhancedPrompt += `- Primary Intent: ${userProfile.primaryIntent}\n`;
    
    if (contentSuggestions.length > 0) {
      enhancedPrompt += "\nRELEVANT CONTENT TO CONSIDER:\n";
      contentSuggestions.forEach((content, index) => {
        enhancedPrompt += `${index + 1}. ${content}\n`;
      });
    }
    
    enhancedPrompt += "\nRespond according to your persona while considering the user's current state and context.";
    
    return enhancedPrompt;
  }

  // Detection Helper Methods

  private detectMood(message: string): { mood: string; confidence: number; triggers: string[]; sentimentScore: number } | null {
    const moodKeywords = {
      positive: ["happy", "great", "awesome", "excited", "love", "perfect", "amazing", "wonderful"],
      negative: ["sad", "angry", "frustrated", "terrible", "hate", "awful", "horrible", "depressed", "annoyed"],
      neutral: ["okay", "fine", "alright", "whatever", "sure"]
    };

    const triggers: string[] = [];
    let sentimentScore = 0;
    
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword)) {
          triggers.push(keyword);
          sentimentScore += mood === "positive" ? 0.3 : mood === "negative" ? -0.3 : 0;
        }
      }
    }

    if (triggers.length === 0) return null;

    const dominantMood = sentimentScore > 0 ? "positive" : sentimentScore < 0 ? "negative" : "neutral";
    
    return {
      mood: dominantMood,
      confidence: Math.min(triggers.length * 0.2, 1.0),
      triggers,
      sentimentScore: Math.max(-1, Math.min(1, sentimentScore))
    };
  }

  private detectEmotion(message: string): { primary: string; secondary: string; intensity: number; confidence: number; triggers: string[] } | null {
    const emotionKeywords = {
      joy: ["happy", "excited", "thrilled", "elated", "cheerful"],
      sadness: ["sad", "depressed", "down", "blue", "melancholy"],
      anger: ["angry", "furious", "mad", "pissed", "irritated"],
      fear: ["scared", "afraid", "worried", "anxious", "nervous"],
      surprise: ["surprised", "shocked", "amazed", "stunned"],
      disgust: ["disgusted", "sick", "revolted", "appalled"]
    };

    const detectedEmotions: { emotion: string; score: number; triggers: string[] }[] = [];

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const triggers: string[] = [];
      let score = 0;
      
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword)) {
          triggers.push(keyword);
          score += 1;
        }
      }
      
      if (triggers.length > 0) {
        detectedEmotions.push({ emotion, score, triggers });
      }
    }

    if (detectedEmotions.length === 0) return null;

    detectedEmotions.sort((a, b) => b.score - a.score);
    
    return {
      primary: detectedEmotions[0].emotion,
      secondary: detectedEmotions[1]?.emotion || "neutral",
      intensity: Math.min(detectedEmotions[0].score * 0.3, 1.0),
      confidence: Math.min(detectedEmotions[0].triggers.length * 0.25, 1.0),
      triggers: detectedEmotions[0].triggers
    };
  }

  private detectBehavior(message: string, length: number): { type: string; confidence: number; indicators: string[]; style: string } | null {
    const behaviorPatterns = {
      polite_formal: ["please", "thank you", "excuse me", "pardon", "kindly"],
      casual_friendly: ["hey", "what's up", "cool", "awesome", "totally"],
      sarcastic: ["sure", "right", "obviously", "of course", "whatever"],
      humorous: ["lol", "haha", "funny", "joke", "hilarious"],
      hostile: ["stupid", "dumb", "shut up", "fuck off", "idiot"],
      flirtatious: ["sexy", "hot", "cute", "baby", "gorgeous"],
      confused: ["what", "huh", "don't understand", "confused", "help"]
    };

    let detectedBehavior = "casual_friendly"; // default
    let maxScore = 0;
    const indicators: string[] = [];

    for (const [behavior, keywords] of Object.entries(behaviorPatterns)) {
      let score = 0;
      const behaviorIndicators: string[] = [];
      
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword)) {
          score += 1;
          behaviorIndicators.push(keyword);
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        detectedBehavior = behavior;
        indicators.length = 0;
        indicators.push(...behaviorIndicators);
      }
    }

    const style = length > 100 ? "verbose" : length > 20 ? "moderate" : "concise";
    
    return {
      type: detectedBehavior,
      confidence: Math.min(maxScore * 0.3, 1.0),
      indicators,
      style
    };
  }

  private detectEngagement(message: string, length: number, responseTime: number): { level: string; questionCount: number; emojiCount: number; enthusiasmScore: number } | null {
    const questionCount = (message.match(/\?/g) || []).length;
    const emojiCount = (message.match(/😀|😁|😂|😃|😄|😅|😆|😇|😈|😉|😊|😋|😌|😍|😎|😏|😐|😑|😒|😓|😔|😕|😖|😗|😘|😙|😚|😛|😜|😝|😞|😟|😠|😡|😢|😣|😤|😥|😦|😧|😨|😩|😪|😫|😬|😭|😮|😯|😰|😱|😲|😳|😴|😵|😶|😷|😸|😹|😺|😻|😼|😽|😾|😿|🙀|🙁|🙂|🙃|🙄|🙅|🙆|🙇|🙈|🙉|🙊|🙋|🙌|🙍|🙎|🙏|:\)|:\(|:D|:P/g) || []).length;
    const exclamationCount = (message.match(/!/g) || []).length;
    
    const enthusiasmScore = (exclamationCount * 0.2) + (emojiCount * 0.3) + (questionCount * 0.1);
    
    let engagementLevel = "moderate";
    
    if (length > 50 && questionCount > 0 && responseTime < 30) {
      engagementLevel = "high";
    } else if (length < 10 && questionCount === 0 && responseTime > 120) {
      engagementLevel = "low";
    } else if (length < 5 && (message.toLowerCase().includes("no") || message.toLowerCase().includes("whatever"))) {
      engagementLevel = "negative";
    }

    return {
      level: engagementLevel,
      questionCount,
      emojiCount,
      enthusiasmScore: Math.min(enthusiasmScore, 1.0)
    };
  }

  private detectIntent(message: string): { intent: string; confidence: number; context: string; approach: string } | null {
    const intentPatterns = {
      information_seeking: ["what", "how", "when", "where", "why", "explain", "tell me"],
      task_request: ["help me", "can you", "please do", "make", "create", "generate"],
      emotional_support: ["feeling", "sad", "depressed", "worried", "scared", "need support"],
      casual_chat: ["hi", "hello", "hey", "what's up", "how are you"],
      complaint: ["hate", "terrible", "awful", "problem", "issue", "complaint"]
    };

    let detectedIntent = "casual_chat";
    let maxScore = 0;
    let context = "";

    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      let score = 0;
      
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    }

    const approaches = {
      information_seeking: "Provide clear, helpful information",
      task_request: "Offer step-by-step assistance", 
      emotional_support: "Be empathetic and supportive",
      casual_chat: "Engage in friendly conversation",
      complaint: "Listen and offer solutions"
    };

    return {
      intent: detectedIntent,
      confidence: Math.min(maxScore * 0.25, 1.0),
      context: message.slice(0, 100),
      approach: approaches[detectedIntent as keyof typeof approaches]
    };
  }

  private async getRelevantContent(intent: string, personaLevel: number, excludeUserId: number): Promise<string[]> {
    try {
      const contentCategory = this.mapIntentToContentCategory(intent);
      const content = await storage.getReusableContent(contentCategory, personaLevel, excludeUserId);
      
      return content.slice(0, 3).map(item => item.contentText);
    } catch (error) {
      return [];
    }
  }

  private mapIntentToContentCategory(intent: string): string {
    const mapping = {
      casual_chat: "jokes_humor",
      emotional_support: "advice",
      information_seeking: "insights_facts", 
      task_request: "advice",
      complaint: "roasts_comebacks"
    };
    
    return mapping[intent as keyof typeof mapping] || "jokes_humor";
  }
}

export const personaAI = new PersonaAIIntegration();