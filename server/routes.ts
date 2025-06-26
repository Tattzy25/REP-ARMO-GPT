import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

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

        let stream;
        if (hasImages && messageData.metadata && 'attachments' in messageData.metadata) {
          // Use vision-enabled AI response
          console.log('Using vision API for image analysis');
          stream = await generateAIResponseWithVision(messageData.content, session.vibe, messageData.metadata.attachments as any[]);
        } else {
          // Use regular text-only AI response
          console.log('Using regular text API');
          stream = await generateAIResponseStream(messageData.content, session.vibe);
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
        // Fallback to non-streaming
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
        
        let aiResponse;
        if (hasImages && messageData.metadata && 'attachments' in messageData.metadata) {
          aiResponse = await generateAIResponseWithVisionFallback(messageData.content, session.vibe, messageData.metadata.attachments as any[]);
        } else {
          aiResponse = await generateAIResponseFallback(messageData.content, session.vibe);
        }
        
        const armoMessage = await storage.createMessage({
          sessionId: messageData.sessionId!,
          sender: "armo",
          content: aiResponse,
          metadata: null
        });
        res.write(`data: ${JSON.stringify({ type: 'complete', message: armoMessage })}\n\n`);
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
    return "I need a Groq API key to analyze images. Please contact support.";
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
    return data.choices[0]?.message?.content || "Sorry, I couldn't analyze the image.";
  } catch (error) {
    console.error('Vision fallback error:', error);
    return "Sorry ախպեր, I'm having trouble analyzing that image right now. Try again in a moment!";
  }
}

async function generateAIResponseFallback(userMessage: string, vibe: string): Promise<string> {
  const fallbackResponses: Record<string, string> = {
    default: "Բարև ախպեր! I'm here to help with whatever you need. What's on your mind?",
    roast: "Bruh, something went wrong but I'm still here to roast you! What's up?",
    famous: "Tech issues can't stop us from making you famous! What content are we creating?",
    dating: "My servers are acting shy like a first date, but I'm still your wingman!",
    therapy: "I'm experiencing some technical emotions, but I'm here to listen.",
    alibi: "Even my excuses have excuses right now, but I got you covered!"
  };
  
  return fallbackResponses[vibe] || fallbackResponses.default;
}
