import { Router } from "express";
import { z } from "zod";
import { socialSharingSystem } from "./social-sharing";
import { advancedPersonaLearning } from "./advanced-persona-learning";
import { db } from "./db";
import { shareTemplates, InsertShareTemplate } from "@shared/schema";

const router = Router();

// Social & Sharing Routes

/**
 * Get community alibi gallery with privacy protection
 */
router.get("/gallery", async (req, res) => {
  try {
    const {
      category,
      limit = "20",
      offset = "0",
      sortBy = "funny",
      excludeUserId
    } = req.query;

    const gallery = await socialSharingSystem.getCommunityGallery({
      category: category as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as 'funny' | 'believability' | 'recent' | 'reactions',
      excludeUserId: excludeUserId ? parseInt(excludeUserId as string) : undefined
    });

    res.json({
      success: true,
      gallery,
      total: gallery.length
    });

  } catch (error) {
    console.error("Gallery fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch gallery"
    });
  }
});

/**
 * Submit alibi to community gallery
 */
router.post("/gallery/submit", async (req, res) => {
  try {
    const submitSchema = z.object({
      alibiGenerationId: z.number(),
      userId: z.number(),
      isPublic: z.boolean().default(false)
    });

    const { alibiGenerationId, userId, isPublic } = submitSchema.parse(req.body);

    const result = await socialSharingSystem.submitToGallery(
      alibiGenerationId,
      userId,
      isPublic
    );

    res.json(result);

  } catch (error) {
    console.error("Gallery submission error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? "Invalid request data" : "Submission failed"
    });
  }
});

/**
 * Add emoji reaction to gallery item
 */
router.post("/gallery/:galleryId/react", async (req, res) => {
  try {
    const reactionSchema = z.object({
      userId: z.number(),
      reactionType: z.string().regex(/^[😂😱🤯👏🔥💯]$/, "Invalid emoji")
    });

    const galleryId = parseInt(req.params.galleryId);
    const { userId, reactionType } = reactionSchema.parse(req.body);

    const result = await socialSharingSystem.addReaction(galleryId, userId, reactionType);

    res.json(result);

  } catch (error) {
    console.error("Reaction error:", error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? "Invalid reaction data" : "Failed to add reaction"
    });
  }
});

/**
 * Generate social media share content
 */
router.post("/share/generate", async (req, res) => {
  try {
    const shareSchema = z.object({
      alibiGenerationId: z.number(),
      platform: z.enum(['twitter', 'instagram', 'facebook', 'tiktok'])
    });

    const { alibiGenerationId, platform } = shareSchema.parse(req.body);

    const shareContent = await socialSharingSystem.generateShareContent(
      alibiGenerationId,
      platform
    );

    res.json({
      success: true,
      shareContent
    });

  } catch (error) {
    console.error("Share generation error:", error);
    res.status(400).json({
      success: false,
      error: "Failed to generate share content"
    });
  }
});

/**
 * Record social media share
 */
router.post("/share/record", async (req, res) => {
  try {
    const recordSchema = z.object({
      userId: z.number(),
      alibiGenerationId: z.number(),
      platform: z.string(),
      shareContent: z.string(),
      shareUrl: z.string().url().optional()
    });

    const data = recordSchema.parse(req.body);

    await socialSharingSystem.recordShare(
      data.userId,
      data.alibiGenerationId,
      data.platform,
      data.shareContent,
      data.shareUrl
    );

    res.json({
      success: true,
      message: "Share recorded successfully"
    });

  } catch (error) {
    console.error("Share recording error:", error);
    res.status(400).json({
      success: false,
      error: "Failed to record share"
    });
  }
});

/**
 * Get user's sharing history
 */
router.get("/share/history/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await socialSharingSystem.getUserSharingHistory(userId, limit);

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error("Share history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sharing history"
    });
  }
});

/**
 * Get gallery statistics
 */
router.get("/gallery/stats", async (req, res) => {
  try {
    const stats = await socialSharingSystem.getGalleryStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("Gallery stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics"
    });
  }
});

// Advanced Persona Learning Routes

/**
 * Initialize user persona with contextual awareness
 */
router.post("/persona/initialize", async (req, res) => {
  try {
    const initSchema = z.object({
      userId: z.number(),
      sessionId: z.number(),
      timeOfDay: z.string().optional(),
      dayOfWeek: z.string().optional(),
      deviceType: z.string(),
      urgencyLevel: z.enum(['low', 'normal', 'high', 'emergency']).default('normal'),
      socialContext: z.string().optional(),
      locationContext: z.string().optional()
    });

    const context = initSchema.parse(req.body);

    const personaInsights = await advancedPersonaLearning.initializeUserPersona(context);

    res.json({
      success: true,
      personaInsights
    });

  } catch (error) {
    console.error("Persona initialization error:", error);
    res.status(400).json({
      success: false,
      error: "Failed to initialize persona"
    });
  }
});

/**
 * Learn from alibi generation results
 */
router.post("/persona/learn", async (req, res) => {
  try {
    const learnSchema = z.object({
      userId: z.number(),
      alibiGenerationId: z.number(),
      believabilityScore: z.number().min(0).max(10),
      userFeedback: z.enum(['positive', 'negative', 'neutral']).optional()
    });

    const { userId, alibiGenerationId, believabilityScore, userFeedback } = learnSchema.parse(req.body);

    await advancedPersonaLearning.learnFromResults(
      userId,
      alibiGenerationId,
      believabilityScore,
      userFeedback
    );

    res.json({
      success: true,
      message: "Learning recorded successfully"
    });

  } catch (error) {
    console.error("Persona learning error:", error);
    res.status(400).json({
      success: false,
      error: "Failed to record learning"
    });
  }
});

/**
 * Get contextual persona recommendations
 */
router.post("/persona/recommendations", async (req, res) => {
  try {
    const recSchema = z.object({
      userId: z.number(),
      sessionId: z.number(),
      timeOfDay: z.string().optional(),
      deviceType: z.string(),
      urgencyLevel: z.enum(['low', 'normal', 'high', 'emergency']).default('normal'),
      socialContext: z.string().optional(),
      locationContext: z.string().optional()
    });

    const context = recSchema.parse(req.body);

    const recommendations = await advancedPersonaLearning.getContextualRecommendations(context);

    res.json({
      success: true,
      recommendations
    });

  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(400).json({
      success: false,
      error: "Failed to get recommendations"
    });
  }
});

// Share Templates Management

/**
 * Create share template
 */
router.post("/share/templates", async (req, res) => {
  try {
    const templateSchema = z.object({
      id: z.string(),
      platform: z.string(),
      templateName: z.string(),
      templateContent: z.string(),
      placeholders: z.array(z.any()),
      isActive: z.boolean().default(true)
    });

    const templateData = templateSchema.parse(req.body);

    const [template] = await db
      .insert(shareTemplates)
      .values(templateData as InsertShareTemplate)
      .returning();

    res.json({
      success: true,
      template
    });

  } catch (error) {
    console.error("Template creation error:", error);
    res.status(400).json({
      success: false,
      error: "Failed to create template"
    });
  }
});

/**
 * Get share templates by platform
 */
router.get("/share/templates/:platform", async (req, res) => {
  try {
    const platform = req.params.platform;

    const templates = await db
      .select()
      .from(shareTemplates)
      .where(
        db.sql`${shareTemplates.platform} = ${platform} AND ${shareTemplates.isActive} = true`
      );

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error("Template fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates"
    });
  }
});

export default router;