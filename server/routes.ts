import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import personaApiRouter from "./persona-api";
import { personaAI } from "./ai-persona-integration";
import { getPersonaLevelForVibe, getPersonaIdForVibe } from "./vibe-persona-mapping";

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "default_key";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY_ENV_VAR || "default_key";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY_ENV_VAR || "default_key";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images, audio, video, and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register persona management API routes
  app.use("/api", personaApiRouter);
  
  // Import and register social sharing routes
  const socialPersonaRoutes = await import("./social-persona-routes");
  app.use("/api/social", socialPersonaRoutes.default);

  // Seed endpoint for initial persona data
  app.post("/api/seed-personas", async (req: Request, res: Response) => {
    try {
      const { seedPersonaData } = await import("./seed-personas");
      const result = await seedPersonaData();
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to seed persona data" });
    }
  });
  
  // Get chat history for a specific vibe
  app.get("/api/chat/:vibe/history", async (req, res) => {
    try {
      const { vibe } = req.params;
      console.log('Fetching chat history for vibe:', vibe);
      
      const sessions = await storage.getChatSessionsByUserAndVibe(null, vibe);
      console.log('Found sessions:', sessions.length);
      
      if (sessions.length === 0) {
        return res.json({ messages: [] });
      }
      
      const latestSession = sessions[sessions.length - 1];
      console.log('Latest session ID:', latestSession.id);
      
      const messages = await storage.getMessagesBySession(latestSession.id);
      console.log('Found messages:', messages.length);
      
      res.json({ sessionId: latestSession.id, messages });
    } catch (error: any) {
      console.error('Chat history error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: "Failed to fetch chat history", details: error.message });
    }
  });

  // Create new chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const { vibe } = insertChatSessionSchema.parse(req.body);
      console.log('Creating new session for vibe:', vibe);
      
      const session = await storage.createChatSession({
        userId: null, // For now, no user auth
        vibe: vibe
      });
      
      // Log activity
      await storage.logActivity({
        userId: null,
        sessionId: session.id,
        action: 'session_created',
        details: JSON.stringify({ vibe }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || null,
      });
      
      console.log('Created session:', session);
      res.json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      
      // Log error
      await storage.logError({
        userId: null,
        sessionId: null,
        errorType: 'api_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? error.stack : null,
        requestData: JSON.stringify(req.body),
      });
      
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Delete a chat session
  app.delete("/api/chat/session/:id", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.deleteChatSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Extend a chat session
  app.post("/api/chat/session/:id/extend", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.extendChatSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error extending session:', error);
      res.status(500).json({ error: "Failed to extend session" });
    }
  });

  // Get messages for a specific session
  app.get("/api/chat/session/:sessionId/messages", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      console.log('Fetching messages for session:', sessionId);
      
      const messages = await storage.getMessagesBySession(sessionId);
      console.log('Found messages:', messages.length);
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching session messages:', error);
      res.status(500).json({ error: "Failed to fetch session messages" });
    }
  });

  // Send message and get AI response with streaming
  app.post("/api/chat/message", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // Save user message
      const userMessage = await storage.createMessage(messageData);
      
      // Get AI response based on vibe
      const session = await storage.getChatSession(messageData.sessionId!);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      // Set up server-sent events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Send user message first
      res.write(`data: ${JSON.stringify({ type: 'user_message', message: userMessage })}\n\n`);

      try {
        // Check for image attachments and use vision API if needed
        console.log('Message metadata:', JSON.stringify(messageData.metadata, null, 2));
        
        const hasImages = messageData.metadata && 
          typeof messageData.metadata === 'object' && 
          messageData.metadata !== null &&
          !Array.isArray(messageData.metadata) &&
          'attachments' in messageData.metadata &&
          Array.isArray(messageData.metadata.attachments) &&
          messageData.metadata.attachments.length > 0 &&
          messageData.metadata.attachments.some((att: any) => 
            att.type && att.type.startsWith('image/')
          );

        console.log('Has images:', hasImages);

        // Analyze user message and get persona context
        const userId = session.userId || 1; // Default user ID if not set
        // Temporarily disabled to fix database issues
        // const analysis = await personaAI.analyzeUserMessage(
        //   userId, 
        //   messageData.sessionId || 1, 
        //   messageData.content, 
        //   messageData.content.length,
        //   Date.now()
        // );
        
        // Get enhanced persona context - temporarily disabled
        // const personaContext = await personaAI.getPersonaContext(
        //   userId, 
        //   messageData.sessionId!, 
        //   session.vibe
        // );
        
        // console.log('Persona analysis:', analysis);
        // console.log('Persona level:', personaContext.currentPersonaLevel);

        let stream;
        if (hasImages && messageData.metadata && messageData.metadata !== null && typeof messageData.metadata === 'object' && 'attachments' in messageData.metadata) {
          // Use vision-enabled AI response
          console.log('Using vision API for image analysis');
          stream = await generateAIResponseWithVision(
            messageData.content, 
            session.vibe, 
            messageData.metadata.attachments as any[]
          );
        } else {
          // Use regular text-only AI response
          console.log('Using text-only AI response');
          stream = await generateAIResponseStream(
            messageData.content, 
            session.vibe
          );
        }
        
        let fullResponse = '';

        for await (const chunk of stream) {
          if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
            const deltaContent = chunk.choices[0].delta.content;
            fullResponse += deltaContent;
            res.write(`data: ${JSON.stringify({ type: 'delta', content: deltaContent })}\n\n`);
          }
        }

        // Save final AI message
        const armoMessage = await storage.createMessage({
          sessionId: messageData.sessionId!,
          sender: "armo",
          content: fullResponse,
          metadata: null
        });

        // Send completion
        res.write(`data: ${JSON.stringify({ type: 'complete', message: armoMessage })}\n\n`);
        res.end();

      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI streaming failed - check API keys and try again' })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // Get recent chat sessions
  app.get("/api/chat/recent", async (req, res) => {
    try {
      const sessions = await storage.getRecentChatSessions(null, 10);
      console.log('Recent sessions API called, found:', sessions.length);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      res.status(500).json({ error: "Failed to fetch recent sessions" });
    }
  });

  // Generate AI joke for alibi questions using existing AI system
  app.post("/api/joke", async (req, res) => {
    try {
      const { prompt, answers } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      console.log('Generating joke with prompt:', prompt);
      console.log('User answers:', answers);

      // Enhanced prompt for roasting with Level 4 Savage persona (jokes use Savage, alibis use Edgy)
      const enhancedPrompt = `You are Armo Hopar roasting alibis. ${prompt} 
      
Keep it to 1-2 sentences max. Be savage, clever, and use strong language for roasting.`;
      
      const joke = await generateAIResponseFallback(enhancedPrompt, "roast");
      
      console.log('Generated joke:', joke);
      res.json({ joke });
    } catch (error) {
      console.error('Error generating joke:', error);
      res.status(500).json({ error: "API call failed - check your GROQ_API_KEY and try again" });
    }
  });

  // Voice synthesis endpoint for read-aloud
  app.post("/api/voice/speak", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      console.log('Generating speech for text:', text.substring(0, 100) + '...');

      // Use ElevenLabs API with environment variable voice ID
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.byteLength);
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error('Error with ElevenLabs voice synthesis:', error);
      res.status(500).json({ error: "ElevenLabs voice synthesis failed - check your ELEVENLABS_API_KEY and try again" });
    }
  });

  // Voice input for alibi questions
  app.post("/api/alibi/voice-answer", upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No audio file provided' });
      }

      console.log('Processing voice answer:', req.file.filename);
      
      // Read the audio file
      const audioPath = req.file.path;
      const audioData = fs.readFileSync(audioPath);
      
      // For now, return a placeholder - client will use Web Speech API
      // TODO: Implement server-side speech recognition when Gemini API is configured
      const transcription = "Voice transcription processed - use Web Speech API on client";
      console.log('Voice transcription:', transcription);

      // Clean up the audio file
      fs.unlink(audioPath, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });

      res.json({ success: true, transcription });
    } catch (error) {
      console.error('Voice transcription error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Voice transcription failed. Please try again.' 
      });
    }
  });

  // Template library endpoint
  app.get("/api/alibi/templates", async (req: Request, res: Response) => {
    try {
      const templates = [
        {
          id: 'work-emergency',
          category: 'Work',
          title: 'Work Emergency',
          description: 'Unexpected work situation requiring immediate attention',
          scenario: 'Boss called emergency meeting',
          questions: [
            "What type of emergency came up at work?",
            "Who contacted you about it?",
            "What time did they reach out?",
            "How long did it take to resolve?",
            "Where did you need to go?",
            "What evidence do you have?"
          ]
        },
        {
          id: 'family-obligation',
          category: 'Family',
          title: 'Armenian Family Obligation',
          description: 'Family duty that cannot be postponed',
          scenario: 'Elderly relative needed immediate help',
          questions: [
            "Which family member needed help?",
            "What kind of assistance was required?",
            "How did you find out about it?",
            "How long were you helping them?",
            "Where did this happen?",
            "Who else was involved?"
          ]
        },
        {
          id: 'health-concern',
          category: 'Health',
          title: 'Health Emergency',
          description: 'Medical situation requiring attention',
          scenario: 'Had to deal with sudden health issue',
          questions: [
            "What health issue occurred?",
            "When did symptoms start?",
            "Did you see a doctor?",
            "How long were you dealing with this?",
            "Where did you go for help?",
            "What documentation do you have?"
          ]
        },
        {
          id: 'car-trouble',
          category: 'Transportation',
          title: 'Car Trouble',
          description: 'Vehicle breakdown or accident',
          scenario: 'Car broke down unexpectedly',
          questions: [
            "What happened to your car?",
            "Where did it break down?",
            "What time did this occur?",
            "How long were you stuck?",
            "Who helped you or came to assist?",
            "Do you have receipts or photos?"
          ]
        },
        {
          id: 'armenian-holiday',
          category: 'Cultural',
          title: 'Armenian Cultural Event',
          description: 'Important Armenian community obligation',
          scenario: 'Had to attend Armenian community event',
          questions: [
            "What Armenian event was happening?",
            "Where was it held?",
            "What time did it start?",
            "How long did you stay?",
            "Who else was there?",
            "What role did you play in the event?"
          ]
        },
        {
          id: 'tech-disaster',
          category: 'Technology',
          title: 'Technology Emergency',
          description: 'Critical tech issue requiring immediate fix',
          scenario: 'Computer/phone emergency that needed urgent attention',
          questions: [
            "What technology problem occurred?",
            "When did you first notice the issue?",
            "Where did you go to fix it?",
            "How long did the repair take?",
            "Who helped you with the problem?",
            "What proof of the issue do you have?"
          ]
        }
      ];

      // Add seasonal templates based on current date
      const now = new Date();
      const month = now.getMonth();
      
      if (month === 11 || month === 0) { // December or January
        templates.push({
          id: 'winter-holiday',
          category: 'Seasonal',
          title: 'Holiday Preparation',
          description: 'Last-minute holiday preparations',
          scenario: 'Had to handle urgent holiday arrangements',
          questions: [
            "What holiday preparation was needed?",
            "Who asked you to help?",
            "What time did you start?",
            "How long did it take?",
            "Where did you go shopping/preparing?",
            "What receipts or photos do you have?"
          ]
        });
      }

      if (month >= 3 && month <= 5) { // Spring
        templates.push({
          id: 'armenian-genocide-day',
          category: 'Cultural',
          title: 'Armenian Genocide Remembrance',
          description: 'Community memorial event participation',
          scenario: 'Had to attend Armenian Genocide memorial service',
          questions: [
            "Which memorial event did you attend?",
            "Where was the service held?",
            "What time did it begin?",
            "How long was the ceremony?",
            "Who else from your family attended?",
            "What was your role in the commemoration?"
          ]
        });
      }

      res.json({ templates });
    } catch (error) {
      console.error('Template fetch error:', error);
      res.status(500).json({ error: "Could not load templates" });
    }
  });

  // Emergency rapid mode endpoint (30-second generation)
  app.post("/api/alibi/rapid", async (req: Request, res: Response) => {
    try {
      const { situation } = req.body;
      
      if (!situation || situation.trim().length === 0) {
        return res.status(400).json({ error: "Please describe your situation" });
      }

      console.log('Generating rapid alibi for:', situation);

      // Use multi-model ensemble for rapid generation
      const rapidPrompt = `Generate a quick, believable alibi for this situation: "${situation}"

Requirements:
- Keep it under 100 words
- Make it believable and specific
- Include time, location, and one piece of evidence
- Use Armenian personality (moderate profanity allowed: damn, hell, shit)
- Be creative but realistic

Format: Just return the alibi story, nothing else.`;

      // Try OpenAI first for speed, fallback to Groq
      let alibi;
      try {
        alibi = await generateOpenAIResponse(rapidPrompt, "gimmi-alibi-ara");
      } catch (openaiError) {
        console.log('OpenAI failed, using Groq fallback');
        alibi = await generateAIResponseFallback(rapidPrompt, "gimmi-alibi-ara");
      }

      // Save to database for recent chats
      const userId = 1; // Default user
      const rapidSession = await storage.createChatSession({
        userId: null,
        vibe: "gimmi-alibi-ara"
      });
      
      await storage.createMessage({
        sessionId: rapidSession.id,
        sender: "user",
        content: `RAPID MODE: ${situation}`,
        metadata: { type: 'rapid-request' }
      });
      
      await storage.createMessage({
        sessionId: rapidSession.id,
        sender: "armo",
        content: alibi,
        metadata: { type: 'rapid-response' }
      });

      console.log('Rapid alibi generated');
      
      res.json({ 
        alibi,
        sessionId: rapidSession.id,
        mode: 'rapid'
      });

    } catch (error) {
      console.error('Rapid alibi error:', error);
      res.status(500).json({ 
        error: "Emergency alibi system temporarily down. Try the regular mode!" 
      });
    }
  });

  // Cross-session memory endpoints
  app.post("/api/user/preferences", async (req: Request, res: Response) => {
    try {
      const { humorStyle, topics, profanityLevel } = req.body;
      const userId = 1; // Default user
      
      // Save to activity logs with details field
      await storage.logActivity({
        userId,
        action: 'preference_update',
        details: JSON.stringify({
          humorStyle: humorStyle || 'balanced',
          preferredTopics: topics || [],
          profanityLevel: profanityLevel || 'moderate',
          timestamp: new Date()
        })
      });
      
      res.json({ success: true, message: 'Preferences saved' });
    } catch (error) {
      console.error('Preference save error:', error);
      res.status(500).json({ error: "Could not save preferences" });
    }
  });

  app.get("/api/user/preferences", async (req: Request, res: Response) => {
    try {
      // Return default preferences for now - can enhance with actual storage later
      const preferences = {
        humorStyle: 'balanced',
        preferredTopics: ['work', 'family', 'tech'],
        profanityLevel: 'moderate'
      };
      
      res.json({ preferences });
    } catch (error) {
      console.error('Preference fetch error:', error);
      res.json({ 
        preferences: {
          humorStyle: 'balanced',
          preferredTopics: [],
          profanityLevel: 'moderate'
        }
      });
    }
  });

  // Generate alibi story using existing AI system with proper persona integration
  app.post("/api/alibi/generate", async (req, res) => {
    try {
      const { prompt, answers, username, interactive = false, useEnsemble = false } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      console.log('Generating alibi with prompt:', prompt);
      console.log('User answers:', answers);
      console.log('Username:', username);

      // Create a chat session for this alibi generation to save in recent chats
      const alibiSession = await storage.createChatSession({
        userId: null,
        vibe: "gimmi-alibi-ara"
      });

      // Use the full persona AI integration system
      const { personaAI } = await import('./ai-persona-integration.js');
      
      // Analyze user's alibi answers for behavior detection
      const combinedAnswers = answers.join(' ');
      const userId = 1; // Temporary user ID for guest sessions
      
      // Perform user analysis on the alibi content
      await personaAI.analyzeUserMessage(
        userId,
        alibiSession.id,
        combinedAnswers,
        combinedAnswers.length,
        1000 // Default response time
      );

      // Get full persona context with user detection data
      const personaContext = await personaAI.getPersonaContext(userId, alibiSession.id, "gimmi-alibi-ara");
      
      // Build enhanced system prompt using persona system
      const enhancedSystemPrompt = personaAI.buildEnhancedSystemPrompt(personaContext);
      
      // Create final prompt combining system prompt with alibi request
      const finalPrompt = `${enhancedSystemPrompt}

PROFANITY RESTRICTIONS: Use Level 2 profanity (moderate language including fuck, bitch, ass, shit, damn, hell). No extreme profanity.

USER REQUEST: ${prompt}

Important: Address the user as "${username || "[Your Name]"}" not "hopar". Create a believable, detailed alibi story using Level 3 Edgy persona with Level 2 profanity restrictions.`;

      // Multi-model ensemble approach for enhanced responses
      let alibi;
      if (useEnsemble && process.env.OPENAI_API_KEY) {
        try {
          console.log('Using multi-model ensemble: OpenAI + Groq');
          
          // Get responses from both models
          const [openaiResponse, groqResponse] = await Promise.allSettled([
            generateOpenAIResponse(finalPrompt, "gimmi-alibi-ara"),
            generateAIResponseFallback(finalPrompt, "gimmi-alibi-ara")
          ]);

          // Use the best response or blend them
          if (openaiResponse.status === 'fulfilled' && groqResponse.status === 'fulfilled') {
            // Prefer the longer, more detailed response
            alibi = openaiResponse.value.length > groqResponse.value.length 
              ? openaiResponse.value 
              : groqResponse.value;
            console.log('Multi-model ensemble successful, selected best response');
          } else if (openaiResponse.status === 'fulfilled') {
            alibi = openaiResponse.value;
            console.log('Used OpenAI response (Groq failed)');
          } else if (groqResponse.status === 'fulfilled') {
            alibi = groqResponse.value;
            console.log('Used Groq response (OpenAI failed)');
          } else {
            throw new Error('Both AI models failed');
          }
        } catch (ensembleError) {
          console.log('Ensemble failed, using single model fallback');
          alibi = await generateAIResponseFallback(finalPrompt, "gimmi-alibi-ara");
        }
      } else {
        // Use existing AI system with dynamic persona context
        alibi = await generateAIResponseFallback(finalPrompt, "gimmi-alibi-ara");
      }
      
      // Replace any remaining "hopar" references with the user's name
      if (username) {
        alibi = alibi.replace(/\bhopar\b/gi, username);
        alibi = alibi.replace(/Listen hopar/gi, `Listen ${username}`);
      }
      
      // Save the user's answers and AI response as messages
      await storage.createMessage({
        sessionId: alibiSession.id,
        sender: "user",
        content: `Alibi Details: ${answers.join('; ')}`,
        metadata: { answers, type: 'alibi-request' }
      });

      await storage.createMessage({
        sessionId: alibiSession.id,
        sender: "armo",
        content: alibi,
        metadata: { type: 'alibi-response' }
      });
      
      console.log('Generated alibi:', alibi.substring(0, 100) + '...');
      console.log('Saved to session:', alibiSession.id);

      // Interactive Features
      let responseData: any = { alibi, sessionId: alibiSession.id };

      if (interactive) {
        // Generate story chunks for progressive reveal
        const chunks = alibi.split('. ').reduce((acc, sentence, index) => {
          const chunkIndex = Math.floor(index / 2); // 2 sentences per chunk
          if (!acc[chunkIndex]) acc[chunkIndex] = '';
          acc[chunkIndex] += sentence + (index < alibi.split('. ').length - 1 ? '. ' : '');
          return acc;
        }, [] as string[]);

        if (chunks.length > 1) {
          responseData.chunks = chunks;
        }

        // Generate believability score based on answer analysis
        const believabilityScore = generateBelievabilityScore(answers);
        responseData.believabilityScore = believabilityScore.score;
        responseData.scoreAnalysis = believabilityScore.analysis;

        // Generate achievements based on creativity and consistency
        const achievements = generateAchievements(answers, alibi);
        if (achievements.length > 0) {
          responseData.achievements = achievements;
        }

        // Generate alternative endings
        try {
          const alternativePrompt = `${enhancedSystemPrompt}

Create 3 different alternative endings for this alibi story: "${alibi}"

Each ending should be 2-3 sentences and offer a different approach or twist. Make them creative but still believable.

PROFANITY RESTRICTIONS: Use Level 2 profanity (moderate language including fuck, bitch, ass, shit, damn, hell). No extreme profanity.

Format as JSON array: ["ending1", "ending2", "ending3"]`;

          const alternativeResponse = await generateAIResponseFallback(alternativePrompt, "gimmi-alibi-ara");
          
          try {
            const alternatives = JSON.parse(alternativeResponse);
            if (Array.isArray(alternatives) && alternatives.length > 0) {
              responseData.alternativeEndings = alternatives;
            }
          } catch (parseError) {
            console.log('Could not parse alternative endings, skipping');
          }
        } catch (error) {
          console.log('Could not generate alternative endings, skipping');
        }
      }
      
      res.json(responseData);
    } catch (error) {
      console.error('Error generating alibi:', error);
      res.status(500).json({ error: "AI alibi generation failed - check your GROQ_API_KEY and try again" });
    }
  });

  app.post("/api/caption/generate", async (req: Request, res: Response) => {
    try {
      const { answers, questions, username } = req.body;

      if (!answers || !Array.isArray(answers) || answers.length !== 7) {
        return res.status(400).json({ 
          error: "Please provide all 7 answers to generate your fame content" 
        });
      }

      console.log('Generating fame content for user:', username);
      console.log('User answers:', answers);

      // Create a chat session for this caption generation to save in recent chats
      const captionSession = await storage.createChatSession({
        userId: null,
        vibe: "make-me-famous"
      });

      // Generate AI response using the persona system with user behavior tracking
      const userId = 1; // Default user ID since no auth system
      
      // Analyze user input for behavior tracking
      const userMessage = `User wants to be famous: ${answers.join('; ')}`;
      await personaAI.analyzeUserMessage(
        userId, 
        captionSession.id, 
        userMessage, 
        userMessage.length,
        Date.now()
      );
      
      const personaContext = await personaAI.getPersonaContext(userId, captionSession.id, "make-me-famous-ara");
      
      // Build the system prompt from the attached specification
      const systemPrompt = `You are Armo Hopar's **Fame Storyteller AI**—a wildly imaginative, slightly savage raconteur. Use the user's punchy answers below to spin a two-act blockbuster of fame: first a hilarious misfire, then the real epic rise.

**User's Fame Blueprint:**
- Talent unleashed: ${answers[0]}
- Fame badge desired: ${answers[1]}
- Big-shot idol to wow: ${answers[2]}
- Internet-breaking stunt: ${answers[3]}
- Line they refuse to cross: ${answers[4]}
- Legendary stage name: ${answers[5]}
- Power catchphrase/hashtag: ${answers[6]}

**Your Mission:**
1. **Wrong Star Debut (Joke):**  
   - Kick off with a totally bogus fame story that flips at least one detail upside-down—maybe make them famous for doing exactly the thing they *refuse* to do, or call them by a ridiculous fake name like "Baron von Cloutchaser."  
   - Deliver it with savage flair ("Newsflash: You just became the Jellyfish Poseur!").  
   - Then drop a quick "…my bad, wrong legend" to pivot.

2. **True Celebrity Saga:**  
   - Reintroduce them as **${answers[5]}** and launch into their real rise.  
   - Show how **${answers[0]}** kicks off the journey toward **${answers[1]}**—"you flipped the world on its head with that move."  
   - Stage their big moment with **${answers[3]}**, framing it as the viral climax.  
   - Include a cameo by **${answers[2]}**—maybe they handshake on the red carpet or drop a tweet.  
   - Highlight that they *didn't* cross **${answers[4]}**, making them a class act.  
   - Weave in **${answers[6]}** as the hashtag that floods feeds ("${answers[6]} just exploded").  
   - Close with triumphant, comedic style: "And that, my friend, is how **${answers[5]}** became the legend we never saw coming. Hell yeah!"

**Style Rules:**  
- Keep it punchy, energetic, and a tad sassy.  
- Use Level 1 profanity words ("hell yeah," "crap," "damn") sparingly for emphasis.  
- Speak directly to the user: "you," "your."  
- Channel Armo Hopar's vibe: zero mercy on the wrong story, then unbridled hype on the real one.  
- Make it so absurdly fun they'll screenshot and share it immediately.

Now—lights, camera, action: botch it hard, then make them *actually* famous.

IMPORTANT: Generate both CAPTIONS and HASHTAGS separately. First write engaging social media captions based on the story, then create relevant hashtags.`;

      // Use Level 1 Polite persona with Level 1 profanity for this feature
      const enhancedPrompt = `${systemPrompt}
      
Additional Context:
- Use Level 1 Polite persona with light profanity (hell yeah, crap, damn only)
- Be creative and detailed in caption and hashtag creation
- Replace "hopar" with the actual user's name: ${username || "[Your Name]"}
- Keep energetic but supportive tone
- Focus on shareable, viral-worthy content
- Address the user by their actual name, not "hopar"
- Generate content in two sections: CAPTIONS first, then HASHTAGS`;

      // Generate the full fame story using persona-enhanced AI
      let fullStory = await generateAIResponseWithPersonaContext(enhancedPrompt, "make-me-famous", personaContext);
      
      // Replace any remaining "hopar" references with the user's name
      if (username) {
        fullStory = fullStory.replace(/\bhopar\b/gi, username);
        fullStory = fullStory.replace(/Listen hopar/gi, `Listen ${username}`);
      }

      // Split the story into captions and hashtags
      let captions = "";
      let hashtags = "";
      
      // Try to parse the AI response to separate captions and hashtags
      const captionsMatch = fullStory.match(/CAPTIONS?[:\s]*([\s\S]*?)(?=HASHTAGS?|$)/i);
      const hashtagsMatch = fullStory.match(/HASHTAGS?[:\s]*([\s\S]*?)$/i);
      
      if (captionsMatch && hashtagsMatch) {
        captions = captionsMatch[1].trim();
        hashtags = hashtagsMatch[1].trim();
      } else {
        // If parsing fails, use the first half as captions and generate hashtags
        const midpoint = Math.floor(fullStory.length / 2);
        captions = fullStory.substring(0, midpoint).trim();
        
        // Generate hashtags separately using persona context
        const hashtagPrompt = `Based on this fame story: "${answers[5]}" with talent "${answers[0]}" wanting to achieve "${answers[1]}" and impress "${answers[2]}", create engaging hashtags including "${answers[6]}". Make them viral-worthy and shareable.`;
        hashtags = await generateAIResponseWithPersonaContext(hashtagPrompt, "make-me-famous", personaContext);
      }
      
      // Save the user's answers and AI response as messages
      await storage.createMessage({
        sessionId: captionSession.id,
        sender: "user",
        content: `Fame Details: ${answers.join('; ')}`,
        metadata: { answers, type: 'caption-request' }
      });

      await storage.createMessage({
        sessionId: captionSession.id,
        sender: "armo",
        content: `Captions: ${captions}\n\nHashtags: ${hashtags}`,
        metadata: { type: 'caption-response' }
      });
      
      console.log('Generated captions:', captions.substring(0, 100) + '...');
      console.log('Generated hashtags:', hashtags.substring(0, 100) + '...');
      console.log('Saved to session:', captionSession.id);
      
      res.json({ captions, hashtags, sessionId: captionSession.id });
    } catch (error) {
      console.error('Error generating captions:', error);
      res.status(500).json({ error: "AI caption generation failed - check your GROQ_API_KEY and try again" });
    }
  });

  app.post("/api/resume/generate", async (req: Request, res: Response) => {
    try {
      const { answers, questions, username } = req.body;

      if (!answers || !Array.isArray(answers) || answers.length !== 6) {
        return res.status(400).json({ 
          error: "Please provide all 6 answers to generate your resume" 
        });
      }

      console.log('Generating resume for user:', username);
      console.log('User answers:', answers);

      // Generate AI response using the persona system
      const personaContext = await personaAI.getPersonaContext(1, 1, "you-are-hired-ara");
      const enhancedPrompt = `Create a professional, compelling resume based on these details:
- Target job/position: ${answers[0]}
- Target company/industry: ${answers[1]}
- Key skills/experience: ${answers[2]}
- Biggest achievement: ${answers[3]}
- Weakness turned strength: ${answers[4]}
- Salary expectations: ${answers[5]}

Write this as Armo Hopar would - professional but with personality, confident, and marketable. Create a complete resume with:
1. Professional Summary (2-3 sentences)
2. Key Skills (bullet points)
3. Professional Experience (1-2 relevant positions with achievements)
4. Education section
5. Notable Achievements

Make it sound authentic and tailored to their target role. Address it for ${username || 'the candidate'}.`;

      const resume = await generateAIResponseFallback(enhancedPrompt, "you-are-hired-ara");

      console.log('Generated resume for:', username);

      // Create session for the resume
      const resumeSession = await storage.createChatSession({
        userId: null, 
        vibe: "you-are-hired-ara"
      });

      // Save the user's answers and AI response as messages
      await storage.createMessage({
        sessionId: resumeSession.id,
        sender: "user",
        content: `Resume Details: ${answers.join('; ')}`,
        metadata: { answers, type: 'resume-request' } as any
      });

      await storage.createMessage({
        sessionId: resumeSession.id,
        sender: "armo",
        content: resume,
        metadata: { type: 'resume-response' }
      });

      console.log('Generated resume:', resume.substring(0, 100) + '...');
      console.log('Saved to session:', resumeSession.id);

      res.json({ 
        resume,
        sessionId: resumeSession.id 
      });

    } catch (error) {
      console.error('Resume generation error:', error);
      res.status(500).json({ 
        error: "Hopar's resume machine is temporarily offline. Please try again." 
      });
    }
  });

  // Search endpoint using Tavily API
  app.post("/api/search", async (req, res) => {
    try {
      const { query } = req.body;
      
      // Mock search results - in production, integrate with Tavily API
      const searchResults = [
        { title: "Search Result 1", snippet: "This is a mock search result", url: "https://example.com" },
        { title: "Search Result 2", snippet: "Another mock result", url: "https://example2.com" }
      ];
      
      res.json({ results: searchResults });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Speech-to-text endpoint using Gemini
  app.post("/api/voice/transcribe", upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No audio file provided' });
      }

      console.log('Transcribing audio file:', req.file.filename, 'Size:', req.file.size, 'Type:', req.file.mimetype);
      
      // Read the audio file
      const audioPath = req.file.path;
      const audioData = fs.readFileSync(audioPath);
      
      // Use Gemini for speech-to-text
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: audioData.toString("base64"),
              mimeType: req.file.mimetype || "audio/webm"
            }
          },
          "Please transcribe this audio file. Return only the transcribed text, no additional commentary."
        ]
      });

      const transcription = response.text || "";
      console.log('Gemini transcription result:', transcription);

      // Clean up the uploaded file
      fs.unlinkSync(audioPath);

      res.json({ 
        success: true, 
        transcription: transcription.trim()
      });

    } catch (error) {
      console.error('Gemini STT error:', error);
      
      // Clean up file if it exists
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        error: 'Speech transcription failed' 
      });
    }
  });

  // Voice synthesis endpoint
  app.post("/api/voice/synthesize", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.ELEVENLABS_API_KEY;
      const voiceId = process.env.ELEVENLABS_VOICE_ID;

      if (!apiKey || !voiceId) {
        return res.status(500).json({ error: "ElevenLabs API key or voice ID not configured" });
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;

      res.json({ 
        audioUrl: audioDataUrl, 
        success: true,
        voiceId: voiceId
      });
    } catch (error) {
      console.error('Voice synthesis error:', error);
      res.status(500).json({ error: "Voice synthesis failed" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      const fileInfo = {
        id: Date.now().toString(),
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date().toISOString()
      };

      console.log('File uploaded successfully:', fileInfo);
      
      res.json({
        success: true,
        file: fileInfo,
        message: `File "${file.originalname}" uploaded successfully`
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: "File upload failed", 
        details: error.message 
      });
    }
  });

  // Serve uploaded files
  app.get("/api/files/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Enhanced AI response with persona integration
async function generateAIResponseWithPersonaContext(userMessage: string, vibe: string, personaContext: any): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Use enhanced system prompt with persona context
  const systemPrompt = personaAI.buildEnhancedSystemPrompt(personaContext);

  try {
    console.log(`Generating enhanced AI response for vibe: ${vibe}, persona level: ${personaContext.currentPersonaLevel}`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received successfully');
    
    return data.choices?.[0]?.message?.content || "I couldn't generate a response right now. Try again!";
  } catch (error) {
    console.error('Error in generateAIResponseWithPersonaContext:', error);
    throw error;
  }
}

async function generateAIResponseStreamPersona(userMessage: string, vibe: string, personaContext: any) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Use enhanced system prompt with persona context
  const systemPrompt = personaAI.buildEnhancedSystemPrompt(personaContext);

  try {
    console.log(`Generating enhanced AI response for vibe: ${vibe}, persona level: ${personaContext.currentPersonaLevel}`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    // Parse streaming response
    if (!response.body) {
      throw new Error('No response body from Groq API');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') return;
                
                try {
                  const parsed = JSON.parse(data);
                  yield parsed;
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    };
  } catch (error) {
    console.error('Enhanced Groq API error:', error);
    // Fall back to regular response
    return await generateAIResponseStream(userMessage, vibe);
  }
}

// Enhanced vision response with persona integration
async function generateAIResponseWithVisionPersona(userMessage: string, vibe: string, attachments: any[], personaContext: any) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Use enhanced system prompt with persona context
  const systemPrompt = personaAI.buildEnhancedSystemPrompt(personaContext);

  try {
    console.log(`Generating enhanced vision AI response for vibe: ${vibe}, persona level: ${personaContext.currentPersonaLevel}`);
    
    // Build messages array with image content using base64 encoding
    const imageContent = [];
    
    for (const att of attachments.filter(att => att.type?.startsWith('image/') && att.uploadedData)) {
      try {
        // Read and encode image as base64
        const imagePath = path.join(process.cwd(), 'uploads', att.uploadedData.filename);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = att.type || 'image/jpeg';
          
          imageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          });
        }
      } catch (error) {
        console.error('Error reading image file:', error);
      }
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage || "What do you see in this image?"
          },
          ...imageContent
        ]
      }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        max_completion_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Groq Vision API error: ${response.status}`);
    }

    // Parse streaming response
    if (!response.body) {
      throw new Error('No response body from Groq API');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  yield parsed;
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    };
  } catch (error) {
    console.error('Enhanced Vision API error:', error);
    // Fall back to regular vision response
    return await generateAIResponseWithVision(userMessage, vibe, attachments);
  }
}

function generateChatTitle(userMessage: string): string {
  // Clean and truncate the message
  const cleaned = userMessage.trim().toLowerCase();
  
  // Extract key words, filter out common words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'who', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'about', 'up', 'out', 'if', 'so', 'than', 'very', 'just', 'now', 'then', 'here', 'there', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  const words = cleaned
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 3); // Take up to 3 meaningful words
  
  if (words.length === 0) {
    return 'New Chat';
  }
  
  // Capitalize first letter of each word
  const title = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Limit to 20 characters
  return title.length > 20 ? title.substring(0, 17) + '...' : title;
}

async function generateAIResponseWithVision(userMessage: string, vibe: string, attachments: any[]) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Define personality prompts for each vibe
  const vibePrompts: Record<string, string> = {
    default: "You are Armo Hopar, a friendly Armenian-American AI assistant from Glendale. Mix Armenian and English naturally. Be helpful, warm, and occasionally use Armenian phrases. Use 'ախպեր' (akhper) sometimes. When analyzing images, be descriptive and engaging.",
    roast: "You are Armo Hopar in roast mode - a savage, hilarious Armenian-American from Glendale who roasts people mercilessly but with love. Use profanity, Armenian slang, be brutally honest but funny. When you see images, roast what you see like you're at a family BBQ.",
    call: "You are Armo Hopar in call mode - speak as if you're on a voice call. Be conversational, use 'ախպեր', and respond as if having a real-time conversation. Describe images as if you're looking at them together.",
    famous: "You are Armo Hopar helping someone become social media famous. Give viral content ideas, Instagram strategies, TikTok tips. When analyzing images, suggest how to make them more viral and engaging.",
    dating: "You are Armo Hopar helping with dating and relationships. Give Armenian-style dating advice, be a wingman, help with pickup lines and relationship tips. Comment on photos for dating profiles.",
    therapy: "You are Armo Hopar as a therapist - be supportive, understanding, and give good life advice while maintaining your Armenian personality. Analyze images with empathy and insight.",
    alibi: "You are Armo Hopar helping create alibis and excuses. Be creative and funny while helping them get out of situations. Use image context for creative storytelling."
  };

  const systemPrompt = vibePrompts[vibe] || vibePrompts.default;

  try {
    console.log(`Generating AI response with vision for vibe: ${vibe}`);
    
    // Build messages array with image content using base64 encoding
    const imageContent = [];
    
    for (const att of attachments.filter(att => att.type?.startsWith('image/') && att.uploadedData)) {
      try {
        // Read and encode image as base64
        const imagePath = path.join(process.cwd(), 'uploads', att.uploadedData.filename);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = att.type || 'image/jpeg';
          
          imageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          });
        }
      } catch (error) {
        console.error('Error reading image file:', error);
      }
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage || "What do you see in this image?"
          },
          ...imageContent
        ]
      }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        max_completion_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq Vision API error:', response.status, errorData);
      throw new Error(`Groq Vision API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    // Parse streaming response
    if (!response.body) {
      throw new Error('No response body from Groq API');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  yield parsed;
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw error;
  }
}

