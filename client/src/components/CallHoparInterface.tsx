import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import phoneRingAudio from '@assets/11L-PHONE_RINGING_CALLIN-1751063550449_1751063667978.mp3';

interface CallHoparInterfaceProps {
  onBack: () => void;
  username?: string;
}

export function CallHoparInterface({ onBack, username = "User" }: CallHoparInterfaceProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnSpeaker, setIsOnSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showCooldown, setShowCooldown] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check for cooldown on component mount
  useEffect(() => {
    checkCooldownStatus();
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const checkCooldownStatus = () => {
    // Temporarily disabled for testing - remove this comment to re-enable cooldown
    return false;
    
    const lastCallTime = localStorage.getItem('lastCallHoparTime');
    if (lastCallTime) {
      const timeDiff = Date.now() - parseInt(lastCallTime);
      const hourInMs = 60 * 60 * 1000;
      
      if (timeDiff < hourInMs) {
        setShowCooldown(true);
        generateCooldownMessage();
        return true;
      }
    }
    return false;
  };

  const generateCooldownMessage = async () => {
    try {
      const response = await fetch('/api/call-hopar/cooldown-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCooldownMessage(data.message);
      } else {
        setCooldownMessage("Come back in an hour, hopar is busy making money right now!");
      }
    } catch (error) {
      setCooldownMessage("Yo, I'm busy right now. Try again later!");
    }
  };

  const startCall = async () => {
    if (checkCooldownStatus()) return;
    
    // Start ringing phase
    setIsRinging(true);
    
    // Play phone ringing sound
    const ringAudio = new Audio(phoneRingAudio);
    ringAudio.loop = true;
    ringAudio.volume = 0.5;
    ringAudio.play();
    
    // Ring for 2-3 seconds before "answering"
    setTimeout(() => {
      ringAudio.pause();
      ringAudio.currentTime = 0;
      setIsRinging(false);
      setIsCallActive(true);
      setCallDuration(0);
      startActualCall();
    }, 2500);
  };

  const startActualCall = async () => {
    // Start call timer (60-90 seconds)
    const callLength = Math.floor(Math.random() * (90 - 60 + 1)) + 60; // 60-90 seconds
    
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => {
        if (prev >= callLength - 5) {
          // 5 seconds before end, trigger goodbye roast
          if (prev === callLength - 5) {
            triggerGoodbyeRoast();
          }
        }
        
        if (prev >= callLength) {
          endCall();
          return prev;
        }
        
        return prev + 1;
      });
    }, 1000);

    // Start with welcome roast
    await triggerWelcomeRoast();
    
    // Initialize audio recording
    await initializeAudio();
  };

  const triggerWelcomeRoast = async () => {
    try {
      setIsAiSpeaking(true);
      const response = await fetch('/api/call-hopar/welcome-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsAiSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing welcome roast:', error);
      setIsAiSpeaking(false);
    }
  };

  const triggerGoodbyeRoast = async () => {
    try {
      setIsAiSpeaking(true);
      const response = await fetch('/api/call-hopar/goodbye-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, callDuration })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsAiSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing goodbye roast:', error);
      setIsAiSpeaking(false);
    }
  };

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Setup media recorder for speech-to-text
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          await sendAudioForTranscription(event.data);
        }
      };
      
      startAudioVisualization();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const startAudioVisualization = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };

  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('username', username);
      formData.append('callDuration', callDuration.toString());
      
      const response = await fetch('/api/call-hopar/process-speech', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        setIsAiSpeaking(true);
        audio.onended = () => {
          setIsAiSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error processing speech:', error);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    setIsAiSpeaking(false);
    
    // Set cooldown
    localStorage.setItem('lastCallHoparTime', Date.now().toString());
    
    // Cleanup
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showCooldown) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#3a3a3a' }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          className="fixed top-6 left-6 z-20 p-3 rounded-full transition-colors duration-200"
          style={{
            background: '#3a3a3a',
            boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8844)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3a3a3a';
          }}
        >
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="mb-8">
            <PhoneOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Hopar is Busy</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              {cooldownMessage}
            </p>
          </div>
          
          <button
            onClick={onBack}
            className="px-8 py-3 rounded-2xl font-semibold text-white transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8844)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3a3a3a';
            }}
          >
            Back to Lobby
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#3a3a3a' }}>
      {/* Back Button */}
      {!isCallActive && (
        <button
          onClick={onBack}
          className="fixed top-6 left-6 z-20 p-3 rounded-full transition-colors duration-200"
          style={{
            background: '#3a3a3a',
            boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8844)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3a3a3a';
          }}
        >
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>
      )}

      <div className="w-full max-w-md">
        {!isCallActive && !isRinging ? (
          // Pre-call screen
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="mb-12">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '16px 16px 32px #323232, -16px -16px 32px #484848'
                }}
              >
                <Phone className="h-12 w-12 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Call Hopar Ara
                </span>
              </h2>
              
              <p className="text-gray-300 text-lg mb-8">
                Ready to get absolutely destroyed in 90 seconds?
              </p>
            </div>

            <button
              onClick={startCall}
              className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto transition-all duration-200 hover:bg-green-400"
              style={{
                boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
              }}
            >
              <Phone className="h-8 w-8 text-white" />
            </button>
          </motion.div>
        ) : isRinging ? (
          // Ringing screen
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="mb-12">
              <motion.div 
                className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '16px 16px 32px #323232, -16px -16px 32px #484848'
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '16px 16px 32px #323232, -16px -16px 32px #484848',
                    '20px 20px 40px #323232, -20px -20px 40px #484848',
                    '16px 16px 32px #323232, -16px -16px 32px #484848'
                  ]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Phone className="h-12 w-12 text-green-500" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Calling Hopar...</h2>
              <p className="text-gray-300">Connecting to the roast master</p>
            </div>
          </motion.div>
        ) : (
          // Active call screen
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            {/* Call Header */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">Armo Hopar</h3>
              <p className="text-gray-400">{formatTime(callDuration)}</p>
            </div>

            {/* Audio Visualization */}
            <div className="mb-12">
              <div className="w-40 h-40 mx-auto rounded-full flex items-center justify-center relative"
                style={{
                  background: '#3a3a3a',
                  boxShadow: '16px 16px 32px #323232, -16px -16px 32px #484848'
                }}
              >
                <AnimatePresence>
                  {(isRecording || isAiSpeaking) && (
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: 1 + audioLevel * 0.3 }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: isAiSpeaking 
                          ? 'linear-gradient(135deg, #ff4444, #ff8844)'
                          : 'linear-gradient(135deg, #4444ff, #44ff44)',
                        opacity: 0.3
                      }}
                    />
                  )}
                </AnimatePresence>
                
                {isAiSpeaking ? (
                  <Volume2 className="h-12 w-12 text-orange-500" />
                ) : (
                  <Mic className={`h-12 w-12 ${isRecording ? 'text-green-500' : 'text-gray-400'}`} />
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex justify-center space-x-8">
              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isRecording ? 'bg-red-500' : 'bg-gray-600'
                }`}
                style={{
                  boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
                }}
              >
                {isRecording ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isMuted ? 'bg-red-500' : 'bg-gray-600'
                }`}
                style={{
                  boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
                }}
              >
                {isMuted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center transition-all duration-200 hover:bg-red-400"
                style={{
                  boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
                }}
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}