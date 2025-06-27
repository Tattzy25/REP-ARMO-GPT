import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface ResumeRecapPageProps {
  answers: string[];
  questions: string[];
  onBack: () => void;
  onRestart: () => void;
  username?: string;
}

export function ResumeRecapPage({ answers, questions, onBack, onRestart, username = "[Your Name]" }: ResumeRecapPageProps) {
  const [resume, setResume] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmRestart, setShowConfirmRestart] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
    generateResume();
    
    // Cleanup function to stop audio when component unmounts
    return () => {
      stopPlayback();
    };
  }, []);

  const generateResume = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          questions,
          username
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      const data = await response.json();
      setResume(data.resume);
    } catch (error) {
      console.error('Error generating resume:', error);
      setResume("Hopar's resume machine is currently offline. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadAloud = () => {
    if (isPlaying) {
      // Stop current playback
      stopPlayback();
    } else if (resume) {
      // Start new playback
      playWithElevenLabs(resume);
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
        throw new Error('Failed to synthesize speech');
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resume);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRestart = () => {
    setShowConfirmRestart(true);
  };

  const confirmRestart = () => {
    setShowConfirmRestart(false);
    onRestart();
  };

  const cancelRestart = () => {
    setShowConfirmRestart(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#bbbbbb' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-4"
      >
        <div className="flex items-center">
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-400 bg-clip-text text-transparent">
              You Are Hired Ara
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center p-4">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Professional Resume</h2>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleReadAloud}
                  className="p-3 rounded-lg transition-all duration-200 text-white hover:scale-105"
                  style={{
                    background: '#404040',
                    boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#404040';
                  }}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                  onClick={handleCopy}
                  className="p-3 rounded-lg transition-all duration-200 text-white hover:scale-105"
                  style={{
                    background: '#404040',
                    boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#404040';
                  }}
                >
                  <Copy size={20} />
                </button>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-3 rounded-lg transition-all duration-200 text-white hover:scale-105"
                  style={{
                    background: '#404040',
                    boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#404040';
                  }}
                >
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-3 rounded-lg transition-all duration-200 text-white hover:scale-105"
                  style={{
                    background: '#404040',
                    boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#404040';
                  }}
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            {/* Resume Content */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Hopar is crafting your perfect resume...</p>
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
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Restart Confirmation Popup */}
      {showConfirmRestart && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full rounded-2xl p-6 text-center"
            style={{
              background: '#3a3a3a',
              boxShadow: '20px 20px 40px #2a2a2a, -20px -20px 40px #4a4a4a'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Start Over?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to restart? This will clear your current resume and start fresh.
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelRestart}
                className="flex-1 py-3 rounded-lg text-white font-semibold hover:scale-105 transition-transform duration-200"
                style={{
                  background: '#404040',
                  boxShadow: '8px 8px 16px #2a2a2a, -8px -8px 16px #4a4a4a'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRestart}
                className="flex-1 py-3 rounded-lg text-white font-semibold hover:scale-105 transition-transform duration-200"
                style={{
                  background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
                  boxShadow: '8px 8px 16px #2a2a2a, -8px -8px 16px #4a4a4a'
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