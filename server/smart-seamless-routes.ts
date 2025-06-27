import { Router } from "express";
import { smartCache } from "./smart-cache-performance";
import { contextualIntelligence, crossPlatformContinuity } from "./seamless-experience";

const router = Router();

// Smart Caching & Performance Routes

// Get predictive content (with caching)
router.post("/cache/predictive", async (req, res) => {
  try {
    const { scenario, parameters } = req.body;
    
    if (!scenario || !parameters) {
      return res.status(400).json({ error: "Missing scenario or parameters" });
    }

    const content = await smartCache.generatePredictiveContent(scenario, parameters);
    
    res.json({ 
      content,
      cached: true, // Content is now cached for future use
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting predictive content:', error);
    res.status(500).json({ error: "Failed to generate predictive content" });
  }
});

// Get cached voice clip or generate new one
router.post("/cache/voice", async (req, res) => {
  try {
    const { text, voiceProvider = 'elevenlabs', voiceId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Missing text parameter" });
    }

    // Check cache first
    const cached = await smartCache.getCachedVoiceClip(text, voiceProvider, voiceId);
    
    if (cached) {
      res.json({
        audioUrl: cached.audioUrl,
        duration: cached.duration,
        cached: true,
        hitCount: cached.hitCount
      });
    } else {
      // Generate new voice clip (this would integrate with existing voice generation)
      res.json({ 
        message: "Voice clip not cached, would generate new one",
        cached: false 
      });
    }
  } catch (error) {
    console.error('Error getting cached voice:', error);
    res.status(500).json({ error: "Failed to get voice clip" });
  }
});

// Start background processing
router.post("/background/start", async (req, res) => {
  try {
    const { 
      userId, 
      sessionId, 
      processType, 
      triggerCondition, 
      inputData,
      priority = 5 
    } = req.body;
    
    if (!processType || !triggerCondition || !inputData) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const processId = await smartCache.startBackgroundProcessing({
      userId,
      sessionId,
      processType,
      triggerCondition,
      inputData,
      priority
    });
    
    res.json({ 
      processId,
      status: 'queued',
      message: 'Background process started'
    });
  } catch (error) {
    console.error('Error starting background process:', error);
    res.status(500).json({ error: "Failed to start background process" });
  }
});

// Get background process status
router.get("/background/:processId", async (req, res) => {
  try {
    const processId = parseInt(req.params.processId);
    
    if (isNaN(processId)) {
      return res.status(400).json({ error: "Invalid process ID" });
    }

    const process = await smartCache.getBackgroundProcessStatus(processId);
    
    if (!process) {
      return res.status(404).json({ error: "Process not found" });
    }

    res.json({
      id: process.id,
      processType: process.processType,
      processStatus: process.processStatus,
      estimatedCompletion: process.estimatedCompletion,
      actualCompletion: process.actualCompletion,
      processingTimeMs: process.processingTimeMs,
      result: process.result,
      errorMessage: process.errorMessage
    });
  } catch (error) {
    console.error('Error getting process status:', error);
    res.status(500).json({ error: "Failed to get process status" });
  }
});

// Get cache statistics
router.get("/cache/stats", async (req, res) => {
  try {
    const stats = await smartCache.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: "Failed to get cache statistics" });
  }
});

// Seamless Experience Routes

// Get auto-complete suggestions
router.post("/autocomplete", async (req, res) => {
  try {
    const { questionPattern, userInput, context } = req.body;
    
    if (!questionPattern || !userInput) {
      return res.status(400).json({ error: "Missing questionPattern or userInput" });
    }

    const suggestions = await contextualIntelligence.getAutoCompleteSuggestions(
      questionPattern,
      userInput,
      context || {}
    );
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
});

// Record suggestion usage
router.post("/autocomplete/usage", async (req, res) => {
  try {
    const { suggestionId, wasAccepted } = req.body;
    
    if (suggestionId === undefined || wasAccepted === undefined) {
      return res.status(400).json({ error: "Missing suggestionId or wasAccepted" });
    }

    await contextualIntelligence.recordSuggestionUsage(suggestionId, wasAccepted);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording suggestion usage:', error);
    res.status(500).json({ error: "Failed to record usage" });
  }
});

// Check contradictions in answers
router.post("/contradictions/check", async (req, res) => {
  try {
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing or invalid answers array" });
    }

    const contradictions = await contextualIntelligence.checkContradictions(answers);
    
    res.json({ 
      contradictions,
      hasContradictions: contradictions.length > 0 
    });
  } catch (error) {
    console.error('Error checking contradictions:', error);
    res.status(500).json({ error: "Failed to check contradictions" });
  }
});

// Get plausibility hints
router.post("/hints", async (req, res) => {
  try {
    const { scenario, questionType, context } = req.body;
    
    if (!scenario || !questionType) {
      return res.status(400).json({ error: "Missing scenario or questionType" });
    }

    const hints = await contextualIntelligence.getPlausibilityHints(
      scenario,
      questionType,
      context || {}
    );
    
    res.json({ hints });
  } catch (error) {
    console.error('Error getting hints:', error);
    res.status(500).json({ error: "Failed to get hints" });
  }
});

// Record hint followed
router.post("/hints/:hintId/followed", async (req, res) => {
  try {
    const hintId = parseInt(req.params.hintId);
    
    if (isNaN(hintId)) {
      return res.status(400).json({ error: "Invalid hint ID" });
    }

    await contextualIntelligence.recordHintFollowed(hintId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording hint followed:', error);
    res.status(500).json({ error: "Failed to record hint followed" });
  }
});

// Cross-Platform Continuity Routes

// Create session handoff
router.post("/handoff/create", async (req, res) => {
  try {
    const { 
      userId, 
      sessionId, 
      sourceDevice, 
      sessionState, 
      currentStep, 
      progress 
    } = req.body;
    
    if (!userId || !sessionId || !sourceDevice || !sessionState || !currentStep || !progress) {
      return res.status(400).json({ error: "Missing required handoff parameters" });
    }

    const handoffToken = await crossPlatformContinuity.createSessionHandoff(
      userId,
      sessionId,
      sourceDevice,
      sessionState,
      currentStep,
      progress
    );
    
    res.json({ 
      handoffToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      message: "Session handoff created. Use this token on your target device."
    });
  } catch (error) {
    console.error('Error creating session handoff:', error);
    res.status(500).json({ error: "Failed to create session handoff" });
  }
});

// Complete session handoff
router.post("/handoff/complete", async (req, res) => {
  try {
    const { handoffToken, targetDevice } = req.body;
    
    if (!handoffToken || !targetDevice) {
      return res.status(400).json({ error: "Missing handoffToken or targetDevice" });
    }

    const handoff = await crossPlatformContinuity.completeSessionHandoff(handoffToken, targetDevice);
    
    if (!handoff) {
      return res.status(404).json({ error: "Invalid or expired handoff token" });
    }

    res.json({
      success: true,
      sessionState: handoff.sessionState,
      currentStep: handoff.currentStep,
      progress: handoff.progress,
      sourceDevice: handoff.sourceDevice,
      message: "Session handoff completed successfully"
    });
  } catch (error) {
    console.error('Error completing session handoff:', error);
    res.status(500).json({ error: "Failed to complete session handoff" });
  }
});

// Save quick resume point
router.post("/resume/save", async (req, res) => {
  try {
    const { 
      userId, 
      sessionId, 
      featureType, 
      resumePoint, 
      savedState, 
      metadata 
    } = req.body;
    
    if (!userId || !sessionId || !featureType || !resumePoint || !savedState) {
      return res.status(400).json({ error: "Missing required resume parameters" });
    }

    await crossPlatformContinuity.saveQuickResume(
      userId,
      sessionId,
      featureType,
      resumePoint,
      savedState,
      metadata
    );
    
    res.json({ 
      success: true,
      message: "Quick resume point saved"
    });
  } catch (error) {
    console.error('Error saving quick resume:', error);
    res.status(500).json({ error: "Failed to save quick resume" });
  }
});

// Get quick resume options
router.get("/resume/options/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const resumeOptions = await crossPlatformContinuity.getQuickResumeOptions(userId);
    
    res.json({ 
      resumeOptions: resumeOptions.map(option => ({
        id: option.id,
        featureType: option.featureType,
        resumePoint: option.resumePoint,
        metadata: option.metadata,
        timesResumed: option.timesResumed,
        lastResumed: option.lastResumed,
        createdAt: option.createdAt,
        expiresAt: option.expiresAt
      }))
    });
  } catch (error) {
    console.error('Error getting resume options:', error);
    res.status(500).json({ error: "Failed to get resume options" });
  }
});

