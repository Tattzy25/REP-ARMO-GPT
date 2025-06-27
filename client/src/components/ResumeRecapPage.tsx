import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RotateCcw, Download, Volume2, Copy, Pause, Loader2 } from 'lucide-react';

interface ResumeRecapPageProps {
  questions: string[];
  answers: string[];
  onEdit: (questionIndex: number, newAnswer: string) => void;
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
      onEdit(editingIndex, tempAnswer);
      setEditingIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setTempAnswer("");
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

  const handlePlayPause = () => {
    if (isLoadingAudio) {
      return;
    }
    
    if (isPlaying) {
      stopPlayback();
    } else {
      playWithElevenLabs();
    }
  };

  const playWithElevenLabs = async () => {
    try {
      setIsLoadingAudio(true);
      setIsPlaying(false);
      
      const content = questions.map((q, i) => `Question ${i + 1}: ${q}. Answer: ${answers[i]}`).join('\n\n');
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) {
        throw new Error(`TTS service error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new HTMLAudioElement(audioUrl);
      
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

  const handleDownload = () => {
    const content = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}-resume-recap.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                <h3 className="text-xl font-audiowide mb-2 text-[#9333ea] font-medium">
                  Question {index + 1}
                </h3>
                <p className="text-gray-300">{question}</p>
              </div>

              {editingIndex === index ? (
                <div className="space-y-4">
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
                    className="ml-4 px-3 py-1 text-sm text-white rounded-lg hover:bg-blue-600 transition-colors bg-[#9333ea]"
                  >
                    Edit
                  </button>
                </div>
              )}
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
            onClick={handlePlayPause}
            disabled={isLoadingAudio}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200 disabled:opacity-50"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
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

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            onClick={onNext}
            className="flex items-center gap-2 px-8 py-4 rounded-xl text-white hover:scale-105 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
              boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
            }}
          >
            Generate My Resume
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </motion.div>
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