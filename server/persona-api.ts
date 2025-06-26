// Persona Management REST API Routes

import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { PERSONA_LIBRARY, getPersonaById, getPersonaByLevel } from "./persona-content";
import { 
  insertPersonaLevelSchema, 
  insertLanguagePermissionSchema,
  insertUserMoodDetectionSchema,
  insertUserEmotionDetectionSchema,
  insertUserBehaviorDetectionSchema,
  insertUserEngagementDetectionSchema,
  insertUserIntentDetectionSchema,
  insertReusableContentRepositorySchema
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// PERSONA MANAGEMENT ENDPOINTS

// GET /api/personas - List all personas
router.get("/personas", async (req: Request, res: Response) => {
  try {
    const personas = await storage.getAllPersonaLevels();
    const enrichedPersonas = personas.map(persona => {
      const content = getPersonaById(persona.id);
      return {
        ...persona,
        content: content ? {
          systemPrompt: content.systemPrompt,
          languageRules: content.languageRules,
          seedContent: content.seedContent
        } : null
      };
    });
    
    res.json({
      success: true,
      data: enrichedPersonas,
      library: Object.values(PERSONA_LIBRARY).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch personas" });
  }
});

// GET /api/personas/:id - Get specific persona details
router.get("/personas/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const persona = await storage.getPersonaLevel(id);
    
    if (!persona) {
      return res.status(404).json({ success: false, error: "Persona not found" });
    }

    const content = getPersonaById(id);
    const languagePermissions = await storage.getLanguagePermissions(id);

    res.json({
      success: true,
      data: {
        ...persona,
        content,
        languagePermissions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch persona" });
  }
});

// POST /api/personas - Create new persona
router.post("/personas", async (req: Request, res: Response) => {
  try {
    const validatedData = insertPersonaLevelSchema.parse(req.body);
    const persona = await storage.createPersonaLevel(validatedData);
    
    res.status(201).json({
      success: true,
      data: persona
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid persona data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to create persona" });
  }
});

// POST /api/personas/:id/permissions - Add language permission
router.post("/personas/:id/permissions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = insertLanguagePermissionSchema.parse({
      ...req.body,
      personaLevelId: id
    });
    
    const permission = await storage.createLanguagePermission(validatedData);
    
    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid permission data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to create permission" });
  }
});

// USER DETECTION ENDPOINTS

// POST /api/detection/mood - Record mood detection
router.post("/detection/mood", async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserMoodDetectionSchema.parse(req.body);
    const detection = await storage.recordMoodDetection(validatedData);
    
    res.status(201).json({
      success: true,
      data: detection
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid mood data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to record mood detection" });
  }
});

// GET /api/detection/mood/:userId/:sessionId - Get mood history
router.get("/detection/mood/:userId/:sessionId", async (req: Request, res: Response) => {
  try {
    const { userId, sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const moodHistory = await storage.getMoodHistory(parseInt(userId), parseInt(sessionId), limit);
    
    res.json({
      success: true,
      data: moodHistory
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch mood history" });
  }
});

// POST /api/detection/emotion - Record emotion detection
router.post("/detection/emotion", async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserEmotionDetectionSchema.parse(req.body);
    const detection = await storage.recordEmotionDetection(validatedData);
    
    res.status(201).json({
      success: true,
      data: detection
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid emotion data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to record emotion detection" });
  }
});

// POST /api/detection/behavior - Record behavior detection
router.post("/detection/behavior", async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserBehaviorDetectionSchema.parse(req.body);
    const detection = await storage.recordBehaviorDetection(validatedData);
    
    res.status(201).json({
      success: true,
      data: detection
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid behavior data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to record behavior detection" });
  }
});

// POST /api/detection/engagement - Record engagement detection
router.post("/detection/engagement", async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserEngagementDetectionSchema.parse(req.body);
    const detection = await storage.recordEngagementDetection(validatedData);
    
    res.status(201).json({
      success: true,
      data: detection
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid engagement data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to record engagement detection" });
  }
});

// POST /api/detection/intent - Record intent detection
router.post("/detection/intent", async (req: Request, res: Response) => {
  try {
    const validatedData = insertUserIntentDetectionSchema.parse(req.body);
    const detection = await storage.recordIntentDetection(validatedData);
    
    res.status(201).json({
      success: true,
      data: detection
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid intent data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to record intent detection" });
  }
});

// CONTENT LEARNING ENDPOINTS

// POST /api/content/reusable - Save reusable content
router.post("/content/reusable", async (req: Request, res: Response) => {
  try {
    const validatedData = insertReusableContentRepositorySchema.parse(req.body);
    const content = await storage.saveReusableContent(validatedData);
    
    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid content data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to save content" });
  }
});

// GET /api/content/reusable - Get reusable content
router.get("/content/reusable", async (req: Request, res: Response) => {
  try {
    const { category, personaLevel, excludeUserId } = req.query;
    
    if (!category || !personaLevel) {
      return res.status(400).json({ 
        success: false, 
        error: "Category and personaLevel are required" 
      });
    }

    const content = await storage.getReusableContent(
      category as string,
      parseInt(personaLevel as string),
      excludeUserId ? parseInt(excludeUserId as string) : undefined
    );
    
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch reusable content" });
  }
});

// ANALYTICS ENDPOINTS

// GET /api/analytics/user/:userId - Get comprehensive user analytics
router.get("/analytics/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.query;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const userIdNum = parseInt(userId);
    const sessionIdNum = sessionId ? parseInt(sessionId as string) : 0;

    // Gather all detection data
    const [
      latestGender,
      moodHistory,
      emotionHistory,
      behaviorHistory,
      engagementHistory,
      intentHistory
    ] = await Promise.all([
      storage.getLatestGenderDetection(userIdNum),
      sessionId ? storage.getMoodHistory(userIdNum, sessionIdNum, limit) : [],
      sessionId ? storage.getEmotionHistory(userIdNum, sessionIdNum, limit) : [],
      sessionId ? storage.getBehaviorHistory(userIdNum, sessionIdNum, limit) : [],
      sessionId ? storage.getEngagementHistory(userIdNum, sessionIdNum, limit) : [],
      sessionId ? storage.getIntentHistory(userIdNum, sessionIdNum, limit) : []
    ]);

    res.json({
      success: true,
      data: {
        userId: userIdNum,
        sessionId: sessionIdNum,
        profile: {
          gender: latestGender
        },
        history: {
          mood: moodHistory,
          emotion: emotionHistory,
          behavior: behaviorHistory,
          engagement: engagementHistory,
          intent: intentHistory
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch user analytics" });
  }
});

export default router;