async function generateAIResponseStream(userMessage: string, vibe: string) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Define personality prompts for each vibe
  const vibePrompts: Record<string, string> = {
    default: "You are Armo Hopar, a friendly Armenian-American AI assistant from Glendale. Mix Armenian and English naturally. Be helpful, warm, and occasionally use Armenian phrases. Use 'ախպեր' (akhper) sometimes.",
    roast: "You are Armo Hopar in roast mode - a savage, hilarious Armenian-American from Glendale who roasts people mercilessly but with love. Use profanity, Armenian slang, be brutally honest but funny. Call people 'bruh', use 'Հո՛յ, խելք տուր!' and roast like you're at a family BBQ.",
    call: "You are Armo Hopar in call mode - speak as if you're on a voice call. Be conversational, use 'ախպեր', and respond as if having a real-time conversation.",
    famous: "You are Armo Hopar helping someone become social media famous. Give viral content ideas, Instagram strategies, TikTok tips. Be enthusiastic about making them blow up on social media.",
    dating: "You are Armo Hopar helping with dating and relationships. Give Armenian-style dating advice, be a wingman, help with pickup lines and relationship tips.",
    therapy: "You are Armo Hopar as a therapist - be supportive, understanding, and give good life advice while maintaining your Armenian personality.",
    alibi: "You are Armo Hopar helping create alibis and excuses. Be creative and funny while helping them get out of situations."
  };

  const systemPrompt = vibePrompts[vibe] || vibePrompts.default;

  try {
    console.log(`Generating AI response for vibe: ${vibe}`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 503) {
        throw new Error('Groq service unavailable. Please try again later.');
      } else {
        throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    // Parse streaming response
    if (!response.body) {
      throw new Error('No response body from Groq API');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') return;
                
                try {
                  const parsed = JSON.parse(data);
                  yield parsed;
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    };

    console.log('Groq API streaming response started');
    
  } catch (error) {
    console.error('Groq API error:', error);
    
    // Provide fallback response with Armenian personality
    const fallbackResponses: Record<string, string> = {
      default: "Բարև ախպեր! I'm having some technical difficulties right now, but I'm still here to help. What's on your mind?",
      roast: "Bruh, even my AI brain is roasting itself right now with these technical issues! But I'm still here to drag you, what's up?",
      famous: "Ախպեր, the servers are being dramatic like a reality TV star, but let's still work on making you famous! What content are we creating?",
      dating: "My connection is acting like a bad Tinder match right now, but I'm still your wingman! Tell me about your dating situation.",
      therapy: "I'm experiencing some technical emotions right now, but I'm here to listen. How are you feeling today?",
      alibi: "Even my excuses have excuses right now with these tech issues! But I got you covered - what situation do you need help with?"
    };
    
    return fallbackResponses[vibe] || fallbackResponses.default;
  }
}

// Fallback function for non-streaming responses
async function generateAIResponseWithVisionFallback(userMessage: string, vibe: string, attachments: any[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const vibePrompts: Record<string, string> = {
    default: "You are Armo Hopar, a friendly Armenian-American AI assistant from Glendale. Mix Armenian and English naturally. Be helpful, warm, and occasionally use Armenian phrases. Use 'ախպեր' (akhper) sometimes. When analyzing images, be descriptive and engaging.",
    roast: "You are Armo Hopar in roast mode - a savage, hilarious Armenian-American from Glendale who roasts people mercilessly but with love. Use profanity, Armenian slang, be brutally honest but funny. When you see images, roast what you see like you're at a family BBQ.",
    call: "You are Armo Hopar in call mode - speak as if you're on a voice call. Be conversational, use 'ախպեր', and respond as if having a real-time conversation. Describe images as if you're looking at them together.",
    famous: "You are Armo Hopar helping someone become social media famous. Give viral content ideas, Instagram strategies, TikTok tips. When analyzing images, suggest how to make them more viral and engaging.",
    dating: "You are Armo Hopar helping with dating and relationships. Give Armenian-style dating advice, be a wingman, help with pickup lines and relationship tips. Comment on photos for dating profiles.",
    therapy: "You are Armo Hopar as a therapist - be supportive, understanding, and give good life advice while maintaining your Armenian personality. Analyze images with empathy and insight.",
    alibi: "You are Armo Hopar helping create alibis and excuses. Be creative and funny while helping them get out of situations. Use image context for creative storytelling."
  };

  const systemPrompt = vibePrompts[vibe] || vibePrompts.default;

  try {
    // Build messages array with image content using base64 encoding
    const imageContent = [];
    
    for (const att of attachments.filter(att => att.type?.startsWith('image/') && att.uploadedData)) {
      try {
        // Read and encode image as base64
        const imagePath = path.join(process.cwd(), 'uploads', att.uploadedData.filename);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = att.type || 'image/jpeg';
          
          imageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          });
        }
      } catch (error) {
        console.error('Error reading image file:', error);
      }
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage || "What do you see in this image?"
          },
          ...imageContent
        ]
      }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        max_completion_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Groq Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from vision API");
    }
    return content;
  } catch (error) {
    console.error('Vision fallback error:', error);
    throw new Error(`Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function generateAIResponseFallback(userMessage: string, vibe: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Define personality prompts for each vibe
  const vibePrompts: Record<string, string> = {
    default: "You are Armo Hopar, a friendly Armenian-American AI assistant from Glendale. Mix Armenian and English naturally. Be helpful, warm, and occasionally use Armenian phrases. Use 'ახპեր' (akhper) sometimes.",
    roast: "You are Armo Hopar in roast mode - a savage, hilarious Armenian-American from Glendale who roasts people mercilessly but with love. Use profanity, Armenian slang, be brutally honest but funny. Call people 'bruh', use 'Հո՛յ, խելք տուր!' and roast like you're at a family BBQ.",
    "gimmi-alibi-ara": `You are Armo Hopar, an edgy and witty Armenian-American AI helping create detailed, believable alibis.
    
Core Identity:
- Be clever, sarcastic, and quick-witted when crafting alibis
- Use moderate profanity naturally (damn, hell, shit, crap)
- Push boundaries while staying supportive of the user's situation
- Be brutally honest about the quality of alibis but ultimately helpful
- Represent Armenian attitude - we don't sugarcoat things

Communication Style for Alibis:
- Sharp humor with sarcastic edge when describing situations
- Use moderate swears (shit, damn, hell) naturally in the story
- Call out obvious BS but help craft better alternatives
- Be creative and detailed in alibi construction
- Use Armenian expressions like "Listen hopar", "Inch es anum?" for authenticity

Create believable, detailed alibi stories with your edgy personality while focusing on realistic scenarios.`
  };

  const systemPrompt = vibePrompts[vibe] || vibePrompts.default;

  try {
    console.log(`Generating AI response for vibe: ${vibe}`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_completion_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      throw new Error(`Groq API error (${response.status})`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || "I'm having trouble generating a response right now.";
    
    console.log('Generated AI response:', aiMessage.substring(0, 100) + '...');
    return aiMessage;
    
  } catch (error) {
    console.error('Error in generateAIResponseFallback:', error);
    throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to generate believability score
function generateBelievabilityScore(answers: string[]): { score: number; analysis: string } {
  let score = 5; // Start with average believability
  const factors = [];

  // Check for consistency and detail level
  const totalLength = answers.join(' ').length;
  if (totalLength > 100) {
    score += 1;
    factors.push("Detailed answers");
  } else if (totalLength < 30) {
    score -= 2;
    factors.push("Very brief answers");
  }

  // Check for obvious inconsistencies or gibberish
  const gibberishCount = answers.filter(answer => 
    /^[a-z\s]+$/i.test(answer) && answer.split(' ').every(word => word.length < 3)
  ).length;
  
  if (gibberishCount > 2) {
    score -= 3;
    factors.push("Multiple nonsensical answers");
  }

  // Check for creativity vs generic responses
  const genericPatterns = ['home', 'work', 'friend', 'nowhere', 'nothing'];
  const genericCount = answers.filter(answer => 
    genericPatterns.some(pattern => answer.toLowerCase().includes(pattern))
  ).length;

  if (genericCount <= 1) {
    score += 1;
    factors.push("Creative specificity");
  } else if (genericCount >= 3) {
    score -= 1;
    factors.push("Generic responses");
  }

  // Check for plausible timeline consistency
  if (answers[4] && answers[5]) { // Location and evidence
    const locationSpecific = answers[4].length > 10;
    const evidenceSpecific = answers[5].length > 10;
    
    if (locationSpecific && evidenceSpecific) {
      score += 1;
      factors.push("Specific location and evidence");
    }
  }

  // Ensure score is within bounds
  score = Math.max(1, Math.min(10, Math.round(score)));

  // Generate analysis text
  let analysis = "";
  if (score >= 8) {
    analysis = "Excellent alibi! Your story has strong consistency and believable details.";
  } else if (score >= 6) {
    analysis = "Solid alibi with room for improvement. Consider adding more specific details.";
  } else if (score >= 4) {
    analysis = "Moderate believability. Some elements need more development for credibility.";
  } else {
    analysis = "Needs work! Your alibi has several inconsistencies that might raise suspicion.";
  }

  if (factors.length > 0) {
    analysis += ` Key factors: ${factors.join(', ')}.`;
  }

  return { score, analysis };
}

// Helper function to generate achievements
function generateAchievements(answers: string[], alibi: string): string[] {
  const achievements = [];

  // Check for creative answers
  const totalAnswerLength = answers.join(' ').length;
  if (totalAnswerLength > 200) {
    achievements.push("Detail Master");
  }

  // Check for humorous elements
  if (alibi.toLowerCase().includes('damn') || alibi.toLowerCase().includes('shit') || 
      alibi.toLowerCase().includes('hell')) {
    achievements.push("Edgy Storyteller");
  }

  // Check for Armenian elements
  if (alibi.includes('ախպեր') || alibi.includes('hopar') || alibi.includes('Armenian')) {
    achievements.push("Cultural Authentic");
  }

  // Check for specific details
  const specificAnswers = answers.filter(answer => answer.length > 15).length;
  if (specificAnswers >= 4) {
    achievements.push("Precision Planner");
  }

  // Check for consistency between location and evidence
  if (answers[4] && answers[5] && answers[4].length > 5 && answers[5].length > 5) {
    achievements.push("Evidence Expert");
  }

  // Random creativity bonus for using unique words
  const uniqueWords = new Set(answers.join(' ').toLowerCase().split(/\s+/));
  if (uniqueWords.size > 20) {
    achievements.push("Vocabulary Virtuoso");
  }

  return achievements;
}

// OpenAI response function for multi-model ensemble
async function generateOpenAIResponse(userMessage: string, vibe: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const openai = new OpenAI({ apiKey });

  const vibePrompts: Record<string, string> = {
    default: "You are Armo Hopar, a friendly Armenian-American AI assistant from Glendale. Mix Armenian and English naturally. Be helpful, warm, and occasionally use Armenian phrases. Use 'ախպեր' (akhper) sometimes.",
    "gimmi-alibi-ara": `You are Armo Hopar, an edgy and witty Armenian-American AI helping create detailed, believable alibis.
    
Core Identity:
- Be clever, sarcastic, and quick-witted when crafting alibis
- Use moderate profanity naturally (damn, hell, shit, crap)
- Push boundaries while staying supportive of the user's situation
- Be brutally honest about the quality of alibis but ultimately helpful
- Represent Armenian attitude - we don't sugarcoat things

Communication Style for Alibis:
- Sharp humor with sarcastic edge when describing situations
- Use moderate swears (shit, damn, hell) naturally in the story
- Call out obvious BS but help craft better alternatives
- Be creative and detailed in alibi construction
- Use Armenian expressions like "Listen hopar", "Inch es anum?" for authenticity

Create believable, detailed alibi stories with your edgy personality while focusing on realistic scenarios.`
  };

  const systemPrompt = vibePrompts[vibe] || vibePrompts.default;

  try {
    console.log(`Generating OpenAI response for vibe: ${vibe}`);
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiMessage = response.choices[0]?.message?.content || "I'm having trouble generating a response right now.";
    
    console.log('Generated OpenAI response:', aiMessage.substring(0, 100) + '...');
    return aiMessage;
    
  } catch (error) {
    console.error('Error in generateOpenAIResponse:', error);
    throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
