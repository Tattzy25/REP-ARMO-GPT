import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Download, Share2, Volume2, Maximize2, Copy, Loader2, Pause } from 'lucide-react';

interface AlibiResultPageProps {
  questions: string[];
  answers: string[];
  onBack: () => void;
  onRestart: () => void;
  username?: string;
}

export function AlibiResultPage({ questions, answers, onBack, onRestart, username = "[Your Name]" }: AlibiResultPageProps) {
  const [alibiStory, setAlibiStory] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Interactive Storytelling States
  const [storyChunks, setStoryChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [showingProgressively, setShowingProgressively] = useState(false);
  const [alternativeEndings, setAlternativeEndings] = useState<string[]>([]);
  const [selectedEnding, setSelectedEnding] = useState<number | null>(null);
  const [showBranching, setShowBranching] = useState(false);
  
  // Gamification States
  const [believabilityScore, setBelievabilityScore] = useState<number | null>(null);
  const [scoreAnalysis, setScoreAnalysis] = useState<string>("");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showScoring, setShowScoring] = useState(false);

  const stopPlayback = () => {
    // Stop ElevenLabs audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 4000);
  };

  useEffect(() => {
    generateAlibiStory();
    
    // Cleanup function to stop audio when component unmounts
    return () => {
      stopPlayback();
    };
  }, []);

  const generateAlibiStory = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/alibi/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a detailed, believable alibi story for ${username || "[Your Name]"} based on their specific situation:

The Problem: ${answers[0] || 'unspecified trouble'}
Person After Them: ${answers[1] || 'someone unnamed'}  
Alibi Partner: ${answers[2] || 'no partner specified'}
Their Excuse: ${answers[3] || 'no excuse given'}
Location Claim: ${answers[4] || 'location unspecified'}
Evidence: ${answers[5] || 'no evidence provided'}

Create a cohesive, detailed alibi story that weaves these elements together into a believable narrative. Make it sound legitimate while incorporating the user's specific answers.`,
          questions,
          answers,
          username,
          interactive: true // Request interactive storytelling features
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate alibi');
      }

      const data = await response.json();
      
      // Handle progressive storytelling if available
      if (data.chunks && data.chunks.length > 0) {
        setStoryChunks(data.chunks);
        setShowingProgressively(true);
        startProgressiveReveal(data.chunks);
      } else {
        setAlibiStory(data.alibi);
      }
      
      // Handle gamification features
      if (data.believabilityScore) {
        setBelievabilityScore(data.believabilityScore);
        setScoreAnalysis(data.scoreAnalysis || "");
        setTimeout(() => setShowScoring(true), 2000);
      }
      
      if (data.achievements && data.achievements.length > 0) {
        setAchievements(data.achievements);
      }
      
      // Handle alternative endings
      if (data.alternativeEndings && data.alternativeEndings.length > 0) {
        setAlternativeEndings(data.alternativeEndings);
        setTimeout(() => setShowBranching(true), 5000);
      }
      
    } catch (error) {
      console.error('Error generating alibi:', error);
      setAlibiStory("Sorry, I couldn't generate your alibi. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startProgressiveReveal = (chunks: string[]) => {
    setCurrentChunkIndex(0);
    setAlibiStory(chunks[0]);
    
    // Reveal chunks progressively
    chunks.forEach((_, index) => {
      if (index > 0) {
        setTimeout(() => {
          setCurrentChunkIndex(index);
          setAlibiStory(chunks.slice(0, index + 1).join(' '));
        }, index * 2000); // 2 seconds between chunks
      }
    });
  };

  const selectAlternativeEnding = (endingIndex: number) => {
    setSelectedEnding(endingIndex);
    setAlibiStory(alibiStory + "\n\n" + alternativeEndings[endingIndex]);
    setShowBranching(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([alibiStory], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${username}-alibi.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(alibiStory);
      alert("Alibi copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert("Failed to copy alibi. Please copy manually.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s Alibi`,
          text: alibiStory,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        handleCopy();
      }
    } else {
      // Fallback: copy to clipboard
      handleCopy();
    }
  };

  const handleReadAloud = () => {
    if (isLoadingAudio) {
      // Do nothing if already loading
      return;
    }
    
    if (isPlaying) {
      // Stop current playback
      stopPlayback();
    } else if (alibiStory) {
      // Start new playback
      playWithElevenLabs(alibiStory);
    }
  };

  const playWithElevenLabs = async (text: string) => {
    try {
      setIsLoadingAudio(true);
      setIsPlaying(false);
      
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Voice synthesis failed: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      setIsLoadingAudio(false);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        showErrorMessage('Audio playback failed. Please try again.');
      };
      
      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setCurrentAudio(null);
      showErrorMessage(`Voice synthesis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  const handleRestartClick = () => {
    setShowRestartConfirm(true);
  };

  const handleRestartConfirm = () => {
    setShowRestartConfirm(false);
    onRestart();
  };

  const handleRestartCancel = () => {
    setShowRestartConfirm(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#3a3a3a' }}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-4xl mb-6"
        >
          <div
            className="p-6 rounded-3xl text-center"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #424242'
            }}
          >
            <h1 
              className="text-3xl md:text-4xl text-white"
              style={{ 
                fontFamily: 'Audiowide, cursive',
                background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Hopar Got You<br />Here is Your Alibi
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-4xl"
        >
          <div
            className="p-8 rounded-3xl"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #424242'
            }}
          >
            <div className="text-center">
              {isGenerating ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-16"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
                  <p className="text-xl text-white">Crafting your perfect alibi...</p>
                  <p className="text-sm text-gray-300 mt-2">Armo Lobby is working its magic</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-left"
                >
                  <div
                    className="text-lg text-white leading-relaxed whitespace-pre-wrap"
                    style={{
                      maxHeight: isExpanded ? 'none' : '400px',
                      overflow: isExpanded ? 'visible' : 'hidden'
                    }}
                  >
                    {alibiStory}
                    {showingProgressively && currentChunkIndex < storyChunks.length - 1 && (
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-blue-400 ml-2"
                      >
                        ●●●
                      </motion.span>
                    )}
                  </div>
                  
                  {/* Believability Score */}
                  {showScoring && believabilityScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mt-6 p-4 rounded-xl"
                      style={{
                        background: '#404040',
                        boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">Believability Score</h3>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-green-400 mr-2">{believabilityScore}/10</span>
                          <div className="flex">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full mr-1 ${
                                  i < believabilityScore ? 'bg-green-400' : 'bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {scoreAnalysis && (
                        <p className="text-sm text-gray-300">{scoreAnalysis}</p>
                      )}
                    </motion.div>
                  )}

                  {/* Achievements */}
                  {achievements.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="mt-4 flex flex-wrap gap-2"
                    >
                      {achievements.map((achievement, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="px-3 py-1 rounded-full text-sm text-white"
                          style={{
                            background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
                          }}
                        >
                          🏆 {achievement}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Alternative Endings */}
                  {showBranching && alternativeEndings.length > 0 && selectedEnding === null && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mt-6 p-4 rounded-xl border border-blue-400"
                      style={{
                        background: '#404040',
                        boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
                      }}
                    >
                      <h3 className="text-lg font-semibold text-white mb-3">Choose Your Ending</h3>
                      <div className="space-y-3">
                        {alternativeEndings.map((ending, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            onClick={() => selectAlternativeEnding(index)}
                            className="w-full p-3 text-left rounded-lg text-white hover:bg-blue-600 transition-colors duration-200"
                            style={{
                              background: '#3a3a3a',
                              boxShadow: '4px 4px 8px #323232, -4px -4px 8px #424242'
                            }}
                          >
                            <span className="text-blue-400 font-semibold">Option {index + 1}:</span>
                            <p className="mt-1 text-sm">{ending.substring(0, 100)}...</p>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {alibiStory.length > 500 && (
                    <button
                      onClick={toggleExpanded}
                      className="mt-4 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-4"
        >
          <button
            onClick={handleRestartClick}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Restart"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Download Alibi"
          >
            <Download size={24} />
          </button>
          
          <button
            onClick={handleCopy}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Copy to Clipboard"
          >
            <Copy size={24} />
          </button>
          
          <button
            onClick={handleReadAloud}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title={isLoadingAudio ? "Loading audio..." : "Read Out Loud"}
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? (
              <Loader2 size={24} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Volume2 size={24} />
            )}
          </button>
          
          <button
            onClick={toggleExpanded}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Expand/Collapse"
          >
            <Maximize2 size={24} />
          </button>
          
          <button
            onClick={handleShare}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Share Alibi"
          >
            <Share2 size={24} />
          </button>
        </motion.div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white hover:scale-105 transition-all duration-200 mt-4"
          style={{
            background: '#3a3a3a',
            boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
          }}
        >
          <ArrowLeft size={20} />
          Back to Previous
        </motion.button>
      </div>

      {/* Restart Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="p-6 rounded-xl max-w-md w-full mx-4"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #424242'
            }}
          >
            <h3 className="text-lg font-semibold mb-4 text-white">Restart</h3>
            <p className="text-gray-300 mb-6">
              Do you want to restart?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleRestartCancel}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestartConfirm}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {showError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div
            className="p-4 rounded-xl text-white"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #424242',
              border: '2px solid #ff4444'
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-semibold text-red-400 mb-1">Error</h4>
                <p className="text-sm text-gray-300">{errorMessage}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}