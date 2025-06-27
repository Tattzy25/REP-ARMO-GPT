import { Router } from "express";
import { multiModelAI, achievementSystem, enhancedTemplates } from "./enhanced-ai-processing";
import { storage } from "./storage";

const router = Router();

// Enhanced Alibi Generation with Progressive Reveal
router.post("/alibi/enhanced-generate", async (req, res) => {
  try {
    const { answers, scenario, userId, sessionId, userContext } = req.body;
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Missing or invalid answers array" });
    }

    // Generate enhanced alibi with all features
    const enhancedResult = await multiModelAI.generateEnhancedAlibi(
      answers,
      scenario || 'general',
      userContext || { personaLevel: 3, armenianMix: 0.3 }
    );

    // Check for achievements
    const newAchievements = await achievementSystem.checkAndUnlockAchievements(
      userId || 1,
      sessionId || 1,
      enhancedResult
    );

    // Store believability metrics
    if (userId && sessionId) {
      await multiModelAI.storeBelievabilityMetrics(
        userId,
        sessionId,
        `alibi_${Date.now()}`,
        enhancedResult.believabilityScore,
        {
          emotionalTone: enhancedResult.emotionalTone,
          chunkCount: enhancedResult.chunks.length,
          alternativeCount: enhancedResult.alternativeEndings.length
        },
        enhancedResult.improvementSuggestions
      );
    }

    // Store session if provided
    if (userId && sessionId) {
      try {
        await storage.createChatSession(userId, sessionId, "gimmi-alibi-ara");
        await storage.createMessage({
          sessionId,
          content: enhancedResult.primaryAlibi,
          role: "assistant",
          type: "alibi-response",
          metadata: {
            believabilityScore: enhancedResult.believabilityScore,
            emotionalTone: enhancedResult.emotionalTone,
            alternativeEndings: enhancedResult.alternativeEndings,
            achievements: newAchievements
          }
        });
      } catch (error) {
        console.error('Error storing session:', error);
      }
    }

    res.json({
      ...enhancedResult,
      achievements: newAchievements,
      success: true
    });
  } catch (error) {
    console.error('Error in enhanced alibi generation:', error);
    res.status(500).json({ error: "Failed to generate enhanced alibi" });
  }
});

// Generate Alternative Ending
router.post("/alibi/alternative-ending", async (req, res) => {
  try {
    const { originalAlibi, endingIndex, answers, userContext } = req.body;
    
    if (!originalAlibi || endingIndex === undefined || !answers) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Re-generate with specific ending
    const enhancedResult = await multiModelAI.generateEnhancedAlibi(
      answers,
      'alternative',
      userContext || { personaLevel: 3, armenianMix: 0.3 }
    );

    // Use the selected alternative ending
    const selectedEnding = enhancedResult.alternativeEndings[endingIndex] || enhancedResult.alternativeEndings[0];
    
    // Combine original story with new ending
    const alibiParts = originalAlibi.split(/[.!?]+/);
    const mainStory = alibiParts.slice(0, -2).join('. ') + '.';
    const combinedAlibi = mainStory + ' ' + selectedEnding;

    // Create new chunks for the combined story
    const newChunks = multiModelAI['createProgressiveChunks'](combinedAlibi);

    res.json({
      primaryAlibi: combinedAlibi,
      chunks: newChunks,
      selectedEndingIndex: endingIndex,
      success: true
    });
  } catch (error) {
    console.error('Error generating alternative ending:', error);
    res.status(500).json({ error: "Failed to generate alternative ending" });
  }
});

// Emergency Rapid Mode
router.post("/alibi/emergency", async (req, res) => {
  try {
    const { scenario, urgencyLevel, context } = req.body;
    
    if (!scenario) {
      return res.status(400).json({ error: "Missing scenario parameter" });
    }

    const rapidAlibi = await enhancedTemplates.generateRapidEmergencyAlibi(
      scenario,
      urgencyLevel || 'high'
    );

    res.json({
      alibi: rapidAlibi,
      type: 'emergency',
      generated_at: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error in emergency mode:', error);
    res.status(500).json({ error: "Failed to generate emergency alibi" });
  }
});

// Get Seasonal Templates
router.get("/templates/seasonal", async (req, res) => {
  try {
    const templates = await enhancedTemplates.getSeasonalTemplates();
    
    res.json({
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        promptTemplate: t.promptTemplate,
        isActive: t.isActive
      })),
      success: true
    });
  } catch (error) {
    console.error('Error getting seasonal templates:', error);
    res.status(500).json({ error: "Failed to get seasonal templates" });
  }
});

