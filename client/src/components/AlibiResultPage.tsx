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
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const stopPlayback = () => {
    // Stop ElevenLabs audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    setIsPlaying(false);
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
          questions,
          answers,
          username
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate alibi');
      }

      const data = await response.json();
      setAlibiStory(data.alibi);
    } catch (error) {
      console.error('Error generating alibi:', error);
      setAlibiStory("Sorry, I couldn't generate your alibi. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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
      setIsPlaying(true);
      
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
    <div className="min-h-screen bg-gray-200 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 text-center border-b border-gray-300"
        style={{ 
          background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        <h1 className="text-4xl font-bold mb-2">Your Alibi is Ready!</h1>
        <p className="text-lg text-gray-600">Generated by Armo-GPT</p>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-4xl"
        >
          <div
            className="p-8 rounded-3xl"
            style={{
              background: '#bbbbbb',
              boxShadow: '12px 12px 24px #9f9f9f, -12px -12px 24px #d7d7d7'
            }}
          >
            <div className="text-center">
              {isGenerating ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-16"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-xl text-gray-700">Crafting your perfect alibi...</p>
                  <p className="text-sm text-gray-500 mt-2">Armo Lobby is working its magic</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-left"
                >
                  <div
                    className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap"
                    style={{
                      maxHeight: isExpanded ? 'none' : '400px',
                      overflow: isExpanded ? 'visible' : 'hidden'
                    }}
                  >
                    {alibiStory}
                  </div>
                  
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
              boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
            }}
            title="Restart Process"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
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
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Read Out Loud"
          >
            {isPlaying ? <Pause size={24} /> : <Volume2 size={24} />}
          </button>
          
          <button
            onClick={toggleExpanded}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
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
              boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
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
          <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Restart Confirmation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to restart? This will clear your current alibi and start over.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleRestartCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
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