// Resume from saved point
router.post("/resume/:resumeId", async (req, res) => {
  try {
    const resumeId = parseInt(req.params.resumeId);
    
    if (isNaN(resumeId)) {
      return res.status(400).json({ error: "Invalid resume ID" });
    }

    const resumePoint = await crossPlatformContinuity.resumeFromPoint(resumeId);
    
    if (!resumePoint) {
      return res.status(404).json({ error: "Resume point not found" });
    }

    res.json({
      success: true,
      featureType: resumePoint.featureType,
      resumePoint: resumePoint.resumePoint,
      savedState: resumePoint.savedState,
      metadata: resumePoint.metadata,
      timesResumed: resumePoint.timesResumed,
      message: "Successfully resumed from saved point"
    });
  } catch (error) {
    console.error('Error resuming from point:', error);
    res.status(500).json({ error: "Failed to resume from point" });
  }
});

// Smart Bookmarking Routes

// Create smart bookmark
router.post("/bookmarks/create", async (req, res) => {
  try {
    const { 
      userId, 
      sessionId, 
      bookmarkType, 
      bookmarkPoint, 
      savedState, 
      completionPercentage,
      autoSaveTrigger,
      isOptimalPoint = false
    } = req.body;
    
    if (!userId || !sessionId || !bookmarkType || !bookmarkPoint || !savedState || completionPercentage === undefined) {
      return res.status(400).json({ error: "Missing required bookmark parameters" });
    }

    await crossPlatformContinuity.createSmartBookmark(
      userId,
      sessionId,
      bookmarkType,
      bookmarkPoint,
      savedState,
      completionPercentage,
      autoSaveTrigger,
      isOptimalPoint
    );
    
    res.json({ 
      success: true,
      message: "Smart bookmark created"
    });
  } catch (error) {
    console.error('Error creating smart bookmark:', error);
    res.status(500).json({ error: "Failed to create smart bookmark" });
  }
});

// Get smart bookmarks
router.get("/bookmarks/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string) : undefined;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const bookmarks = await crossPlatformContinuity.getSmartBookmarks(userId, sessionId);
    
    res.json({ 
      bookmarks: bookmarks.map(bookmark => ({
        id: bookmark.id,
        bookmarkType: bookmark.bookmarkType,
        bookmarkPoint: bookmark.bookmarkPoint,
        completionPercentage: bookmark.completionPercentage,
        estimatedTimeRemaining: bookmark.estimatedTimeRemaining,
        isOptimalPoint: bookmark.isOptimalPoint,
        accessCount: bookmark.accessCount,
        lastAccessed: bookmark.lastAccessed,
        createdAt: bookmark.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting smart bookmarks:', error);
    res.status(500).json({ error: "Failed to get smart bookmarks" });
  }
});

// Access bookmark
router.post("/bookmarks/:bookmarkId/access", async (req, res) => {
  try {
    const bookmarkId = parseInt(req.params.bookmarkId);
    
    if (isNaN(bookmarkId)) {
      return res.status(400).json({ error: "Invalid bookmark ID" });
    }

    const bookmark = await crossPlatformContinuity.accessBookmark(bookmarkId);
    
    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    res.json({
      success: true,
      savedState: bookmark.savedState,
      bookmarkPoint: bookmark.bookmarkPoint,
      completionPercentage: bookmark.completionPercentage,
      accessCount: bookmark.accessCount + 1,
      message: "Bookmark accessed successfully"
    });
  } catch (error) {
    console.error('Error accessing bookmark:', error);
    res.status(500).json({ error: "Failed to access bookmark" });
  }
});

// Detect optimal save point
router.post("/bookmarks/detect-optimal", async (req, res) => {
  try {
    const { userId, sessionId, currentState, completionPercentage } = req.body;
    
    if (!userId || !sessionId || !currentState || completionPercentage === undefined) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const isOptimal = await crossPlatformContinuity.detectOptimalSavePoint(
      userId,
      sessionId,
      currentState,
      completionPercentage
    );
    
    res.json({ 
      isOptimal,
      message: isOptimal ? "Optimal save point detected and saved" : "Not an optimal save point"
    });
  } catch (error) {
    console.error('Error detecting optimal save point:', error);
    res.status(500).json({ error: "Failed to detect optimal save point" });
  }
});

export default router;