// Daily Challenge
router.get("/challenge/daily", async (req, res) => {
  try {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // Generate consistent daily challenge based on day of year
    const challenges = [
      {
        title: "The Traffic Jam Escape",
        scenario: "You're 2 hours late to an important meeting",
        constraints: ["Must involve transportation", "Keep it under 100 words", "Include a helpful stranger"],
        difficulty: "Medium",
        reward: "Traffic Master badge"
      },
      {
        title: "The Family Dinner Dodge",
        scenario: "Missing your cousin's engagement party",
        constraints: ["Must be family-friendly", "Include Armenian cultural reference", "Show genuine remorse"],
        difficulty: "Easy",
        reward: "Family Diplomat badge"
      },
      {
        title: "The Work Conference Catastrophe",
        scenario: "Missed the quarterly presentation",
        constraints: ["Professional tone only", "Technology-related excuse", "Include solution for next time"],
        difficulty: "Hard",
        reward: "Corporate Ninja badge"
      },
      {
        title: "The Date Night Disaster",
        scenario: "Completely forgot about anniversary dinner",
        constraints: ["Romantic and apologetic", "Include gesture of making up", "No cliché excuses"],
        difficulty: "Expert",
        reward: "Relationship Saver badge"
      }
    ];

    const dailyChallenge = challenges[dayOfYear % challenges.length];

    res.json({
      challenge: dailyChallenge,
      date: today.toDateString(),
      success: true
    });
  } catch (error) {
    console.error('Error getting daily challenge:', error);
    res.status(500).json({ error: "Failed to get daily challenge" });
  }
});

// Get User Achievements
router.get("/achievements/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const achievements = await achievementSystem.getUserAchievements(userId);
    
    res.json({
      achievements,
      total: achievements.length,
      success: true
    });
  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(500).json({ error: "Failed to get achievements" });
  }
});

// Believability Analysis
router.post("/alibi/analyze", async (req, res) => {
  try {
    const { alibi, answers, context } = req.body;
    
    if (!alibi || !answers) {
      return res.status(400).json({ error: "Missing alibi or answers" });
    }

    // Perform detailed analysis
    const prompt = `Analyze this alibi for believability and provide detailed feedback:

Alibi: "${alibi}"

User answers: ${JSON.stringify(answers)}

Provide analysis in JSON format:
{
  "believabilityScore": 0-10,
  "strengths": ["positive aspects"],
  "weaknesses": ["areas to improve"],
  "suggestions": ["specific improvements"],
  "riskFactors": ["potential issues"],
  "culturalAuthenticity": 0-10
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    try {
      const analysis = JSON.parse(content);
      res.json({ analysis, success: true });
    } catch {
      res.json({
        analysis: {
          believabilityScore: 7,
          strengths: ["Uses specific details"],
          weaknesses: ["Could be more elaborate"],
          suggestions: ["Add more personal touches"],
          riskFactors: ["Generic elements"],
          culturalAuthenticity: 6
        },
        success: true
      });
    }
  } catch (error) {
    console.error('Error analyzing alibi:', error);
    res.status(500).json({ error: "Failed to analyze alibi" });
  }
});

// Voice Personality Selection
router.get("/voice/personalities", async (req, res) => {
  try {
    const personalities = [
      {
        id: "default",
        name: "Armo Hopar Classic",
        description: "The original Armenian-American voice with perfect balance",
        voiceId: "pNInz6obpgDQGcFmaJgB",
        sample: "Listen hopar, I got you covered with the perfect excuse, akhper!",
        characteristics: ["Warm", "Confident", "Cultural"]
      },
      {
        id: "youthful",
        name: "Young Armenian",
        description: "Energetic and modern with slang integration",
        voiceId: "pNInz6obpgDQGcFmaJgB", // Same voice, different prompt
        sample: "Yo, I got the sickest alibi for you, no cap!",
        characteristics: ["Energetic", "Modern", "Casual"]
      },
      {
        id: "wise",
        name: "Armenian Elder",
        description: "Experienced and thoughtful with traditional wisdom",
        voiceId: "pNInz6obpgDQGcFmaJgB", // Same voice, different prompt  
        sample: "My child, let me share with you a story that will serve you well...",
        characteristics: ["Wise", "Traditional", "Caring"]
      },
      {
        id: "professional", 
        name: "Business Armenian",
        description: "Polished and corporate-ready",
        voiceId: "pNInz6obpgDQGcFmaJgB", // Same voice, different prompt
        sample: "I'll provide you with a professional and credible explanation.",
        characteristics: ["Professional", "Articulate", "Credible"]
      }
    ];

    res.json({
      personalities,
      default: "default",
      success: true
    });
  } catch (error) {
    console.error('Error getting voice personalities:', error);
    res.status(500).json({ error: "Failed to get voice personalities" });
  }
});

export default router;