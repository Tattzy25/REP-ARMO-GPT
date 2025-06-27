import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Share2, Star, Flame, Trophy, Zap, Eye, Copy, Twitter, Facebook, Instagram } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AnonymizedAlibi {
  id: number;
  anonymizedContent: string;
  category: string;
  believabilityScore: number;
  funnyScore: number;
  reactionCount: number;
  shareCount: number;
  tags: string[];
  createdAt: string;
  reactions: { [emoji: string]: number };
}

interface GalleryStats {
  totalAlibis: number;
  totalReactions: number;
  totalShares: number;
  avgBelievabilityScore: number;
  topCategories: Array<{ category: string; count: number }>;
}

export function AlibiGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'funny' | 'believability' | 'recent' | 'reactions'>('funny');
  const [currentUserId] = useState(1); // Mock user ID
  const queryClient = useQueryClient();

  // Fetch gallery data
  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ['gallery', selectedCategory, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory === 'all' ? '' : selectedCategory,
        sortBy,
        limit: '20',
        excludeUserId: currentUserId.toString()
      });
      
      const response = await fetch(`/api/social/gallery?${params}`);
      if (!response.ok) throw new Error('Failed to fetch gallery');
      const data = await response.json();
      return data.gallery as AnonymizedAlibi[];
    }
  });

  // Fetch gallery stats
  const { data: stats } = useQuery({
    queryKey: ['gallery-stats'],
    queryFn: async () => {
      const response = await fetch('/api/social/gallery/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data.stats as GalleryStats;
    }
  });

  // Reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ galleryId, reactionType }: { galleryId: number; reactionType: string }) => {
      const response = await fetch(`/api/social/gallery/${galleryId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, reactionType })
      });
      if (!response.ok) throw new Error('Failed to add reaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast({ title: "Reaction added!", description: "Your reaction has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add reaction. Please try again.", variant: "destructive" });
    }
  });

  // Share content mutation
  const generateShareMutation = useMutation({
    mutationFn: async ({ alibiId, platform }: { alibiId: number; platform: string }) => {
      const response = await fetch('/api/social/share/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alibiGenerationId: alibiId, platform })
      });
      if (!response.ok) throw new Error('Failed to generate share content');
      return response.json();
    },
    onSuccess: (data) => {
      // Copy to clipboard
      navigator.clipboard.writeText(data.shareContent.templateContent);
      toast({ title: "Share content copied!", description: "The share text has been copied to your clipboard." });
    }
  });

  const categories = ['all', 'Work', 'Family', 'Health', 'Transportation', 'Cultural', 'General'];
  const reactionEmojis = ['😂', '😱', '🤯', '👏', '🔥', '💯'];

  const handleReaction = (galleryId: number, emoji: string) => {
    addReactionMutation.mutate({ galleryId, reactionType: emoji });
  };

  const handleShare = (alibiId: number, platform: string) => {
    generateShareMutation.mutate({ alibiId, platform });
  };

  const formatScore = (score: number) => score.toFixed(1);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="min-h-screen bg-[#3a3a3a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent mb-4">
            Alibi Gallery
          </h1>
          <p className="text-gray-300 text-lg">
            Discover the community's funniest and most creative alibis. All content is anonymized for privacy.
          </p>
        </div>

        {/* Gallery Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalAlibis}</div>
                <div className="text-sm text-gray-400">Total Alibis</div>
              </CardContent>
            </Card>
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.totalReactions}</div>
                <div className="text-sm text-gray-400">Reactions</div>
              </CardContent>
            </Card>
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.totalShares}</div>
                <div className="text-sm text-gray-400">Shares</div>
              </CardContent>
            </Card>
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.avgBelievabilityScore}</div>
                <div className="text-sm text-gray-400">Avg Score</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-[#2e2e2e] border-[#272727]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-[#2e2e2e] border-[#272727]">
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-48 bg-[#2e2e2e] border-[#272727]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#2e2e2e] border-[#272727]">
              <SelectItem value="funny">🔥 Funniest</SelectItem>
              <SelectItem value="believability">⭐ Most Believable</SelectItem>
              <SelectItem value="reactions">❤️ Most Reactions</SelectItem>
              <SelectItem value="recent">🕒 Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gallery Grid */}
        {galleryLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-[#2e2e2e] border-[#272727] animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-[#3a3a3a] rounded mb-4"></div>
                  <div className="h-4 bg-[#3a3a3a] rounded mb-2"></div>
                  <div className="h-4 bg-[#3a3a3a] rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery?.map((alibi) => (
              <Card key={alibi.id} className="bg-[#2e2e2e] border-[#272727] hover:border-[#353535] transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {alibi.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>{formatScore(alibi.believabilityScore)}</span>
                        <Flame className="h-4 w-4 text-orange-400 ml-2" />
                        <span>{formatScore(alibi.funnyScore)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(alibi.createdAt)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-300 mb-4 line-clamp-4">
                    {alibi.anonymizedContent}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {alibi.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Reactions */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1">
                      {reactionEmojis.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto hover:bg-[#3a3a3a]"
                          onClick={() => handleReaction(alibi.id, emoji)}
                        >
                          <span className="text-lg">{emoji}</span>
                          {alibi.reactions[emoji] && (
                            <span className="ml-1 text-xs text-gray-400">
                              {alibi.reactions[emoji]}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400">
                      {alibi.reactionCount} reactions • {alibi.shareCount} shares
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigator.clipboard.writeText(alibi.anonymizedContent)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(alibi.id, 'twitter')}
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(alibi.id, 'facebook')}
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(alibi.id, 'instagram')}
                    >
                      <Instagram className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {gallery && gallery.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold mb-2">No alibis found</h3>
            <p className="text-gray-400">
              {selectedCategory === 'all' 
                ? "Be the first to share an alibi with the community!" 
                : `No alibis found in the ${selectedCategory} category.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlibiGallery;