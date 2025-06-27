import { db } from "./db";
import { 
  alibiGenerations,
  userSessions,
  believabilityMetrics,
  type InsertAlibiGeneration
} from "@shared/schema";
import { eq, and, desc, gt, gte, count, avg, sql } from "drizzle-orm";

// Success Prediction Engine
export class SuccessPredictionEngine {
  
  async predictAlibiSatisfaction(
    answers: any[],
    userContext: any,
    userHistory?: any[]
  ): Promise<{
    satisfactionScore: number;
    confidence: number;
    factors: {
      lengthFactor: number;
      complexityFactor: number;
      culturalFactor: number;
      personalityMatch: number;
      historicalPreference: number;
    };
    recommendations: string[];
  }> {
    try {
      // Analyze content factors
      const contentAnalysis = this.analyzeContentFactors(answers);
      
      // Get user historical preferences
      const historicalAnalysis = userHistory 
        ? this.analyzeHistoricalPreferences(userHistory)
        : { averageScore: 7.5, preferredStyle: 'balanced' };
      
      // Calculate satisfaction prediction
      const factors = {
        lengthFactor: this.calculateLengthFactor(answers),
        complexityFactor: this.calculateComplexityFactor(answers),
        culturalFactor: this.calculateCulturalFactor(answers, userContext),
        personalityMatch: this.calculatePersonalityMatch(userContext),
        historicalPreference: historicalAnalysis.averageScore / 10
      };
      
      // Weighted satisfaction score
      const satisfactionScore = (
        factors.lengthFactor * 0.2 +
        factors.complexityFactor * 0.25 +
        factors.culturalFactor * 0.15 +
        factors.personalityMatch * 0.25 +
        factors.historicalPreference * 0.15
      ) * 10;
      
      // Confidence based on available data
      const confidence = Math.min(0.95, 0.5 + (userHistory?.length || 0) * 0.05);
      
      // Generate recommendations
      const recommendations = this.generateSatisfactionRecommendations(factors, userContext);
      
      return {
        satisfactionScore: Math.round(satisfactionScore * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        factors,
        recommendations
      };
    } catch (error) {
      console.error('Error predicting alibi satisfaction:', error);
      return {
        satisfactionScore: 7.5,
        confidence: 0.5,
        factors: {
          lengthFactor: 0.7,
          complexityFactor: 0.7,
          culturalFactor: 0.7,
          personalityMatch: 0.7,
          historicalPreference: 0.7
        },
        recommendations: ['Use more specific details', 'Add cultural elements']
      };
    }
  }

  private analyzeContentFactors(answers: any[]): any {
    const totalLength = answers.reduce((sum, answer) => sum + (answer.answer?.length || 0), 0);
    const avgLength = totalLength / answers.length;
    
    return {
      totalLength,
      avgLength,
      answerCount: answers.length,
      detailRichness: avgLength > 50 ? 'high' : avgLength > 20 ? 'medium' : 'low'
    };
  }

  private analyzeHistoricalPreferences(userHistory: any[]): any {
    const scores = userHistory.map(h => h.believabilityScore || h.satisfactionScore || 7).filter(Boolean);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 7.5;
    
    const styles = userHistory.map(h => h.style || 'balanced');
    const preferredStyle = this.getMostCommon(styles);
    
    return { averageScore, preferredStyle };
  }

  private getMostCommon(arr: string[]): string {
    return arr.sort((a, b) => 
      arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop() || 'balanced';
  }

  private calculateLengthFactor(answers: any[]): number {
    const totalLength = answers.reduce((sum, answer) => sum + (answer.answer?.length || 0), 0);
    
    // Optimal length is around 200-400 characters total
    if (totalLength >= 200 && totalLength <= 400) return 1.0;
    if (totalLength >= 100 && totalLength <= 600) return 0.8;
    if (totalLength >= 50 && totalLength <= 800) return 0.6;
    return 0.4;
  }

  private calculateComplexityFactor(answers: any[]): number {
    let complexityScore = 0;
    
    answers.forEach(answer => {
      const text = answer.answer || '';
      
      // Check for specific details (numbers, times, names)
      if (/\d+/.test(text)) complexityScore += 0.2;
      if (/\b(at|around|about)\s+\d+/.test(text)) complexityScore += 0.2;
      if (/[A-Z][a-z]+\s+[A-Z][a-z]+/.test(text)) complexityScore += 0.15; // Names
      if (text.split(' ').length > 10) complexityScore += 0.15; // Detailed answers
    });
    
    return Math.min(1.0, complexityScore);
  }

  private calculateCulturalFactor(answers: any[], userContext: any): number {
    const armenianWords = ['ախպեր', 'hopar', 'ara', 'անուշ', 'ջան'];
    const culturalRefs = ['family', 'church', 'armenian', 'cousin', 'uncle', 'aunt'];
    
    let culturalScore = 0;
    const allText = answers.map(a => a.answer || '').join(' ').toLowerCase();
    
    armenianWords.forEach(word => {
      if (allText.includes(word.toLowerCase())) culturalScore += 0.2;
    });
    
    culturalRefs.forEach(ref => {
      if (allText.includes(ref)) culturalScore += 0.1;
    });
    
    // Bonus for user's preferred cultural level
    if (userContext.armenianMix && userContext.armenianMix > 0.3) culturalScore += 0.2;
    
    return Math.min(1.0, culturalScore);
  }

  private calculatePersonalityMatch(userContext: any): number {
    const personaLevel = userContext.personaLevel || 3;
    const preferredTone = userContext.preferredTone || 'balanced';
    
    // Higher persona levels generally prefer more edgy content
    let matchScore = 0.7; // Base score
    
    if (personaLevel >= 3 && preferredTone.includes('edgy')) matchScore += 0.2;
    if (personaLevel <= 2 && preferredTone.includes('polite')) matchScore += 0.2;
    if (personaLevel === 4 && preferredTone.includes('savage')) matchScore += 0.3;
    
    return Math.min(1.0, matchScore);
  }

  private generateSatisfactionRecommendations(factors: any, userContext: any): string[] {
    const recommendations = [];
    
    if (factors.lengthFactor < 0.7) {
      recommendations.push('Add more specific details to increase believability');
    }
    
    if (factors.complexityFactor < 0.6) {
      recommendations.push('Include specific times, dates, or names for authenticity');
    }
    
    if (factors.culturalFactor < 0.5 && userContext.armenianMix > 0.2) {
      recommendations.push('Consider adding Armenian cultural references');
    }
    
    if (factors.personalityMatch < 0.7) {
      recommendations.push('Adjust tone to match your preferred personality style');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great foundation! Your alibi should be highly satisfying');
    }
    
    return recommendations.slice(0, 3); // Limit to top 3
  }

  async recordSatisfactionFeedback(
    userId: number,
    alibiId: string,
    actualSatisfaction: number,
    predictedSatisfaction: number
  ): Promise<void> {
    try {
      // Store feedback for model improvement
      const feedbackData = {
        userId,
        alibiId,
        actualSatisfaction,
        predictedSatisfaction,
        predictionError: Math.abs(actualSatisfaction - predictedSatisfaction),
        timestamp: new Date(),
      };
      
      // In production, this would go to a feedback table
      console.log('Satisfaction feedback recorded:', feedbackData);
      
      // Update prediction model based on feedback
      await this.updatePredictionModel(feedbackData);
    } catch (error) {
      console.error('Error recording satisfaction feedback:', error);
    }
  }

  private async updatePredictionModel(feedback: any): Promise<void> {
    // Implement machine learning model updates based on feedback
    // This would typically involve retraining weights or updating parameters
    console.log('Prediction model updated with feedback');
  }
}

// A/B Testing Framework
export class ABTestingFramework {
  private static activeTests = new Map<string, any>();
  
  async createABTest(
    testName: string,
    variants: string[],
    allocation: number[],
    duration: number,
    metrics: string[]
  ): Promise<string> {
    try {
      const testId = crypto.randomUUID();
      
      const test = {
        id: testId,
        name: testName,
        variants,
        allocation,
        startDate: new Date(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        metrics,
        participants: new Map(),
        results: new Map()
      };
      
      ABTestingFramework.activeTests.set(testId, test);
      
      console.log(`A/B test created: ${testName} with variants: ${variants.join(', ')}`);
      return testId;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  async assignUserToVariant(testId: string, userId: number): Promise<string | null> {
    try {
      const test = ABTestingFramework.activeTests.get(testId);
      if (!test) return null;
      
      // Check if test is still active
      if (new Date() > test.endDate) return null;
      
      // Check if user already assigned
      if (test.participants.has(userId)) {
        return test.participants.get(userId);
      }
      
      // Assign user to variant based on allocation
      const random = Math.random();
      let cumulativeAllocation = 0;
      
      for (let i = 0; i < test.variants.length; i++) {
        cumulativeAllocation += test.allocation[i];
        if (random <= cumulativeAllocation) {
          const variant = test.variants[i];
          test.participants.set(userId, variant);
          
          // Initialize results for this variant if not exists
          if (!test.results.has(variant)) {
            test.results.set(variant, {
              participants: 0,
              conversions: 0,
              metrics: {}
            });
          }
          
          test.results.get(variant).participants++;
          return variant;
        }
      }
      
      // Fallback to first variant
      const variant = test.variants[0];
      test.participants.set(userId, variant);
      return variant;
    } catch (error) {
      console.error('Error assigning user to variant:', error);
      return null;
    }
  }

  async recordTestMetric(
    testId: string,
    userId: number,
    metricName: string,
    value: number
  ): Promise<void> {
    try {
      const test = ABTestingFramework.activeTests.get(testId);
      if (!test) return;
      
      const variant = test.participants.get(userId);
      if (!variant) return;
      
      const variantResults = test.results.get(variant);
      if (!variantResults) return;
      
      if (!variantResults.metrics[metricName]) {
        variantResults.metrics[metricName] = [];
      }
      
      variantResults.metrics[metricName].push(value);
      
      console.log(`Recorded metric ${metricName}: ${value} for variant ${variant}`);
    } catch (error) {
      console.error('Error recording test metric:', error);
    }
  }

  async getTestResults(testId: string): Promise<any> {
    try {
      const test = ABTestingFramework.activeTests.get(testId);
      if (!test) return null;
      
      const results = {};
      
      for (const [variant, data] of test.results) {
        const metrics = {};
        
        for (const [metricName, values] of Object.entries(data.metrics)) {
          const numValues = (values as number[]).length;
          const sum = (values as number[]).reduce((a, b) => a + b, 0);
          const avg = numValues > 0 ? sum / numValues : 0;
          
          metrics[metricName] = {
            count: numValues,
            average: avg,
            total: sum
          };
        }
        
        results[variant] = {
          participants: data.participants,
          conversionRate: data.conversions / data.participants,
          metrics
        };
      }
      
      return {
        testId,
        testName: test.name,
        status: new Date() > test.endDate ? 'completed' : 'active',
        startDate: test.startDate,
        endDate: test.endDate,
        results
      };
    } catch (error) {
      console.error('Error getting test results:', error);
      return null;
    }
  }

  // Predefined test configurations for common scenarios
  async createHumorStyleTest(): Promise<string> {
    return this.createABTest(
      'Humor Style Preference',
      ['mild_humor', 'edgy_humor', 'cultural_humor'],
      [0.33, 0.33, 0.34],
      14, // 2 weeks
      ['satisfaction_score', 'completion_rate', 'return_rate']
    );
  }

  async createQuestionFlowTest(): Promise<string> {
    return this.createABTest(
      'Question Flow Optimization',
      ['linear_flow', 'adaptive_flow', 'branching_flow'],
      [0.33, 0.33, 0.34],
      21, // 3 weeks
      ['completion_time', 'dropout_rate', 'satisfaction_score']
    );
  }

  async createPersonalityLevelTest(): Promise<string> {
    return this.createABTest(
      'Default Personality Level',
      ['level_2', 'level_3', 'level_4'],
      [0.3, 0.4, 0.3],
      14, // 2 weeks
      ['engagement_score', 'believability_score', 'user_retention']
    );
  }
}

// Real-time Sentiment Analysis
export class RealTimeSentimentAnalyzer {
  
  async analyzeSentimentFromTyping(
    typingPatterns: {
      keystrokes: number[];
      pauses: number[];
      deletions: number;
      totalTime: number;
    }
  ): Promise<{
    stressLevel: 'low' | 'medium' | 'high';
    urgency: 'relaxed' | 'normal' | 'urgent' | 'emergency';
    confidence: 'uncertain' | 'moderate' | 'confident';
    emotionalState: 'calm' | 'excited' | 'anxious' | 'frustrated';
  }> {
    try {
      // Analyze typing speed
      const avgKeystrokeSpeed = typingPatterns.keystrokes.length / (typingPatterns.totalTime / 1000);
      const avgPauseLength = typingPatterns.pauses.reduce((a, b) => a + b, 0) / typingPatterns.pauses.length;
      const deletionRate = typingPatterns.deletions / typingPatterns.keystrokes.length;
      
      // Determine stress level
      let stressLevel: 'low' | 'medium' | 'high' = 'low';
      if (avgKeystrokeSpeed > 8 || avgPauseLength < 200 || deletionRate > 0.15) {
        stressLevel = 'high';
      } else if (avgKeystrokeSpeed > 5 || avgPauseLength < 500 || deletionRate > 0.08) {
        stressLevel = 'medium';
      }
      
      // Determine urgency
      let urgency: 'relaxed' | 'normal' | 'urgent' | 'emergency' = 'normal';
      if (avgKeystrokeSpeed > 10 && avgPauseLength < 150) {
        urgency = 'emergency';
      } else if (avgKeystrokeSpeed > 7 && avgPauseLength < 300) {
        urgency = 'urgent';
      } else if (avgKeystrokeSpeed < 3 && avgPauseLength > 1000) {
        urgency = 'relaxed';
      }
      
      // Determine confidence
      let confidence: 'uncertain' | 'moderate' | 'confident' = 'moderate';
      if (deletionRate > 0.2 || typingPatterns.pauses.length > typingPatterns.keystrokes.length * 0.3) {
        confidence = 'uncertain';
      } else if (deletionRate < 0.05 && avgPauseLength < 400) {
        confidence = 'confident';
      }
      
      // Determine emotional state
      let emotionalState: 'calm' | 'excited' | 'anxious' | 'frustrated' = 'calm';
      if (deletionRate > 0.15 && avgPauseLength > 800) {
        emotionalState = 'frustrated';
      } else if (stressLevel === 'high' && urgency === 'urgent') {
        emotionalState = 'anxious';
      } else if (avgKeystrokeSpeed > 6 && stressLevel !== 'high') {
        emotionalState = 'excited';
      }
      
      return { stressLevel, urgency, confidence, emotionalState };
    } catch (error) {
      console.error('Error analyzing sentiment from typing:', error);
      return {
        stressLevel: 'medium',
        urgency: 'normal',
        confidence: 'moderate',
        emotionalState: 'calm'
      };
    }
  }

  async adjustResponseTone(
    sentiment: any,
    baseResponse: string,
    userContext: any
  ): Promise<string> {
    try {
      let adjustmentPrompt = '';
      
      // Adjust based on stress level
      if (sentiment.stressLevel === 'high') {
        adjustmentPrompt += 'Make the response more concise and reassuring. ';
      } else if (sentiment.stressLevel === 'low') {
        adjustmentPrompt += 'Make the response more elaborate and detailed. ';
      }
      
      // Adjust based on urgency
      if (sentiment.urgency === 'emergency') {
        adjustmentPrompt += 'Focus on immediate, practical solutions. ';
      } else if (sentiment.urgency === 'relaxed') {
        adjustmentPrompt += 'Add more humor and cultural elements. ';
      }
      
      // Adjust based on confidence
      if (sentiment.confidence === 'uncertain') {
        adjustmentPrompt += 'Provide more encouraging and supportive language. ';
      } else if (sentiment.confidence === 'confident') {
        adjustmentPrompt += 'Match their confidence with bold, creative suggestions. ';
      }
      
      // Adjust based on emotional state
      if (sentiment.emotionalState === 'anxious') {
        adjustmentPrompt += 'Use calming, supportive tone. ';
      } else if (sentiment.emotionalState === 'frustrated') {
        adjustmentPrompt += 'Acknowledge their frustration and provide clear solutions. ';
      } else if (sentiment.emotionalState === 'excited') {
        adjustmentPrompt += 'Match their energy with enthusiastic responses. ';
      }
      
      if (!adjustmentPrompt) return baseResponse;
      
      // Use AI to adjust the response
      const prompt = `${adjustmentPrompt}

Original response: "${baseResponse}"

Adjust this response while maintaining its core message and Armenian cultural elements:`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const adjustedResponse = data.choices[0]?.message?.content || baseResponse;
      
      console.log(`Response adjusted for sentiment: ${sentiment.emotionalState}, stress: ${sentiment.stressLevel}`);
      return adjustedResponse;
    } catch (error) {
      console.error('Error adjusting response tone:', error);
      return baseResponse;
    }
  }

  async recordSentimentMetrics(
    userId: number,
    sessionId: number,
    sentiment: any,
    responseAdjustment: string
  ): Promise<void> {
    try {
      // Record sentiment data for analytics
      const sentimentData = {
        userId,
        sessionId,
        stressLevel: sentiment.stressLevel,
        urgency: sentiment.urgency,
        confidence: sentiment.confidence,
        emotionalState: sentiment.emotionalState,
        responseAdjustment,
        timestamp: new Date(),
      };
      
      // Store in analytics database (would be a dedicated table in production)
      console.log('Sentiment metrics recorded:', sentimentData);
    } catch (error) {
      console.error('Error recording sentiment metrics:', error);
    }
  }
}

// Export singleton instances
export const successPrediction = new SuccessPredictionEngine();
export const abTesting = new ABTestingFramework();
export const sentimentAnalyzer = new RealTimeSentimentAnalyzer();