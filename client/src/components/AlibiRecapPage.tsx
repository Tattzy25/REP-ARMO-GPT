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
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Cleanup function to stop audio when component unmounts
    return () => {
      stopPlayback();
    };
  }, [currentAudio, currentUtterance]);

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
    
    // Stop Web Speech API
    if (currentUtterance) {
      window.speechSynthesis.cancel();
      setCurrentUtterance(null);
    }
    
    setIsPlaying(false);
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
        fallbackToWebSpeech(text);
      };
      
      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      setIsPlaying(false);
      setCurrentAudio(null);
      fallbackToWebSpeech(text);
    }
  };

  const fallbackToWebSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      setCurrentUtterance(utterance);
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentUtterance(null);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentUtterance(null);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = async () => {
    const content = questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 mobile-content-padding" style={{ background: "#3a3a3a" }}>
      <div className="w-full max-w-4xl flex flex-col items-center">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div 
            className="px-8 py-4 rounded-2xl"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            <h1 className="text-3xl font-bold text-white text-center">
              RECAP
            </h1>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-3xl mb-8"
        >
          <div 
            className="rounded-2xl p-8 lg:p-12 relative"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            {/* Navigation Arrows - Desktop */}
            <div className="hidden md:block">
              <button
                onClick={onBack}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full text-white hover:scale-110 transition-all duration-200"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                }}
              >
                <ArrowLeft size={24} />
              </button>
              
              <button
                onClick={onNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full text-white hover:scale-110 transition-all duration-200"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                }}
              >
                <ArrowRight size={24} />
              </button>
            </div>

            {/* Questions and Answers */}
            <div className="space-y-6">
              {questions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="space-y-3"
                >
                  {/* Question */}
                  <div className="text-lg font-medium text-white">
                    <span className="text-blue-400">Q{index + 1}:</span> {question}
                  </div>
                  
                  {/* Answer */}
                  <div className="relative">
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <textarea
                          value={tempAnswer}
                          onChange={(e) => setTempAnswer(e.target.value)}
                          className="w-full h-24 p-4 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            background: '#2a2a2a',
                            boxShadow: 'inset 6px 6px 12px #222222, inset -6px -6px 12px #323232'
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                              boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                              boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div 
                          className="flex-1 p-4 rounded-xl text-gray-300 leading-relaxed"
                          style={{
                            background: '#2a2a2a',
                            boxShadow: 'inset 6px 6px 12px #222222, inset -6px -6px 12px #323232'
                          }}
                        >
                          {/* Add [Your Name] placeholder to specific questions */}
                          {(index === 0 || index === 3) 
                            ? `${answers[index] || "No answer provided"} - [Your Name]` 
                            : (answers[index] || "No answer provided")
                          }
                        </div>
                        <button
                          onClick={() => handleEditClick(index)}
                          className="p-2 rounded-lg text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
                          style={{
                            background: '#3a3a3a',
                            boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
                          }}
                          title="Edit answer"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-6"
        >
          <button
            onClick={handleRestart}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
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
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Download"
          >
            <Download size={24} />
          </button>
          
          <button
            onClick={handleReadAloud}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title={isPlaying ? "Pause" : "Read Aloud"}
          >
            {isPlaying ? <Pause size={24} /> : <Volume2 size={24} />}
          </button>
          
          <button
            onClick={handleCopy}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Copy"
          >
            <Copy size={24} />
          </button>
        </motion.div>

        {/* Generate Button - Below Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mb-6"
        >
          <button
            onClick={onNext}
            className="px-8 py-4 rounded-xl text-white font-bold text-lg hover:scale-105 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            Generate My Alibi →
          </button>
        </motion.div>

        {/* Mobile Navigation Arrows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex md:hidden gap-6"
        >
          <button
            onClick={onBack}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            <ArrowLeft size={24} />
          </button>
          
          <button
            onClick={onNext}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            <ArrowRight size={24} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}