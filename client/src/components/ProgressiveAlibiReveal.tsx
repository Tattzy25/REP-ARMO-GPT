import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  Trophy,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlibiData {
  primaryAlibi: string;
  alternativeEndings: string[];
  believabilityScore: number;
  improvementSuggestions: string[];
  emotionalTone: string;
  chunks: string[];
  achievements?: string[];
}

interface ProgressiveAlibiRevealProps {
  alibiData: AlibiData;
  isGenerating: boolean;
  onRegenerateWithEnding: (endingIndex: number) => void;
  onNewAlibi: () => void;
}

export function ProgressiveAlibiReveal({ 
  alibiData, 
  isGenerating, 
  onRegenerateWithEnding,
  onNewAlibi 
}: ProgressiveAlibiRevealProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedEnding, setSelectedEnding] = useState<number | null>(null);
  const [showBelievabilityDetails, setShowBelievabilityDetails] = useState(false);

  // Auto-play chunks
  useEffect(() => {
    if (isPlaying && currentChunk < alibiData.chunks.length - 1) {
      const timer = setTimeout(() => {
        setCurrentChunk(prev => prev + 1);
      }, 2500); // 2.5 seconds per chunk

      return () => clearTimeout(timer);
    } else if (currentChunk >= alibiData.chunks.length - 1) {
      setIsPlaying(false);
      setShowAlternatives(true);
    }
  }, [isPlaying, currentChunk, alibiData.chunks.length]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentChunk(0);
    setIsPlaying(false);
    setShowAlternatives(false);
    setSelectedEnding(null);
  };

  const handleSkipToEnd = () => {
    setCurrentChunk(alibiData.chunks.length - 1);
    setIsPlaying(false);
    setShowAlternatives(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-400';
    if (score >= 7) return 'text-yellow-400';
    if (score >= 5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8.5) return <Trophy className="h-5 w-5 text-green-400" />;
    if (score >= 7) return <Star className="h-5 w-5 text-yellow-400" />;
    return <TrendingUp className="h-5 w-5 text-orange-400" />;
  };

  const progressPercentage = ((currentChunk + 1) / alibiData.chunks.length) * 100;

  return (
    <div className="space-y-6">
      {/* Believability Score Card */}
      <Card className="bg-[#2e2e2e] border-[#272727]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getScoreIcon(alibiData.believabilityScore)}
              <div>
                <h3 className="text-lg font-semibold text-white">Believability Score</h3>
                <p className="text-gray-400 text-sm">AI-powered credibility analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(alibiData.believabilityScore)}`}>
                {alibiData.believabilityScore.toFixed(1)}
              </div>
              <div className="text-gray-400 text-sm">/10</div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Plausibility</span>
              <span className="text-white">{Math.round(alibiData.believabilityScore * 10)}%</span>
            </div>
            <Progress 
              value={alibiData.believabilityScore * 10} 
              className="h-2"
            />
          </div>

          {/* Emotional Tone Badge */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="capitalize">
              {alibiData.emotionalTone === 'stressed' && <AlertCircle className="h-3 w-3 mr-1" />}
              {alibiData.emotionalTone === 'humorous' && <Sparkles className="h-3 w-3 mr-1" />}
              {alibiData.emotionalTone === 'neutral' && <CheckCircle className="h-3 w-3 mr-1" />}
              {alibiData.emotionalTone} tone
            </Badge>
          </div>

          {/* Improvement Suggestions */}
          {alibiData.improvementSuggestions.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBelievabilityDetails(!showBelievabilityDetails)}
                className="text-blue-400 hover:text-blue-300 p-0 h-auto"
              >
                {showBelievabilityDetails ? 'Hide' : 'Show'} Improvement Tips
              </Button>
              
              <AnimatePresence>
                {showBelievabilityDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    {alibiData.improvementSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{suggestion}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Notifications */}
      {alibiData.achievements && alibiData.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-2"
        >
          {alibiData.achievements.map((achievement, index) => (
            <Card key={index} className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  <div>
                    <div className="font-semibold text-yellow-400">Achievement Unlocked!</div>
                    <div className="text-yellow-300 text-sm">{achievement}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Progressive Story Reveal */}
      <Card className="bg-[#2e2e2e] border-[#272727]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Your Alibi Story</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                disabled={currentChunk >= alibiData.chunks.length - 1}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestart}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {currentChunk < alibiData.chunks.length - 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipToEnd}
                >
                  <Zap className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Story Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Story Chunks */}
          <div className="space-y-4 min-h-[200px]">
            <AnimatePresence mode="wait">
              {alibiData.chunks.slice(0, currentChunk + 1).map((chunk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index === currentChunk ? 0.5 : 0 }}
                  className={`p-4 rounded-lg ${
                    index === currentChunk 
                      ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30' 
                      : 'bg-[#3a3a3a]'
                  }`}
                >
                  <div className="text-gray-200 leading-relaxed">
                    {chunk}
                  </div>
                  {index === currentChunk && isPlaying && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.5, ease: 'linear' }}
                      className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mt-3 rounded"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Endings */}
      <AnimatePresence>
        {showAlternatives && alibiData.alternativeEndings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-[#2e2e2e] border-[#272727]">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Alternative Endings</h3>
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    Choose Your Adventure
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {alibiData.alternativeEndings.map((ending, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedEnding === index
                            ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/50'
                            : 'bg-[#3a3a3a] hover:bg-[#4a4a4a] border-[#555]'
                        }`}
                        onClick={() => setSelectedEnding(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                              Ending {index + 1}
                            </Badge>
                            <div className="flex-1">
                              <p className="text-gray-200 leading-relaxed">
                                {ending}
                              </p>
                              {selectedEnding === index && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-3"
                                >
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRegenerateWithEnding(index);
                                    }}
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                  >
                                    Use This Ending
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onNewAlibi}
          variant="outline"
          className="border-[#555] hover:bg-[#4a4a4a]"
        >
          Generate New Alibi
        </Button>
        <Button
          onClick={handleRestart}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Replay Story
        </Button>
      </div>
    </div>
  );
}

export default ProgressiveAlibiReveal;