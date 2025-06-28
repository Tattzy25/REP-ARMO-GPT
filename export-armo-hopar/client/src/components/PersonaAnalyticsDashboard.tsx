import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Brain, Users, MessageSquare, TrendingUp, Activity, Eye } from "lucide-react";

interface UserAnalytics {
  userId: number;
  sessionId: number;
  profile: {
    gender?: {
      detectedGender: string;
      confidence: number;
    };
  };
  history: {
    mood: Array<{
      detectedMood: string;
      confidence: number;
      sentimentScore: number;
      createdAt: string;
    }>;
    emotion: Array<{
      primaryEmotion: string;
      emotionIntensity: number;
      confidence: number;
      createdAt: string;
    }>;
    behavior: Array<{
      behaviorStyle: string;
      confidenceScore: number;
      indicators: string[];
      createdAt: string;
    }>;
    engagement: Array<{
      engagementLevel: string;
      messageLength: number;
      enthusiasmScore: number;
      createdAt: string;
    }>;
    intent: Array<{
      intentType: string;
      confidenceScore: number;
      responseApproach: string;
      createdAt: string;
    }>;
  };
}

interface PersonaLevel {
  id: string;
  levelNumber: number;
  name: string;
  description: string;
  allowedLanguage: string[];
}

export function PersonaAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [personas, setPersonas] = useState<PersonaLevel[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number>(1);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonas();
    fetchUserAnalytics();
  }, [selectedUserId, selectedSessionId]);

  const fetchPersonas = async () => {
    try {
      const response = await fetch("/api/personas");
      const data = await response.json();
      if (data.success) {
        setPersonas(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch personas:", error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSessionId) {
        params.append('sessionId', selectedSessionId.toString());
      }
      
      const response = await fetch(`/api/analytics/user/${selectedUserId}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setLoading(false);
    }
  };

  const getMoodDistribution = () => {
    if (!analytics?.history.mood) return [];
    
    const moodCounts = analytics.history.mood.reduce((acc, item) => {
      acc[item.detectedMood] = (acc[item.detectedMood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: (count / analytics.history.mood.length) * 100
    }));
  };

  const getEmotionTrend = () => {
    if (!analytics?.history.emotion) return [];
    
    return analytics.history.emotion.slice(-10).map((item, index) => ({
      time: `T${index + 1}`,
      emotion: item.primaryEmotion,
      intensity: item.emotionIntensity
    }));
  };

  const getBehaviorPatterns = () => {
    if (!analytics?.history.behavior) return [];
    
    const behaviorCounts = analytics.history.behavior.reduce((acc, item) => {
      acc[item.behaviorStyle] = (acc[item.behaviorStyle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(behaviorCounts).map(([behavior, count]) => ({
      behavior,
      count
    }));
  };

  const getEngagementLevel = () => {
    if (!analytics?.history.engagement.length) return 0;
    
    const avgScore = analytics.history.engagement.reduce((sum, item) => 
      sum + item.enthusiasmScore, 0) / analytics.history.engagement.length;
    
    return Math.round(avgScore * 100);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Persona Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor user behavior patterns and persona effectiveness</p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="User ID"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg w-24"
          />
          <input
            type="number"
            placeholder="Session ID"
            value={selectedSessionId || ''}
            onChange={(e) => setSelectedSessionId(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border rounded-lg w-32"
          />
          <Button onClick={fetchUserAnalytics}>Refresh</Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detected Gender</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.profile.gender?.detectedGender || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.profile.gender?.confidence 
                ? `${Math.round(analytics.profile.gender.confidence * 100)}% confidence`
                : 'No data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Mood</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {analytics?.history.mood[0]?.detectedMood || 'Neutral'}
            </div>
            <p className="text-xs text-muted-foreground">
              Score: {analytics?.history.mood[0]?.sentimentScore?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getEngagementLevel()}%</div>
            <Progress value={getEngagementLevel()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.history.mood.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Analyzed messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="mood" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mood">Mood Analysis</TabsTrigger>
          <TabsTrigger value="emotions">Emotions</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="personas">Persona Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="mood" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
              <CardDescription>User's emotional state patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getMoodDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ mood, percentage }) => `${mood} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {getMoodDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Intensity Trend</CardTitle>
              <CardDescription>Recent emotional intensity patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getEmotionTrend()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="intensity" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavior Patterns</CardTitle>
              <CardDescription>Communication style analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBehaviorPatterns()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="behavior" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => (
              <Card key={persona.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {persona.name}
                  </CardTitle>
                  <CardDescription>{persona.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Level:</span>
                      <Badge variant="outline">{persona.levelNumber}</Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Language Rules:</span>
                      <div className="flex flex-wrap gap-1">
                        {persona.allowedLanguage?.slice(0, 3).map((rule, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {rule}
                          </Badge>
                        ))}
                        {persona.allowedLanguage?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{persona.allowedLanguage.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}