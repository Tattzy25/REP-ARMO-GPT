import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw, Download, Volume2, Copy, Pause, Loader2 } from 'lucide-react';

interface ResumeRecapPageProps {
  questions: string[];
  answers: string[];
  onEdit: (questionIndex: number) => void;
  onBack: () => void;
  onNext: () => void;
  username?: string;
}

export function ResumeRecapPage({ questions, answers, onEdit, onBack, onNext, username = "[Your Name]" }: ResumeRecapPageProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempAnswer, setTempAnswer] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Cleanup function to stop audio when component unmounts
    return () => {
      stopPlayback();
    };
  }, []);

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setTempAnswer(answers[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      onEdit(editingIndex);
      setEditingIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setTempAnswer("");
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const stopPlayback = () => {
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

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    const summaryText = questions.map((question, index) => 
      `${question} ${answers[index]}`
    ).join('. ');

    if (!summaryText) {
      showErrorMessage("No content to read aloud");
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
        body: JSON.stringify({ text: summaryText }),
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
    const summaryText = questions.map((question, index) => 
      `${question}\n${answers[index]}\n`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(summaryText);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const summaryText = questions.map((question, index) => 
      `${question}\n${answers[index]}\n`
    ).join('\n');
    
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume_answers.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen mobile-content-padding" style={{ background: "#3a3a3a" }}>
      {/* Fixed Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-40 px-4 py-3"
        style={{
          background: "#3a3a3a",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-gray-300 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex-1 px-4">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "75%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #ff4444 0%, #4444ff 50%, #ff8800 100%)",
                }}
              />
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="flex items-center text-white hover:text-gray-300 transition-colors duration-200"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">Restart</span>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center p-4 pt-20">
        <div className="w-full max-w-4xl">
          {/* Title Card */}
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
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">Review Your Career Info</h2>
            </div>
            
            <p className="text-gray-300">
              Here's a summary of your career information. Make sure everything looks good before generating your resume.
            </p>
          </motion.div>

          {/* Q&A Cards */}
          <div className="space-y-4 mb-8">
            {questions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="rounded-xl p-6"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
                }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Question {index + 1}
                  </h3>
                  <p className="text-gray-300">{question}</p>
                </div>

                {editingIndex === index ? (
                  <div className="space-y-4">
                    <textarea
                      value={tempAnswer}
                      onChange={(e) => setTempAnswer(e.target.value)}
                      className="w-full h-24 p-4 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{
                        background: '#2e2e2e',
                        boxShadow: 'inset 8px 8px 16px #262626, inset -8px -8px 16px #363636'
                      }}
                      placeholder="Type your answer here..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          boxShadow: '4px 4px 8px #323232, -4px -4px 8px #424242'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{
                          background: '#3a3a3a',
                          boxShadow: '4px 4px 8px #323232, -4px -4px 8px #424242'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div 
                        className="p-4 rounded-lg text-gray-200 leading-relaxed"
                        style={{
                          background: '#2e2e2e',
                          boxShadow: 'inset 4px 4px 8px #262626, inset -4px -4px 8px #363636'
                        }}
                      >
                        {answers[index] || "No answer provided"}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditClick(index)}
                      className="px-4 py-2 rounded-lg text-white font-medium hover:scale-105 transition-transform duration-200"
                      style={{
                        background: '#3a3a3a',
                        boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
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
          </motion.div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              onClick={onNext}
              className="flex items-center px-8 py-4 rounded-xl text-white font-semibold text-lg hover:scale-105 transition-transform duration-200"
              style={{
                background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
                boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
              }}
            >
              <span className="mr-3">Generate My Resume</span>
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>

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