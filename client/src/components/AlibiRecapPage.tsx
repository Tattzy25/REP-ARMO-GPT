import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw, Download, Volume2, Copy, Pause } from 'lucide-react';

interface AlibiRecapPageProps {
  questions: string[];
  answers: string[];
  onEdit: (questionIndex: number) => void;
  onBack: () => void;
  onNext: () => void;
  username?: string;
}

export function AlibiRecapPage({ questions, answers, onEdit, onBack, onNext, username = "[Your Name]" }: AlibiRecapPageProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempAnswer, setTempAnswer] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
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

  const handleDownload = () => {
    const content = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]}\n`).join('\n');
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'alibi-recap.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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

  const handleReadAloud = () => {
    if (isPlaying) {
      // Stop current playback
      stopPlayback();
    } else {
      // Start new playback
      const content = questions.map((q, i) => `${q} ${answers[i]}`).join('. ');
      playWithElevenLabs(content);
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

  const handleCopy = async () => {
    const content = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(content);
      alert('Recap copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy recap. Please copy manually.');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#2e2e2e' }}>
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Recap Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="py-2 px-6 rounded-3xl text-center max-w-xs mx-auto"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            <h2 className="text-4xl font-bold font-audiowide" style={{ color: '#9333ea' }}>RECAP</h2>
          </motion.div>

          {questions.map((question, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-3xl"
              style={{
                background: '#3a3a3a',
                boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
              }}
            >
              <div className="mb-4">
                <h3 className="font-audiowide mb-2 font-medium text-[#9333ea]" style={{ fontSize: '18px', color: '#9333ea' }}>
                  Question {index + 1}
                </h3>
                <p className="text-white">{question}</p>
              </div>
              
              <div>
                <h4 className="font-audiowide font-medium mb-2" style={{ fontSize: '18px', color: '#9333ea' }}>Your Answer:</h4>
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <textarea
                      value={tempAnswer}
                      onChange={(e) => setTempAnswer(e.target.value)}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-white flex-1">{answers[index]}</p>
                    <button
                      onClick={() => handleEditClick(index)}
                      className="ml-4 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="p-6"
      >
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <button
            onClick={handleDownload}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
            }}
            title="Download Recap"
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
            title={isPlaying ? "Pause" : "Read Aloud"}
          >
            {isPlaying ? <Pause size={24} /> : <Volume2 size={24} />}
          </button>

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
        </div>

        <div className="flex justify-center">
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            onClick={onNext}
            className="animated-button"
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
              ></path>
              <path
                className="path"
                strokeLinejoin="round"
                strokeLinecap="round"
                stroke="black"
                fill="black"
                d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"
              ></path>
              <path
                className="path"
                strokeLinejoin="round"
                strokeLinecap="round"
                stroke="black"
                fill="black"
                d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
              ></path>
            </svg>
            <span className="text_button">Gimmi Alibi</span>
          </motion.button>
        </div>
      </motion.div>
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