import { Router } from "express";
import { streamingManager, intelligentPrefetching, edgeComputing } from "./performance-optimizations";
import { successPrediction, abTesting, sentimentAnalyzer } from "./advanced-analytics";
import { gracefulDegradation, multiProviderBackup, progressiveEnhancement } from "./reliability-features";

const router = Router();

// Performance Optimization Routes

// Stream alibi generation
router.post("/stream/alibi", async (req, res) => {
  try {
    const { answers, scenario, userContext } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing or invalid answers array" });
    }

    // Set headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Stream generation results
    for await (const chunk of streamingManager.streamAlibiGeneration(answers, scenario, userContext)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Error in streaming alibi generation:', error);
    res.status(500).json({ error: "Failed to stream alibi generation" });
  }
});

// Stream voice synthesis  
router.post("/stream/voice", async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Missing text parameter" });
    }

    const audioStream = await streamingManager.streamVoiceSynthesis(text, voiceId || 'pNInz6obpgDQGcFmaJgB');
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Pipe the audio stream to response
    const reader = audioStream.getReader();
    
    const pump = async () => {
      const { done, value } = await reader.read();
      
      if (done) {
        res.end();
        return;
      }
      
      res.write(value);
      return pump();
    };
    
    await pump();
  } catch (error) {
    console.error('Error streaming voice:', error);
    res.status(500).json({ error: "Failed to stream voice synthesis" });
  }
});

// Intelligent prefetching
router.post("/prefetch/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userAgent = req.headers['user-agent'] || '';
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    await intelligentPrefetching.prefetchForUser(userId, userAgent);
    
    res.json({ 
      success: true,
      message: "Prefetching initiated for user",
      userId 
    });
  } catch (error) {
    console.error('Error in prefetching:', error);
    res.status(500).json({ error: "Failed to initiate prefetching" });
  }
});

// Get user behavior analysis
router.get("/analysis/behavior/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const behavior = await intelligentPrefetching.analyzeUserBehavior(userId);
    
    res.json({ 
      behavior,
      success: true 
    });
  } catch (error) {
    console.error('Error analyzing behavior:', error);
    res.status(500).json({ error: "Failed to analyze user behavior" });
  }
});

// Advanced Analytics Routes

// Predict alibi satisfaction
router.post("/analytics/predict-satisfaction", async (req, res) => {
  try {
    const { answers, userContext, userHistory } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Missing or invalid answers array" });
    }

    const prediction = await successPrediction.predictAlibiSatisfaction(
      answers,
      userContext || {},
      userHistory
    );
    
    res.json({ 
      prediction,
      success: true 
    });
  } catch (error) {
    console.error('Error predicting satisfaction:', error);
    res.status(500).json({ error: "Failed to predict satisfaction" });
  }
});

// Record satisfaction feedback
router.post("/analytics/satisfaction-feedback", async (req, res) => {
  try {
    const { userId, alibiId, actualSatisfaction, predictedSatisfaction } = req.body;
    
    if (!userId || !alibiId || actualSatisfaction === undefined || predictedSatisfaction === undefined) {
      return res.status(400).json({ error: "Missing required feedback parameters" });
    }

    await successPrediction.recordSatisfactionFeedback(
      userId,
      alibiId,
      actualSatisfaction,
      predictedSatisfaction
    );
    
    res.json({ 
      success: true,
      message: "Satisfaction feedback recorded"
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ error: "Failed to record satisfaction feedback" });
  }
});

// A/B Testing Routes

// Create A/B test
router.post("/ab-test/create", async (req, res) => {
  try {
    const { testName, variants, allocation, duration, metrics } = req.body;
    
    if (!testName || !variants || !allocation || !duration || !metrics) {
      return res.status(400).json({ error: "Missing required test parameters" });
    }

    const testId = await abTesting.createABTest(testName, variants, allocation, duration, metrics);
    
    res.json({ 
      testId,
      success: true,
      message: "A/B test created successfully"
    });
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({ error: "Failed to create A/B test" });
  }
});

