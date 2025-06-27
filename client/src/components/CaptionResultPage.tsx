import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Download, Share2, Volume2, Maximize2, Copy, Loader2, Pause } from 'lucide-react';

interface CaptionResultPageProps {
  questions: string[];
  answers: string[];
  onBack: () => void;
  onRestart: () => void;
  username?: string;
}

export function CaptionResultPage({ questions, answers, onBack, onRestart, username = "[Your Name]" }: CaptionResultPageProps) {
  const [captions, setCaptions] = useState<string>("");
  const [hashtags, setHashtags] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isExpandedCaptions, setIsExpandedCaptions] = useState(false);
  const [isExpandedHashtags, setIsExpandedHashtags] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isPlayingCaptions, setIsPlayingCaptions] = useState(false);
  const [isPlayingHashtags, setIsPlayingHashtags] = useState(false);
  const [currentAudioCaptions, setCurrentAudioCaptions] = useState<HTMLAudioElement | null>(null);
  const [currentAudioHashtags, setCurrentAudioHashtags] = useState<HTMLAudioElement | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const stopPlayback = () => {
    // Stop ElevenLabs audio for captions
    if (currentAudioCaptions) {
      currentAudioCaptions.pause();
      currentAudioCaptions.currentTime = 0;
      setCurrentAudioCaptions(null);
    }
    
    // Stop ElevenLabs audio for hashtags
    if (currentAudioHashtags) {
      currentAudioHashtags.pause();
      currentAudioHashtags.currentTime = 0;
      setCurrentAudioHashtags(null);
    }
    
    setIsPlayingCaptions(false);
    setIsPlayingHashtags(false);
  };

  const showErrorMessage = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 4000);
  };

  useEffect(() => {
    generateContent();
    
    // Cleanup function to stop audio when component unmounts
    return () => {
      stopPlayback();
    };
  }, []);

  const generateContent = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/caption/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions,
          answers,
          username
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCaptions(data.captions || "");
      setHashtags(data.hashtags || "");
    } catch (error) {
      console.error('Error generating content:', error);
      setCaptions("Error generating captions. Please try again.");
      setHashtags("Error generating hashtags. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyContent = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error(`Failed to copy ${type}:`, error);
    }
  };

  const handleShareContent = async (content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Fame Content',
          text: content,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyContent(content, 'content');
    }
  };

  const handleDownloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReadAloud = async (text: string, type: 'captions' | 'hashtags') => {
    const isPlaying = type === 'captions' ? isPlayingCaptions : isPlayingHashtags;
    const currentAudio = type === 'captions' ? currentAudioCaptions : currentAudioHashtags;
    const setIsPlaying = type === 'captions' ? setIsPlayingCaptions : setIsPlayingHashtags;
    const setCurrentAudio = type === 'captions' ? setCurrentAudioCaptions : setCurrentAudioHashtags;

    if (isPlaying && currentAudio) {
      // Stop current playback
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
      return;
    }

    // Stop any other audio
    stopPlayback();

    try {
      setIsPlaying(true);
      
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      
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
      setCurrentAudio(null);
      showErrorMessage(`Voice synthesis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRestartConfirm = () => {
    setShowRestartConfirm(false);
    onRestart();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen flex flex-col pt-20" style={{ backgroundColor: '#bbbbbb' }}>
      {/* Floating Action Buttons */}
      <div className="fixed top-24 left-4 z-40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: '#bbbbbb',
            boxShadow: '6px 6px 12px #9f9f9f, -6px -6px 12px #d7d7d7'
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
      
      <div className="fixed top-24 right-4 z-40">
        <button
          onClick={() => setShowRestartConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: '#bbbbbb',
            boxShadow: '6px 6px 12px #9f9f9f, -6px -6px 12px #d7d7d7'
          }}
        >
          <RotateCcw className="w-5 h-5" />
          <span className="hidden sm:inline">Restart</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pb-20">
        {isGenerating ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-600" />
            <p className="text-lg text-gray-700">Crafting your fame content...</p>
          </motion.div>
        ) : (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Captions Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl"
              style={{
                background: '#3a3a3a',
                boxShadow: '12px 12px 24px #2e2e2e, -12px -12px 24px #464646'
              }}
            >
              <h2 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                Captions
              </h2>
              
              <div className="text-white mb-6 min-h-[200px]">
                <p className="leading-relaxed whitespace-pre-wrap">
                  {isExpandedCaptions ? captions : truncateText(captions, 300)}
                </p>
              </div>

              {/* Action Buttons for Captions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleReadAloud(captions, 'captions')}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  {isPlayingCaptions ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>

                <button
                  onClick={() => handleCopyContent(captions, 'captions')}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={() => handleShareContent(captions)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={() => handleDownloadContent(captions, 'captions.txt')}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  <Download className="w-4 h-4 text-white" />
                </button>

                {captions.length > 300 && (
                  <button
                    onClick={() => setIsExpandedCaptions(!isExpandedCaptions)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: '#3a3a3a',
                      boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3a3a3a';
                    }}
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Hashtags Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl"
              style={{
                background: '#3a3a3a',
                boxShadow: '12px 12px 24px #2e2e2e, -12px -12px 24px #464646'
              }}
            >
              <h2 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                Hashtags
              </h2>
              
              <div className="text-white mb-6 min-h-[200px]">
                <p className="leading-relaxed whitespace-pre-wrap">
                  {isExpandedHashtags ? hashtags : truncateText(hashtags, 300)}
                </p>
              </div>

              {/* Action Buttons for Hashtags */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleReadAloud(hashtags, 'hashtags')}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  {isPlayingHashtags ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>

                <button
                  onClick={() => handleCopyContent(hashtags, 'hashtags')}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={() => handleShareContent(hashtags)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>

                <button
                  onClick={() => handleDownloadContent(hashtags, 'hashtags.txt')}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: '#3a3a3a',
                    boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#3a3a3a';
                  }}
                >
                  <Download className="w-4 h-4 text-white" />
                </button>

                {hashtags.length > 300 && (
                  <button
                    onClick={() => setIsExpandedHashtags(!isExpandedHashtags)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: '#3a3a3a',
                      boxShadow: '6px 6px 12px #2e2e2e, -6px -6px 12px #464646'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3a3a3a';
                    }}
                  >
                    <Maximize2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Restart Confirmation Popup */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-6 rounded-2xl text-center"
            style={{
              background: '#3a3a3a',
              boxShadow: '20px 20px 40px #2e2e2e, -20px -20px 40px #464646'
            }}
          >
            <h3 className="text-lg font-bold mb-4 text-white">Start Over?</h3>
            <p className="text-gray-300 mb-6">This will clear your current fame content and start fresh.</p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleRestartConfirm}
                className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3a3a3a';
                }}
              >
                Restart
              </button>
            </div>
          </motion.div>
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
              boxShadow: '12px 12px 24px #2e2e2e, -12px -12px 24px #464646',
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