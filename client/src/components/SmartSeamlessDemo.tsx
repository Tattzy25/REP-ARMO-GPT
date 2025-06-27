import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Cache, 
  Clock, 
  Smartphone, 
  Monitor, 
  Save, 
  AlertTriangle, 
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function SmartSeamlessDemo() {
  const [currentUserId] = useState(1); // Mock user ID
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [userInput, setUserInput] = useState('');
  const [answers, setAnswers] = useState<any[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const queryClient = useQueryClient();

  // Smart Caching Demos
  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      const response = await fetch('/api/smart/cache/stats');
      if (!response.ok) throw new Error('Failed to fetch cache stats');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Background Processing Demo
  const startBackgroundProcessMutation = useMutation({
    mutationFn: async (processData: any) => {
      const response = await fetch('/api/smart/background/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processData),
      });
      if (!response.ok) throw new Error('Failed to start background process');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Background Process Started", description: `Process ID: ${data.processId}` });
    },
  });

  // Auto-Complete Demo
  const { data: suggestions, refetch: refetchSuggestions } = useQuery({
    queryKey: ['autocomplete', userInput],
    queryFn: async () => {
      if (userInput.length < 3) return { suggestions: [] };
      
      const response = await fetch('/api/smart/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionPattern: 'work_excuse',
          userInput,
          context: { scenario: 'work', urgency: 'normal' }
        }),
      });
      if (!response.ok) throw new Error('Failed to get suggestions');
      return response.json();
    },
    enabled: userInput.length >= 3,
  });

  // Contradiction Check Demo
  const checkContradictionsMutation = useMutation({
    mutationFn: async (answersToCheck: any[]) => {
      const response = await fetch('/api/smart/contradictions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersToCheck }),
      });
      if (!response.ok) throw new Error('Failed to check contradictions');
      return response.json();
    },
  });

  // Session Handoff Demo
  const createHandoffMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/smart/handoff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          sessionId: 123,
          sourceDevice: deviceType,
          sessionState: { answers, completionPercentage },
          currentStep: 'demo_step',
          progress: { demoProgress: true }
        }),
      });
      if (!response.ok) throw new Error('Failed to create handoff');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Session Handoff Created", 
        description: `Token: ${data.handoffToken.substring(0, 8)}...` 
      });
    },
  });

  // Quick Resume Demo
  const { data: resumeOptions } = useQuery({
    queryKey: ['resume-options', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/smart/resume/options/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch resume options');
      return response.json();
    },
  });

  // Smart Bookmarks Demo
  const { data: bookmarks } = useQuery({
    queryKey: ['bookmarks', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/smart/bookmarks/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      return response.json();
    },
  });

  const createBookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/smart/bookmarks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          sessionId: 123,
          bookmarkType: 'user_manual',
          bookmarkPoint: 'demo_bookmark',
          savedState: { answers, userInput, completionPercentage },
          completionPercentage,
        }),
      });
      if (!response.ok) throw new Error('Failed to create bookmark');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Smart Bookmark Created", description: "Your progress has been saved" });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  // Demo Functions
  const handleStartBackgroundProcess = () => {
    startBackgroundProcessMutation.mutate({
      userId: currentUserId,
      sessionId: 123,
      processType: 'early_generation',
      triggerCondition: '4th_question_answered',
      inputData: { answers, scenario: 'work' },
      priority: 8
    });
  };

  const handleAddAnswer = () => {
    if (userInput.trim()) {
      const newAnswer = {
        question: `Question ${answers.length + 1}`,
        answer: userInput,
        type: 'text',
        timestamp: new Date().toISOString()
      };
      setAnswers([...answers, newAnswer]);
      setCompletionPercentage(Math.min(100, (answers.length + 1) * 20));
      setUserInput('');

      // Check contradictions if we have multiple answers
      if (answers.length >= 1) {
        checkContradictionsMutation.mutate([...answers, newAnswer]);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
  };

  return (
    <div className="min-h-screen bg-[#3a3a3a] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent mb-4">
            Smart Caching & Seamless Experience Demo
          </h1>
          <p className="text-gray-300 text-lg">
            Experience intelligent pre-loading, cross-platform continuity, and contextual assistance.
          </p>
        </div>

        <Tabs defaultValue="caching" className="space-y-6">
          <TabsList className="bg-[#2e2e2e] border-[#272727]">
            <TabsTrigger value="caching">Smart Caching</TabsTrigger>
            <TabsTrigger value="intelligence">Contextual Intelligence</TabsTrigger>
            <TabsTrigger value="continuity">Cross-Platform</TabsTrigger>
            <TabsTrigger value="bookmarks">Smart Bookmarks</TabsTrigger>
          </TabsList>

          {/* Smart Caching Tab */}
          <TabsContent value="caching" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cache Statistics */}
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cache className="h-5 w-5 text-blue-400" />
                    Cache Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cacheStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-green-400">
                            {cacheStats.predictive?.totalEntries || 0}
                          </div>
                          <div className="text-sm text-gray-400">Cached Scenarios</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-400">
                            {cacheStats.predictive?.totalHits || 0}
                          </div>
                          <div className="text-sm text-gray-400">Cache Hits</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">
                          {cacheStats.voice?.totalClips || 0}
                        </div>
                        <div className="text-sm text-gray-400">Voice Clips Cached</div>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-[#3a3a3a] rounded"></div>
                      <div className="h-4 bg-[#3a3a3a] rounded w-2/3"></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Background Processing */}
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-400" />
                    Background Processing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    Start early alibi generation when 4+ questions are answered.
                  </p>
                  <Button 
                    onClick={handleStartBackgroundProcess}
                    disabled={startBackgroundProcessMutation.isPending || answers.length < 4}
                    className="w-full"
                  >
                    {startBackgroundProcessMutation.isPending ? (
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Start Background Process
                  </Button>
                  {answers.length < 4 && (
                    <p className="text-yellow-400 text-xs">
                      Add {4 - answers.length} more answers to enable background processing
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contextual Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Auto-Complete Demo */}
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                    Smart Auto-Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Start typing your excuse... (e.g., 'I was stuck in')"
                      className="bg-[#3a3a3a] border-[#272727] text-white"
                    />
                  </div>
                  
                  {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">Smart suggestions:</p>
                      {suggestions.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full justify-start text-left bg-[#3a3a3a] hover:bg-[#4a4a4a]"
                        >
                          <ArrowRight className="h-3 w-3 mr-2" />
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}

                  <Button 
                    onClick={handleAddAnswer}
                    disabled={!userInput.trim()}
                    className="w-full"
                  >
                    Add Answer
                  </Button>
                </CardContent>
              </Card>

              {/* Contradiction Detection */}
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Contradiction Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400">
                      Current answers: {answers.length}
                    </div>
                    
                    {answers.map((answer, index) => (
                      <div key={index} className="bg-[#3a3a3a] p-3 rounded">
                        <div className="font-medium">{answer.question}</div>
                        <div className="text-gray-300">{answer.answer}</div>
                      </div>
                    ))}

                    {checkContradictionsMutation.data?.contradictions && 
                     checkContradictionsMutation.data.contradictions.length > 0 && (
                      <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                        <div className="font-medium text-red-400 mb-2">
                          ⚠️ Potential Contradictions Detected
                        </div>
                        {checkContradictionsMutation.data.contradictions.map((contradiction: any, index: number) => (
                          <div key={index} className="text-sm text-red-300">
                            {contradiction.warningMessage}
                          </div>
                        ))}
                      </div>
                    )}

                    {checkContradictionsMutation.data?.contradictions && 
                     checkContradictionsMutation.data.contradictions.length === 0 && (
                      <div className="bg-green-900/20 border border-green-500/30 p-3 rounded">
                        <div className="text-green-400 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          No contradictions detected
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cross-Platform Continuity Tab */}
          <TabsContent value="continuity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Handoff */}
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {deviceType === 'mobile' ? 
                        <Smartphone className="h-5 w-5 text-blue-400" /> : 
                        <Monitor className="h-5 w-5 text-blue-400" />
                      }
                      Session Handoff
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={deviceType === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDeviceType('mobile')}
                    >
                      <Smartphone className="h-4 w-4 mr-1" />
                      Mobile
                    </Button>
                    <Button
                      variant={deviceType === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDeviceType('desktop')}
                    >
                      <Monitor className="h-4 w-4 mr-1" />
                      Desktop
                    </Button>
                  </div>

                  <div className="bg-[#3a3a3a] p-3 rounded">
                    <div className="text-sm text-gray-400 mb-2">Current Session:</div>
                    <div>Device: {deviceType}</div>
                    <div>Progress: {completionPercentage}%</div>
                    <div>Answers: {answers.length}</div>
                  </div>

                  <Button 
                    onClick={() => createHandoffMutation.mutate()}
                    disabled={createHandoffMutation.isPending || answers.length === 0}
                    className="w-full"
                  >
                    Create Handoff Token
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Resume */}
              <Card className="bg-[#2e2e2e] border-[#272727]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-400" />
                    Quick Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resumeOptions?.resumeOptions && resumeOptions.resumeOptions.length > 0 ? (
                      <div className="space-y-2">
                        {resumeOptions.resumeOptions.slice(0, 3).map((option: any) => (
                          <div key={option.id} className="bg-[#3a3a3a] p-3 rounded">
                            <div className="font-medium">{option.featureType}</div>
                            <div className="text-sm text-gray-400">{option.resumePoint}</div>
                            <div className="text-xs text-gray-500">
                              Resumed {option.timesResumed} times
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-center py-4">
                        No resume points available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Smart Bookmarks Tab */}
          <TabsContent value="bookmarks" className="space-y-6">
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-purple-400" />
                  Smart Bookmarks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Current Progress</div>
                    <div className="text-sm text-gray-400">
                      {completionPercentage}% complete
                    </div>
                  </div>
                  <Button 
                    onClick={() => createBookmarkMutation.mutate()}
                    disabled={createBookmarkMutation.isPending}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Bookmark
                  </Button>
                </div>

                <Progress value={completionPercentage} className="w-full" />

                {bookmarks?.bookmarks && bookmarks.bookmarks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Saved Bookmarks:</div>
                    {bookmarks.bookmarks.slice(0, 5).map((bookmark: any) => (
                      <div key={bookmark.id} className="bg-[#3a3a3a] p-3 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {bookmark.bookmarkType === 'auto_save' && '🤖 '}
                              {bookmark.bookmarkType === 'user_manual' && '👤 '}
                              {bookmark.bookmarkType === 'optimal_point' && '⭐ '}
                              {bookmark.bookmarkPoint}
                            </div>
                            <div className="text-sm text-gray-400">
                              {(bookmark.completionPercentage * 100).toFixed(1)}% complete
                            </div>
                          </div>
                          <Badge variant="outline">
                            {bookmark.isOptimalPoint && '⭐ Optimal'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default SmartSeamlessDemo;