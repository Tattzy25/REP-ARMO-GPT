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
      
      // Create the prompt from questions and answers
      const prompt = `Create an alibi story based on these details:
What you got in trouble for: ${answers[0]}
Who is after you: ${answers[1]}
Your alibi partner: ${answers[2]}
Your excuse: ${answers[3]}
Where you claim you were: ${answers[4]}
Your evidence: ${answers[5]}`;

      const response = await fetch('/api/alibi/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
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
    <div className="min-h-screen" style={{ background: '#bbbbbb' }}>
      {/* Header - Mobile responsive */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 p-4 z-10"
        style={{
          background: '#404040',
          boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
        }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-lg transition-all duration-200"
            style={{
              background: '#404040',
              boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#404040';
            }}
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-white">
              Your Alibi
            </h1>
          </div>
        </div>
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

        {/* Animated Gimmi Alibi Button */}
        <div className="flex justify-center mt-6">
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            onClick={() => generateAlibiStory()}
            className="button"
          >
            <div className="dots_border"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="sparkle"
            >
              <path
                className="path"
                strokeLinejoin="round"
                strokeLinecap="round"
                stroke="black"
                fill="black"
                d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
              />
              <path
                className="path"
                strokeLinejoin="round"
                strokeLinecap="round"
                stroke="black"
                fill="black"
                d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"
              />
              <path
                className="path"
                strokeLinejoin="round"
                strokeLinecap="round"
                stroke="black"
                fill="black"
                d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
              />
            </svg>
            <span className="text_button">Gimmi Alibi</span>
          </motion.button>
        </div>

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