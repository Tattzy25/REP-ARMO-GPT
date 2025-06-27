import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Send, 
  Sparkles, 
  Zap, 
  Clock, 
  Target,
  Trophy,
  ArrowRight,
  Play,
  Volume2,
  RotateCcw,
  Star,
  Brain,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import ProgressiveAlibiReveal from './ProgressiveAlibiReveal';
import AchievementSystem from './AchievementSystem';

interface Question {
  id: string;
  text: string;
  category: string;
  suggestions?: string[];
}

interface Answer {
  questionId: string;
  question: string;
  answer: string;
  timestamp: Date;
}

interface VoicePersonality {
  id: string;
  name: string;
  description: string;
  voiceId: string;
  sample: string;
  characteristics: string[];
}

const DEFAULT_QUESTIONS: Question[] = [
  { id: '1', text: "Where were you supposed to be?", category: "location" },
  { id: '2', text: "What time was the commitment?", category: "time" },
  { id: '3', text: "Who was expecting you?", category: "people" },
  { id: '4', text: "What happened instead?", category: "situation" },
  { id: '5', text: "How urgent is this excuse?", category: "context" },
];

export function EnhancedAlibiPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState('default');
  const [generatedAlibi, setGeneratedAlibi] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [userId] = useState(1); // Mock user ID
  const [sessionId] = useState(Date.now());

  const queryClient = useQueryClient();

  // Fetch voice personalities
  const { data: personalitiesData } = useQuery({
    queryKey: ['voice-personalities'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced/voice/personalities');
      if (!response.ok) throw new Error('Failed to fetch personalities');
      return response.json();
    },
  });

  // Fetch daily challenge
  const { data: dailyChallenge } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: async () => {
      const response = await fetch('/api/enhanced/challenge/daily');
      if (!response.ok) throw new Error('Failed to fetch daily challenge');
      return response.json();
    },
  });

  // Enhanced alibi generation mutation
  const generateAlibiMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/enhanced/alibi/enhanced-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate alibi');
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedAlibi(data);
      setIsGenerating(false);
      
      // Show achievement notifications
      if (data.achievements && data.achievements.length > 0) {
        data.achievements.forEach((achievement: string) => {
          toast({
            title: "🏆 Achievement Unlocked!",
            description: achievement,
            duration: 5000,
          });
        });
      }
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate enhanced alibi. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Alternative ending mutation
  const alternativeEndingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/enhanced/alibi/alternative-ending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate alternative');
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedAlibi(prev => ({ ...prev, ...data }));
    },
  });

  // Emergency mode mutation
  const emergencyMutation = useMutation({
    mutationFn: async (scenario: string) => {
      const response = await fetch('/api/enhanced/alibi/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, urgencyLevel: 'high' }),
      });
      if (!response.ok) throw new Error('Failed to generate emergency alibi');
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedAlibi({
        primaryAlibi: data.alibi,
        chunks: [data.alibi],
        alternativeEndings: [],
        believabilityScore: 7.5,
        improvementSuggestions: ['Emergency mode - consider adding more details later'],
        emotionalTone: 'urgent',
        achievements: []
      });
      toast({
        title: "Emergency Alibi Generated",
        description: "Quick alibi ready for immediate use!",
      });
    },
  });

  const personalities = personalitiesData?.personalities || [];

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) return;

    const newAnswer: Answer = {
      questionId: DEFAULT_QUESTIONS[currentQuestion].id,
      question: DEFAULT_QUESTIONS[currentQuestion].text,
      answer: currentAnswer.trim(),
      timestamp: new Date(),
    };

    setAnswers(prev => [...prev, newAnswer]);
    setCurrentAnswer('');

    if (currentQuestion < DEFAULT_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Start background processing after 4th question
      if (answers.length >= 3) {
        startBackgroundGeneration();
      }
    }
  };

  const startBackgroundGeneration = () => {
    setIsGenerating(true);
    
    // Simulate background processing
    setTimeout(() => {
      generateFullAlibi();
    }, 2000);
  };

  const generateFullAlibi = () => {
    const userContext = {
      personaLevel: 3,
      armenianMix: 0.3,
      preferredTone: selectedPersonality,
    };

    generateAlibiMutation.mutate({
      answers,
      scenario: 'enhanced',
      userId,
      sessionId,
      userContext,
    });
  };

  const handleEmergencyMode = () => {
    const scenario = answers.length > 0 
      ? `${answers[0]?.answer} - ${answers[1]?.answer}` 
      : 'urgent situation';
    
    emergencyMutation.mutate(scenario);
  };

  const handleVoiceInput = async () => {
    // Voice input implementation would go here
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start recording
      toast({
        title: "Voice Recording",
        description: "Speak your answer now...",
      });
    } else {
      // Stop recording and process
      toast({
        title: "Processing Voice",
        description: "Converting speech to text...",
      });
    }
  };

  const handleRegenerateWithEnding = (endingIndex: number) => {
    if (!generatedAlibi) return;

    alternativeEndingMutation.mutate({
      originalAlibi: generatedAlibi.primaryAlibi,
      endingIndex,
      answers,
      userContext: { personaLevel: 3, armenianMix: 0.3 },
    });
  };

  const currentQuestionData = DEFAULT_QUESTIONS[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / DEFAULT_QUESTIONS.length) * 100;
  const isComplete = currentQuestion >= DEFAULT_QUESTIONS.length - 1 && currentAnswer;

  if (generatedAlibi) {
    return (
      <div className="min-h-screen bg-[#3a3a3a] text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Enhanced Alibi Generation
                </h1>
                <p className="text-gray-300 mt-2">Your intelligent alibi with progressive reveal and analytics</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAchievements(!showAchievements)}
                  className="border-[#555] hover:bg-[#4a4a4a]"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Achievements
                </Button>
                <Button
                  onClick={() => {
                    setGeneratedAlibi(null);
                    setAnswers([]);
                    setCurrentQuestion(0);
                    setCurrentAnswer('');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  New Alibi
                </Button>
              </div>
            </div>
          </div>

          {/* Achievement System */}
          <AnimatePresence>
            {showAchievements && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <AchievementSystem userId={userId} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progressive Alibi Reveal */}
          <ProgressiveAlibiReveal
            alibiData={generatedAlibi}
            isGenerating={generateAlibiMutation.isPending || alternativeEndingMutation.isPending}
            onRegenerateWithEnding={handleRegenerateWithEnding}
            onNewAlibi={() => {
              setGeneratedAlibi(null);
              setAnswers([]);
              setCurrentQuestion(0);
              setCurrentAnswer('');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#3a3a3a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent mb-4">
            Enhanced Alibi Generation
          </h1>
          <p className="text-gray-300 text-lg">
            AI-powered alibi creation with progressive reveal, believability scoring, and achievement unlocks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Question Progress</h3>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {currentQuestion + 1}/{DEFAULT_QUESTIONS.length}
                  </Badge>
                </div>
                <Progress value={progressPercentage} className="h-3 mb-4" />
                <div className="text-sm text-gray-400">
                  {Math.round(progressPercentage)}% complete
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            {currentQuestion < DEFAULT_QUESTIONS.length && (
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    {currentQuestionData.text}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="flex-1 bg-[#3a3a3a] border-[#555] text-white resize-none"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAnswerSubmit();
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVoiceInput}
                      className={`border-[#555] hover:bg-[#4a4a4a] ${
                        isRecording ? 'bg-red-900/20 border-red-500/50' : ''
                      }`}
                    >
                      <Mic className={`h-4 w-4 mr-2 ${isRecording ? 'text-red-400' : ''}`} />
                      {isRecording ? 'Recording...' : 'Voice Input'}
                    </Button>
                    
                    <Button
                      onClick={handleAnswerSubmit}
                      disabled={!currentAnswer.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {currentQuestion < DEFAULT_QUESTIONS.length - 1 ? 'Next Question' : 'Generate Alibi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Emergency Mode */}
            <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Emergency Mode</h3>
                    <p className="text-gray-300 text-sm">
                      Need an alibi right now? Get a quick 30-second generation.
                    </p>
                  </div>
                  <Button
                    onClick={handleEmergencyMode}
                    disabled={emergencyMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {emergencyMutation.isPending ? 'Generating...' : 'Emergency'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous Answers */}
            {answers.length > 0 && (
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-400" />
                    Your Answers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {answers.map((answer, index) => (
                    <div key={index} className="bg-[#3a3a3a] p-4 rounded-lg">
                      <div className="font-medium text-white mb-1">{answer.question}</div>
                      <div className="text-gray-300">{answer.answer}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Generate Button */}
            {isComplete && (
              <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Ready to Generate Your Enhanced Alibi
                    </h3>
                    <Button
                      onClick={generateFullAlibi}
                      disabled={isGenerating}
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border border-white border-t-transparent rounded-full"></div>
                          Generating Enhanced Alibi...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate Enhanced Alibi
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voice Personality Selection */}
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-purple-400" />
                  Voice Personality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {personalities.map((personality: VoicePersonality) => (
                  <div
                    key={personality.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedPersonality === personality.id
                        ? 'bg-purple-900/30 border border-purple-500/50'
                        : 'bg-[#3a3a3a] hover:bg-[#4a4a4a]'
                    }`}
                    onClick={() => setSelectedPersonality(personality.id)}
                  >
                    <div className="font-medium text-white">{personality.name}</div>
                    <div className="text-sm text-gray-400 mb-2">{personality.description}</div>
                    <div className="flex flex-wrap gap-1">
                      {personality.characteristics.map((char: string) => (
                        <Badge key={char} variant="outline" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Daily Challenge */}
            {dailyChallenge?.challenge && (
              <Card className="bg-gradient-to-br from-orange-900/20 to-yellow-900/20 border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-400">
                    <Star className="h-5 w-5" />
                    Daily Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">{dailyChallenge.challenge.title}</h4>
                    <p className="text-sm text-gray-300">{dailyChallenge.challenge.scenario}</p>
                    <Badge className="bg-orange-900/20 text-orange-400 border-orange-500/30">
                      {dailyChallenge.challenge.difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Alibis Created</span>
                  <span className="text-white font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avg Believability</span>
                  <span className="text-green-400 font-semibold">8.3/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Achievements</span>
                  <span className="text-yellow-400 font-semibold">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Streak</span>
                  <span className="text-blue-400 font-semibold">3 days</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedAlibiPage;