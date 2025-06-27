import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Download, Share2, Volume2, Maximize2, Copy, Loader2, Pause } from 'lucide-react';

interface ResumeResultPageProps {
  questions: string[];
  answers: string[];
  onBack: () => void;
  onRestart: () => void;
  username?: string;
}

export function ResumeResultPage({ questions, answers, onBack, onRestart, username = "[Your Name]" }: ResumeResultPageProps) {
  const [resume, setResume] = useState<string>("");
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
  const [professionalismScore, setProfessionalismScore] = useState<number | null>(null);
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
    generateResume();
  }, []);

  const generateResume = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          answers,
          questions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const data = await response.json();
      
      // Handle progressive storytelling if available
      if (data.chunks && data.chunks.length > 0) {
        setStoryChunks(data.chunks);
        setShowingProgressively(true);
        startProgressiveReveal(data.chunks);
      } else {
        setResume(data.resume);
      }
      
      // Handle gamification features
      if (data.professionalismScore) {
        setProfessionalismScore(data.professionalismScore);
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
      console.error('Error generating resume:', error);
      setResume("Sorry, I couldn't generate your resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startProgressiveReveal = (chunks: string[]) => {
    setCurrentChunkIndex(0);
    setResume(chunks[0]);
    
    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index < chunks.length) {
        setCurrentChunkIndex(index);
        setResume(chunks.slice(0, index + 1).join(' '));
      } else {
        setShowingProgressively(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  const selectAlternativeEnding = (endingIndex: number) => {
    setSelectedEnding(endingIndex);
    setResume(prev => prev + "\n\n" + alternativeEndings[endingIndex]);
    setShowBranching(false);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (!resume) {
      showErrorMessage("No resume content to read aloud");
      return;
    }

    setIsLoadingAudio(true);
    setIsPlaying(true);

    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: resume }),
      });

      if (!response.ok) {
        throw new Error('Voice synthesis failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      setIsLoadingAudio(false);

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        showErrorMessage("Audio playback failed");
      };

      await audio.play();
    } catch (error) {
      console.error('Error with audio:', error);
      setIsPlaying(false);
      setIsLoadingAudio(false);
      showErrorMessage("Voice synthesis unavailable");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resume);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([resume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Professional Resume',
          text: resume,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      handleCopy();
    }
  };

  const handleRestart = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    setShowRestartConfirm(false);
    onRestart();
  };

  const cancelRestart = () => {
    setShowRestartConfirm(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#3a3a3a' }}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Resume Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-6 mb-6"
            style={{
              background: '#3a3a3a',
              boxShadow: '16px 16px 32px #323232, -16px -16px 32px #484848'
            }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Your Career Profile</h2>
            </div>

            {/* Resume Content */}
            {isGenerating ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Hopar is crafting your fire resume...</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`text-gray-200 leading-relaxed whitespace-pre-wrap ${
                  isExpanded ? '' : 'max-h-96 overflow-hidden'
                }`}
              >
                {resume}
                {showingProgressively && currentChunkIndex < storyChunks.length - 1 && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-blue-400 ml-2"
                  >
                    ●●●
                  </motion.span>
                )}
              </motion.div>
            )}
            
            {/* Professionalism Score */}
            {!isGenerating && showScoring && professionalismScore !== null && (
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
                  <h3 className="text-lg font-semibold text-white">Professionalism Score</h3>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-green-400 mr-2">{professionalismScore}/10</span>
                    <div className="flex">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-full mr-1 ${
                            i < professionalismScore ? 'bg-green-400' : 'bg-gray-600'
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
            {!isGenerating && achievements.length > 0 && (
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

            {/* Alternative Career Focus */}
            {!isGenerating && showBranching && alternativeEndings.length > 0 && selectedEnding === null && (
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
                <h3 className="text-lg font-semibold text-white mb-3">Choose Your Career Focus</h3>
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
          </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-4"
        >
          <button
            onClick={handleRestart}
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
            onClick={handlePlayPause}
            disabled={isLoadingAudio}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200 disabled:opacity-50"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title={isPlaying ? "Pause" : "Read Aloud"}
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
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title={isExpanded ? "Show Less" : "Expand"}
          >
            <Maximize2 size={24} />
          </button>

          <button
            onClick={handleCopy}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Copy"
          >
            <Copy size={24} />
          </button>

          <button
            onClick={handleDownload}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Download"
          >
            <Download size={24} />
          </button>

          <button
            onClick={handleShare}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Share"
          >
            <Share2 size={24} />
          </button>

          <button
            onClick={onBack}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #424242'
            }}
            title="Back"
          >
            <ArrowLeft size={24} />
          </button>
        </motion.div>
        </div>
      </div>

      {/* Restart Confirmation Popup */}
      {showRestartConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl p-6 max-w-sm w-full"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Start Over?</h3>
            <p className="text-gray-300 mb-6">This will clear your current resume and take you back to the beginning.</p>
            <div className="flex gap-3">
              <button
                onClick={cancelRestart}
                className="flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors duration-200"
                style={{
                  background: '#404040',
                  boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRestart}
                className="flex-1 py-2 px-4 rounded-lg text-white font-medium"
                style={{
                  background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
                }}
              >
                Restart
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Error Popup */}
      {showError && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 p-4 rounded-lg border-2 border-red-500 max-w-sm"
          style={{
            background: '#3a3a3a',
            boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
          }}
        >
          <p className="text-white text-sm">{errorMessage}</p>
        </motion.div>
      )}
    </div>
  );
}