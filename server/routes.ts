import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "default_key";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY_ENV_VAR || "default_key";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY_ENV_VAR || "default_key";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get chat history for a specific vibe
  app.get("/api/chat/:vibe/history", async (req, res) => {
    try {
      const { vibe } = req.params;
      const sessions = await storage.getChatSessionsByUserAndVibe(null, vibe);
      
      if (sessions.length === 0) {
        return res.json({ messages: [] });
      }
      
      const latestSession = sessions[sessions.length - 1];
      const messages = await storage.getMessagesBySession(latestSession.id);
      
      res.json({ sessionId: latestSession.id, messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // Create new chat session
  app.post("/api/chat/session", async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);
      const session = await storage.createChatSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  // Send message and get AI response
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
      
      const aiResponse = await generateAIResponse(messageData.content, session.vibe);
      
      // Save AI response
      const armoMessage = await storage.createMessage({
        sessionId: messageData.sessionId!,
        sender: "armo",
        content: aiResponse,
        metadata: null
      });
      
      res.json({ userMessage, armoMessage, aiResponse });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process message" });
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

  const httpServer = createServer(app);
  return httpServer;
}

async function generateAIResponse(userMessage: string, vibe: string): Promise<string> {
  // Mock AI responses based on vibe - in production, integrate with Groq API
  const responses: Record<string, string[]> = {
    default: [
      `Բարև ախպեր! That's a great question about "${userMessage}". Let me help you with that...`,
      `Interesting point! In Armenian culture, we often say that understanding comes from listening, just like your question about "${userMessage}".`,
      `You know what, բարեկամ? Here's what I think about "${userMessage}"...`
    ],
    roast: [
      `Oh hell nah! You really asked about "${userMessage}"? Ախպեր, you're asking questions like my մայրիկ asks about the internet!`,
      `Listen here smartass, asking about "${userMessage}" is like asking why the sun is hot - obvious to everyone except you!`,
      `Bruh, you got the IQ of day-old lavash asking about "${userMessage}"! What were you thinking?`
    ],
    famous: [
      `Ooh that's fire content about "${userMessage}"! Here's your caption: ✨ Living my best Armenian life ✨ #ArmenianPride #Blessed #MainCharacterEnergy`,
      `This "${userMessage}" content is about to break Instagram! Try: 'Just Armenian things 💅 #Natural #Gorgeous #ArmenianQueen'`,
      `Ախպեր this "${userMessage}" is social media gold! Caption: 'Manifesting dreams into reality 🌟 #Motivation #ArmenianHustle'`
    ],
    alibi: [
      `Alright, here's your story for "${userMessage}": You were helping your մայրիկ with groceries and lost track of time. The receipt? She threw it away already!`,
      `Perfect alibi for "${userMessage}" coming up! You were stuck in traffic on the 405 - that's always believable in LA, ախպեր!`,
      `For "${userMessage}", say you were at your cousin's engagement party in Glendale. Everyone was there, no one will check!`
    ],
    therapy: [
      `I hear you talking about "${userMessage}", and those feelings are completely valid. Let's explore what's underneath this emotion...`,
      `"${userMessage}" sounds really challenging. How did that situation make you feel about yourself?`,
      `Thank you for sharing "${userMessage}" with me. What do you think would help you feel more at peace with this?`
    ],
    dating: [
      `Ախպեր, about "${userMessage}" - here's the tea: be yourself but level up your game! What kind of person are you hoping to attract?`,
      `Dating tip from your Armenian hopar about "${userMessage}": cook some good dolma on the third date - that's how you win hearts!`,
      `Listen բարեկամ, regarding "${userMessage}" - confidence is key! Tell me more about what you're looking for in a partner.`
    ]
  };
  
  const vibeResponses = responses[vibe] || responses.default;
  return vibeResponses[Math.floor(Math.random() * vibeResponses.length)];
}
