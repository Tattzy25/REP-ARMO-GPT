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
  const [resumeContent, setResumeContent] = useState<string>("");
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
    generateResumeContent();
    
    // Cleanup function to stop audio when component unmounts
    return () => {
      stopPlayback();
    };
  }, []);

  const generateResumeContent = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions,
          answers,
          username,
          interactive: true
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
        setResumeContent(data.resume);
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
      setResumeContent("Sorry, I couldn't generate your resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startProgressiveReveal = (chunks: string[]) => {
    setCurrentChunkIndex(0);
    setResumeContent(chunks[0]);
    
    // Reveal chunks progressively
    chunks.forEach((_, index) => {
      if (index > 0) {
        setTimeout(() => {
          setCurrentChunkIndex(index);
          setResumeContent(chunks.slice(0, index + 1).join(' '));
        }, index * 2000); // 2 seconds between chunks
      }
    });
  };

  const selectAlternativeEnding = (endingIndex: number) => {
    setSelectedEnding(endingIndex);
    setResumeContent(resumeContent + "\n\n" + alternativeEndings[endingIndex]);
    setShowBranching(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([resumeContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${username}-resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resumeContent);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s Resume`,
          text: resumeContent,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to copy
        handleCopy();
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const playWithElevenLabs = async (text: string) => {
    try {
      setIsLoadingAudio(true);
      
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`Voice synthesis failed: ${response.status}`);
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
        setIsLoadingAudio(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        showErrorMessage('Audio playback failed');
      };

      await audio.play();
    } catch (error) {
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setCurrentAudio(null);
      showErrorMessage(`Voice synthesis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReadAloud = () => {
    if (isLoadingAudio) return; // Prevent multiple simultaneous requests
    
    if (isPlaying) {
      stopPlayback();
    } else {
      playWithElevenLabs(resumeContent);
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
      {/* Error Popup */}
      {showError && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg border-2 border-red-500"
          style={{
            background: '#3a3a3a',
            boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
          }}
        >
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </motion.div>
      )}

      {/* Restart Confirmation Popup */}
      {showRestartConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="p-6 rounded-xl text-center"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #424242'
            }}
          >
            <h3 className="text-xl text-white mb-4">Do you want to restart?</h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestartConfirm}
                className="px-6 py-2 rounded-lg text-white hover:scale-105 transition-all duration-200"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
                }}
              >
                Yes
              </button>
              <button
                onClick={handleRestartCancel}
                className="px-6 py-2 rounded-lg text-white hover:scale-105 transition-all duration-200"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
              Your Hired Ara<br />Professional Resume
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
                  <p className="text-xl text-white">Crafting your professional resume...</p>
                  <p className="text-sm text-gray-300 mt-2">Armo Hopar is building your career story</p>
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
                    {resumeContent}
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
                  
                  {/* Professionalism Score */}
                  {showScoring && professionalismScore !== null && (
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
                  
                  {resumeContent.length > 500 && (
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
        {!isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white hover:scale-105 transition-all duration-200"
              style={{
                background: '#3a3a3a',
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
              }}
            >
              <ArrowLeft size={20} />
              Back
            </motion.button>

            <button
              onClick={handleRestartClick}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white hover:scale-105 transition-all duration-200"
              style={{
                background: '#3a3a3a',
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
              }}
            >
              <RotateCcw size={20} />
              Restart
            </button>

            <button
              onClick={handleDownload}
              className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
              style={{
                background: '#3a3a3a',
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
              }}
              title="Download Resume"
            >
              <Download size={24} />
            </button>

            <button
              onClick={handleCopy}
              className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
              style={{
                background: '#3a3a3a',
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
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
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
              }}
              title={isLoadingAudio ? "Loading audio..." : isPlaying ? "Pause" : "Read Aloud"}
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
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
              }}
              title="Expand"
            >
              <Maximize2 size={24} />
            </button>

            <button
              onClick={handleShare}
              className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
              style={{
                background: '#3a3a3a',
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
              }}
              title="Share"
            >
              <Share2 size={24} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}