// Assign user to test variant
router.post("/ab-test/:testId/assign/:userId", async (req, res) => {
  try {
    const testId = req.params.testId;
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const variant = await abTesting.assignUserToVariant(testId, userId);
    
    res.json({ 
      variant,
      testId,
      userId,
      success: true 
    });
  } catch (error) {
    console.error('Error assigning user to variant:', error);
    res.status(500).json({ error: "Failed to assign user to variant" });
  }
});

// Record test metric
router.post("/ab-test/:testId/metric", async (req, res) => {
  try {
    const testId = req.params.testId;
    const { userId, metricName, value } = req.body;
    
    if (!userId || !metricName || value === undefined) {
      return res.status(400).json({ error: "Missing metric parameters" });
    }

    await abTesting.recordTestMetric(testId, userId, metricName, value);
    
    res.json({ 
      success: true,
      message: "Test metric recorded"
    });
  } catch (error) {
    console.error('Error recording test metric:', error);
    res.status(500).json({ error: "Failed to record test metric" });
  }
});

// Get test results
router.get("/ab-test/:testId/results", async (req, res) => {
  try {
    const testId = req.params.testId;
    
    const results = await abTesting.getTestResults(testId);
    
    if (!results) {
      return res.status(404).json({ error: "Test not found" });
    }

    res.json({ 
      results,
      success: true 
    });
  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({ error: "Failed to get test results" });
  }
});

// Create predefined tests
router.post("/ab-test/humor-style", async (req, res) => {
  try {
    const testId = await abTesting.createHumorStyleTest();
    res.json({ testId, success: true });
  } catch (error) {
    console.error('Error creating humor style test:', error);
    res.status(500).json({ error: "Failed to create humor style test" });
  }
});

router.post("/ab-test/question-flow", async (req, res) => {
  try {
    const testId = await abTesting.createQuestionFlowTest();
    res.json({ testId, success: true });
  } catch (error) {
    console.error('Error creating question flow test:', error);
    res.status(500).json({ error: "Failed to create question flow test" });
  }
});

// Real-time Sentiment Analysis

