import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import phoneRingAudio from '@assets/11L-PHONE_RINGING_CALLIN-1751063550449_1751063667978.mp3';

// AudioWaveform Component for Large Animated Equalizer
function AudioWaveform({ isActive }: { isActive: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(32).fill(8));
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setBars(prev => prev.map((_, i) => {
          const baseHeight = 8;
          const maxHeight = 120;
          return baseHeight + Math.random() * maxHeight + Math.sin(Date.now() * 0.005 + i * 0.3) * 15;
        }));
      }, 50); // Very fast animation when active
    } else {
      // When not active, slowly settle to baseline
      setBars(prev => prev.map(height => {
        const baseline = 12;
        return height > baseline ? Math.max(baseline, height - 2) : baseline;
      }));
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="flex items-center justify-center space-x-1">
      {bars.map((height, i) => {
        // Color gradient based on position
        const colorIntensity = isActive ? 1 : 0.3;
        let barColor;
        if (i < 8) {
          barColor = `rgba(34, 197, 94, ${colorIntensity})`; // Green
        } else if (i < 16) {
          barColor = `rgba(59, 130, 246, ${colorIntensity})`; // Blue  
        } else if (i < 24) {
          barColor = `rgba(147, 51, 234, ${colorIntensity})`; // Purple
        } else {
          barColor = `rgba(239, 68, 68, ${colorIntensity})`; // Red
        }
        
        return (
          <div
            key={i}
            className="transition-all duration-100 ease-out"
            style={{
              width: '5px',
              height: `${Math.max(height, 8)}px`,
              background: isActive ? 
                `linear-gradient(to top, ${barColor}, rgba(255, 255, 255, 0.9))` :
                barColor,
              borderRadius: '2px',
              boxShadow: isActive ? `0 0 6px ${barColor}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

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
  const [turnTimeLeft, setTurnTimeLeft] = useState(15);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check for cooldown on component mount
  useEffect(() => {
    checkCooldownStatus();
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Automatic turn management for touchless experience
  useEffect(() => {
    if (isCallActive && !isRinging) {
      // Start turn timer
      turnTimerRef.current = setInterval(() => {
        setTurnTimeLeft(prev => {
          if (prev <= 1) {
            // Switch turns
            setIsUserTurn(current => !current);
            return 15; // Reset to 15 seconds
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      };
    }
  }, [isCallActive, isRinging]);

  // Handle automatic recording based on turns
  useEffect(() => {
    if (isCallActive && !isRinging) {
      if (isUserTurn && !isRecording && !isProcessingAudio) {
        // Start user recording automatically for their 15-second turn
        startAutomaticRecording();
      } else if (!isUserTurn && isRecording) {
        // Stop user recording and process when switching to Hopar's turn
        stopAutomaticRecording();
      }
      
      // Update AI speaking state - Hopar speaks when it's not user's turn
      setIsAiSpeaking(!isUserTurn && !isProcessingAudio && !isGeneratingResponse);
    }
  }, [isUserTurn, isCallActive, isRinging, isProcessingAudio, isGeneratingResponse]);

  // Error message auto-dismiss
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const showErrorPopup = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    // End call on any error
    endCall();
  };

  const checkCooldownStatus = () => {
    // Cooldown disabled for development/testing - users can call multiple times
    // For production, uncomment the lines below to enable 1-hour cooldown:
    /*
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
    */
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
    
    // Skip phone ringing audio to avoid loading issues
    console.log('Call ringing - audio skipped for compatibility');
    
    // Ring for 2-3 seconds before "answering"
    setTimeout(() => {
      // No audio to pause since we skipped it
      setIsRinging(false);
      setIsCallActive(true);
      setCallDuration(0);
      setIsUserTurn(false); // Hopar speaks first
      setTurnTimeLeft(15);
      setIsAiSpeaking(true);
      
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Set up microphone
      setupMicrophone();
      
      // Hopar answers with greeting: "Alo [username], what do you want..."
      triggerHoparGreeting();
    }, 2500);
  };

  const triggerHoparGreeting = async () => {
    try {
      setIsGeneratingResponse(true);
      
      // Add delay to show generating state
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const greetings = [
        `Alo ${username}, what the fuck do you want?`,
        `Yo ${username}, you better have something good to say!`,
        `${username}! Speak up, I don't have all day!`,
        `Well well, ${username} decided to call... this better be worth my time!`,
        `Alo ${username}, ready to get destroyed? Start talking!`
      ];
      
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      
      // Mobile speech synthesis requires careful handling
      try {
        if ('speechSynthesis' in window && speechSynthesis.getVoices().length > 0) {
          speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(greeting);
          utterance.rate = 1.1;
          utterance.pitch = 0.9;
          utterance.volume = 1;
          
          // Use first available voice for better mobile compatibility
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            utterance.voice = voices[0];
          }
          
          setIsGeneratingResponse(false);
          setIsAiSpeaking(true);
          
          utterance.onend = () => {
            setIsAiSpeaking(false);
            setIsUserTurn(true);
          };
          
          utterance.onerror = (e) => {
            console.log('Speech error:', e);
            setIsAiSpeaking(false);
            setIsUserTurn(true);
          };
          
          speechSynthesis.speak(utterance);
        } else {
          // Wait for voices to load on mobile
          speechSynthesis.addEventListener('voiceschanged', () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
              const utterance = new SpeechSynthesisUtterance(greeting);
              utterance.voice = voices[0];
              utterance.rate = 1.1;
              utterance.pitch = 0.9;
              utterance.volume = 1;
              
              setIsGeneratingResponse(false);
              setIsAiSpeaking(true);
              
              utterance.onend = () => {
                setIsAiSpeaking(false);
                setIsUserTurn(true);
              };
              
              speechSynthesis.speak(utterance);
            }
          }, { once: true });
          
          // Fallback if voices don't load
          setTimeout(() => {
            if (isGeneratingResponse) {
              setIsGeneratingResponse(false);
              setIsUserTurn(true);
            }
          }, 3000);
        }
      } catch (error) {
        console.log('Speech synthesis failed:', error);
        setIsGeneratingResponse(false);
        setIsUserTurn(true);
      }
    } catch (error) {
      console.error('Error in greeting:', error);
      setIsGeneratingResponse(false);
      setIsUserTurn(true);
    }
  };

  const startAutomaticRecording = async () => {
    try {
      if (!mediaRecorderRef.current) {
        console.log('MediaRecorder not available, setting up microphone...');
        await setupMicrophone();
        if (!mediaRecorderRef.current) {
          console.error('Failed to set up microphone');
          return;
        }
      }
      
      console.log('Starting recording...');
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      startAudioVisualization();
    } catch (error) {
      console.error('Error starting automatic recording:', error);
    }
  };

  const stopAutomaticRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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
      setIsProcessingAudio(true);
      
      console.log('Processing audio blob of size:', audioBlob.size);
      
      // Check if we actually have audio data
      if (audioBlob.size === 0) {
        console.log('No audio data detected - user might not have spoken');
      }
      
      // Add a short delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create more varied roast responses that acknowledge different scenarios
      const roastResponses = [
        `Yo ${username}, I'm waiting for you to say something! Did you fall asleep?`,
        `${username}, your mic working? I can't hear shit from you!`,
        `Listen ${username}, you called ME remember? Speak up!`,
        `${username}, this silence is more boring than your personality!`,
        `Come on ${username}, I don't have all day! Say something!`,
        `${username}, even a mute person would be more entertaining!`,
        `Oh please ${username}, at least try to insult me back!`,
        `${username}, your silence speaks louder than your words ever could!`,
        `What's wrong ${username}? Cat got your tongue?`,
        `${username}, I've heard more noise from a library!`
      ];
      
      const roastResponse = roastResponses[Math.floor(Math.random() * roastResponses.length)];
      
      // Use Web Speech API to speak the response
      if ('speechSynthesis' in window) {
        // Cancel any existing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(roastResponse);
        utterance.rate = 1.2;
        utterance.pitch = 0.9;
        utterance.volume = 1;
        
        setIsProcessingAudio(false);
        setIsAiSpeaking(true);
        
        utterance.onend = () => {
          setIsAiSpeaking(false);
          setIsUserTurn(true);
        };
        
        utterance.onerror = () => {
          console.log('Speech synthesis error, continuing anyway');
          setIsAiSpeaking(false);
          setIsUserTurn(true);
        };
        
        speechSynthesis.speak(utterance);
      } else {
        // If speech synthesis not supported, just continue
        console.log('Speech synthesis not supported, continuing without audio');
        setIsProcessingAudio(false);
        setIsUserTurn(true);
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      setIsProcessingAudio(false);
      showErrorPopup('Speech processing failed. Please check your microphone and connection.');
    }
  };

  const setupMicrophone = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Microphone access granted, setting up MediaRecorder...');
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = async (event) => {
        console.log('Audio data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        console.log('Audio chunks collected:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created with size:', audioBlob.size, 'bytes');
        audioChunksRef.current = [];
        
        // Always process the audio, even if it's empty (simulating real behavior)
        await sendAudioForTranscription(audioBlob);
      };
      
      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);
      
      console.log('Microphone setup complete');
    } catch (error) {
      console.error('Error setting up microphone:', error);
      showErrorPopup('Microphone access denied or not available');
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsRecording(false);
    setIsAiSpeaking(false);
    setIsRinging(false);
    setIsUserTurn(false);
    
    // Set cooldown
    localStorage.setItem('lastCallHoparTime', Date.now().toString());
    
    // Cleanup timers
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
      turnTimerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop media recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Automatically return to lobby
    onBack();
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
          // Active call screen with new design
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center relative h-screen flex flex-col justify-between py-16"
          >
            {/* Top Microphone - Hopar's state */}
            <div className="flex flex-col items-center">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-300"
                style={{
                  background: isAiSpeaking ? 
                    `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 70%, transparent 100%)` :
                    `radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 70%, transparent 100%)`,
                  boxShadow: isAiSpeaking ? 
                    `0 0 30px rgba(34, 197, 94, 0.8), inset 0 0 20px rgba(34, 197, 94, 0.2)` :
                    `0 0 30px rgba(239, 68, 68, 0.8), inset 0 0 20px rgba(239, 68, 68, 0.2)`,
                }}
              >
                <Mic className={`h-8 w-8 ${isAiSpeaking ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <h2 className="text-xl font-bold text-white">
                {isAiSpeaking ? "HOPAR ROASTING..." : 
                 isProcessingAudio || isGeneratingResponse ? "HOPAR THINKING..." : 
                 "HOPAR LISTENING..."}
              </h2>
            </div>

            {/* Central Audio Visualization - Large Phone-Style Equalizer */}
            <div className="flex-1 flex items-center justify-center px-8">
              <div 
                className="w-80 h-80 lg:w-96 lg:h-96 rounded-full flex items-center justify-center relative transition-all duration-300"
                style={{
                  background: `radial-gradient(circle, 
                    rgba(59, 130, 246, 0.4) 0%, 
                    rgba(147, 51, 234, 0.3) 25%, 
                    rgba(239, 68, 68, 0.4) 50%, 
                    rgba(34, 197, 94, 0.2) 75%, 
                    transparent 100%)`,
                  boxShadow: `
                    0 0 80px rgba(59, 130, 246, 0.6),
                    0 0 120px rgba(147, 51, 234, 0.4),
                    0 0 160px rgba(239, 68, 68, 0.3),
                    inset 0 0 60px rgba(0, 0, 0, 0.6)
                  `,
                }}
              >
                {/* Large Animated Audio Waveform - Only when actually speaking */}
                <AudioWaveform 
                  isActive={isRecording || isAiSpeaking}
                />
              </div>
            </div>

            {/* Bottom Section - User's state */}
            <div className="flex flex-col items-center">
              {/* Status Text with Loading Indicators */}
              <div className="flex items-center justify-center mb-6">
                <h3 className="text-xl font-bold text-white mr-3">
                  {isProcessingAudio ? "PROCESSING..." : 
                   isGeneratingResponse ? "GENERATING..." : 
                   isUserTurn && isRecording ? "YOUR ROASTING..." : 
                   isAiSpeaking ? "YOUR LISTENING..." : 
                   "YOUR TURN..."}
                </h3>
                {(isProcessingAudio || isGeneratingResponse) && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-12">
                {/* Speaker Icon */}
                <div className="w-12 h-12 flex items-center justify-center">
                  <Volume2 className="h-8 w-8 text-white opacity-70" />
                </div>
                
                {/* User Microphone */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isRecording ? 
                      `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 70%, transparent 100%)` :
                      `radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 70%, transparent 100%)`,
                    boxShadow: isRecording ? 
                      `0 0 25px rgba(34, 197, 94, 0.8), inset 0 0 15px rgba(34, 197, 94, 0.2)` :
                      `0 0 25px rgba(239, 68, 68, 0.8), inset 0 0 15px rgba(239, 68, 68, 0.2)`,
                  }}
                >
                  <Mic className={`h-6 w-6 ${isRecording ? 'text-green-400' : 'text-red-400'}`} />
                </div>
                
                {/* Hang Up Button */}
                <button
                  onClick={endCall}
                  className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 transition-colors duration-200"
                  style={{
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)'
                  }}
                >
                  <PhoneOff className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Turn Timer Display */}
              <div className="mt-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {turnTimeLeft}
                </div>
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-1000"
                    style={{ width: `${(turnTimeLeft / 15) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Popup */}
        {showError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div 
              className="max-w-md w-full p-6 rounded-lg text-center"
              style={{
                background: '#3a3a3a',
                boxShadow: '16px 16px 32px #323232, -16px -16px 32px #484848',
                border: '2px solid #ef4444'
              }}
            >
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-red-500 bg-opacity-20 mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 8.5c-.77.833-.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Call Failed</h3>
                <p className="text-gray-300">{errorMessage}</p>
              </div>
              <div className="text-sm text-gray-400">
                Returning to lobby in a moment...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}