// Analyze typing patterns
router.post("/sentiment/typing", async (req, res) => {
  try {
    const { typingPatterns } = req.body;
    
    if (!typingPatterns) {
      return res.status(400).json({ error: "Missing typing patterns" });
    }

    const sentiment = await sentimentAnalyzer.analyzeSentimentFromTyping(typingPatterns);
    
    res.json({ 
      sentiment,
      success: true 
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

// Adjust response tone based on sentiment
router.post("/sentiment/adjust-response", async (req, res) => {
  try {
    const { sentiment, baseResponse, userContext } = req.body;
    
    if (!sentiment || !baseResponse) {
      return res.status(400).json({ error: "Missing sentiment or base response" });
    }

    const adjustedResponse = await sentimentAnalyzer.adjustResponseTone(
      sentiment,
      baseResponse,
      userContext || {}
    );
    
    res.json({ 
      adjustedResponse,
      originalResponse: baseResponse,
      success: true 
    });
  } catch (error) {
    console.error('Error adjusting response tone:', error);
    res.status(500).json({ error: "Failed to adjust response tone" });
  }
});

// Record sentiment metrics
router.post("/sentiment/record", async (req, res) => {
  try {
    const { userId, sessionId, sentiment, responseAdjustment } = req.body;
    
    if (!userId || !sessionId || !sentiment) {
      return res.status(400).json({ error: "Missing required sentiment parameters" });
    }

    await sentimentAnalyzer.recordSentimentMetrics(
      userId,
      sessionId,
      sentiment,
      responseAdjustment || 'none'
    );
    
    res.json({ 
      success: true,
      message: "Sentiment metrics recorded"
    });
  } catch (error) {
    console.error('Error recording sentiment metrics:', error);
    res.status(500).json({ error: "Failed to record sentiment metrics" });
  }
});

// Reliability Features Routes

// Get offline mode status
router.get("/reliability/offline-mode", async (req, res) => {
  try {
    const offlineMode = await gracefulDegradation.getOfflineMode();
    
    res.json({ 
      offlineMode,
      success: true 
    });
  } catch (error) {
    console.error('Error getting offline mode:', error);
    res.status(500).json({ error: "Failed to get offline mode status" });
  }
});

// Generate offline alibi
router.post("/reliability/offline-alibi", async (req, res) => {
  try {
    const { scenario, urgency, category } = req.body;
    
    if (!scenario) {
      return res.status(400).json({ error: "Missing scenario parameter" });
    }

    const result = await gracefulDegradation.generateOfflineAlibi(scenario, urgency, category);
    
    res.json({ 
      result,
      success: true 
    });
  } catch (error) {
    console.error('Error generating offline alibi:', error);
    res.status(500).json({ error: "Failed to generate offline alibi" });
  }
});

// Progressive enhancement
router.post("/reliability/enhance", async (req, res) => {
  try {
    const { baseAlibi, userPreferences } = req.body;
    
    if (!baseAlibi) {
      return res.status(400).json({ error: "Missing base alibi" });
    }

    const enhanced = await gracefulDegradation.enableProgressiveEnhancement(
      baseAlibi,
      userPreferences || {}
    );
    
    res.json({ 
      enhanced,
      success: true 
    });
  } catch (error) {
    console.error('Error enhancing alibi:', error);
    res.status(500).json({ error: "Failed to enhance alibi" });
  }
});

// Multi-provider backup status
router.get("/reliability/providers", async (req, res) => {
  try {
    const providers = await multiProviderBackup.getAvailableProviders();
    
    res.json({ 
      providers,
      success: true 
    });
  } catch (error) {
    console.error('Error getting provider status:', error);
    res.status(500).json({ error: "Failed to get provider status" });
  }
});

// Generate with fallback
router.post("/reliability/generate-fallback", async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt parameter" });
    }

    const result = await multiProviderBackup.generateWithFallback(prompt, options || {});
    
    res.json({ 
      result,
      success: true 
    });
  } catch (error) {
    console.error('Error generating with fallback:', error);
    res.status(500).json({ error: "Failed to generate with fallback" });
  }
});

// Voice synthesis with fallback
router.post("/reliability/voice-fallback", async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Missing text parameter" });
    }

    const result = await multiProviderBackup.synthesizeVoiceWithFallback(text, voiceId);
    
    if (result.audioData) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(result.audioData));
    } else {
      res.json({ 
        result,
        success: true 
      });
    }
  } catch (error) {
    console.error('Error with voice fallback:', error);
    res.status(500).json({ error: "Failed to synthesize voice with fallback" });
  }
});

// Progressive enhancement features
router.get("/reliability/features", async (req, res) => {
  try {
    const userCapabilities = {
      features: req.headers['x-browser-features']?.split(',') || [],
      connection: {
        downlink: parseFloat(req.headers['x-connection-downlink'] as string) || 5
      }
    };

    const featureMatrix = await progressiveEnhancement.getFeatureMatrix(userCapabilities);
    
    res.json({ 
      featureMatrix,
      success: true 
    });
  } catch (error) {
    console.error('Error getting feature matrix:', error);
    res.status(500).json({ error: "Failed to get feature matrix" });
  }
});

// Enable feature gracefully
router.post("/reliability/enable-feature", async (req, res) => {
  try {
    const { featureName } = req.body;
    
    if (!featureName) {
      return res.status(400).json({ error: "Missing feature name" });
    }

    const enabled = await progressiveEnhancement.enableFeatureGracefully(featureName);
    
    res.json({ 
      enabled,
      featureName,
      success: true 
    });
  } catch (error) {
    console.error('Error enabling feature:', error);
    res.status(500).json({ error: "Failed to enable feature" });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const offlineMode = await gracefulDegradation.getOfflineMode();
    const providers = await multiProviderBackup.getAvailableProviders();
    
    res.json({
      status: offlineMode.isOnline ? 'online' : 'offline',
      timestamp: new Date().toISOString(),
      providers: providers.healthStatus,
      features: offlineMode.availableFeatures,
      success: true
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ 
      status: 'error',
      error: "Health check failed",
      success: false 
    });
  }
});

export default router;