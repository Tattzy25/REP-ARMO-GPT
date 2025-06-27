import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, Volume2 } from 'lucide-react';

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
      }, 50);
    } else {
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
        const colorIntensity = isActive ? 1 : 0.3;
        let barColor;
        if (i < 8) {
          barColor = `rgba(34, 197, 94, ${colorIntensity})`;
        } else if (i < 16) {
          barColor = `rgba(59, 130, 246, ${colorIntensity})`;
        } else if (i < 24) {
          barColor = `rgba(147, 51, 234, ${colorIntensity})`;
        } else {
          barColor = `rgba(239, 68, 68, ${colorIntensity})`;
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
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log('CallHoparInterface unmounting - stopping all audio');
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      if (turnTimerRef.current) {
        clearTimeout(turnTimerRef.current);
      }
    };
  }, []);

  // Handle automatic recording based on turns
  useEffect(() => {
    if (isCallActive && !isRinging && isUserTurn && !isRecording && !isProcessingAudio) {
      startAutomaticRecording();
      
      // Set a 15-second timer for user's turn
      turnTimerRef.current = setTimeout(() => {
        console.log('User turn timeout, switching to AI');
        stopAutomaticRecording();
      }, 15000);
    } else if (!isUserTurn && isRecording) {
      stopAutomaticRecording();
    }
    
    // Clear turn timer when not user's turn
    if (!isUserTurn && turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }
  }, [isUserTurn, isCallActive, isRinging, isProcessingAudio]);

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
  };

  const startCall = async () => {
    setIsRinging(true);
    console.log('Call ringing - starting sequence');
    
    // Ring for 2-3 seconds before "answering"
    setTimeout(() => {
      setIsRinging(false);
      setIsCallActive(true);
      setCallDuration(0);
      setIsUserTurn(false);
      
      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      
      // Set up microphone
      setupMicrophone();
      
      // Hopar greets first
      triggerHoparGreeting();
    }, 2500);
  };

  const triggerHoparGreeting = async () => {
    try {
      setIsGeneratingResponse(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const greetings = [
        `Alo ${username}, what the fuck do you want?`,
        `Yo ${username}, you better have something good to say!`,
        `${username}! Speak up, I don't have all day!`,
        `Well well, ${username} decided to call... this better be worth my time!`,
        `Alo ${username}, ready to get destroyed? Start talking!`
      ];
      
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      await speakResponse(greeting);
      
      setIsGeneratingResponse(false);
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

  const sendAudioForTranscription = async (audioBlob: Blob) => {
    try {
      setIsProcessingAudio(true);
      console.log('Processing audio blob of size:', audioBlob.size);
      
      // Use Gemini 2.5 to transcribe the audio
      if (audioBlob.size > 10000) {
        console.log('Substantial audio detected, sending to Gemini 2.5 for transcription...');
        
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('username', username);
          
          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Gemini 2.5 transcription result:', data.transcription);
            
            if (data.success && data.transcription && data.transcription.trim().length > 2) {
              // Generate contextual roast based on what user actually said
              const contextualResponse = generateContextualRoast(data.transcription, username);
              await speakResponse(contextualResponse);
              return;
            }
          }
        } catch (error) {
          console.log('Gemini 2.5 transcription failed, using smart fallback');
        }
      }
      
      // Smart fallback responses based on audio size
      const smartResponses = audioBlob.size > 10000 ? [
        `${username}, I heard you mumbling but couldn't make out what you said! Speak up!`,
        `Yo ${username}, you sound like you're talking through a pillow! Try again!`,
        `${username}, I know you said something but it was unintelligible garbage!`,
        `Listen ${username}, whatever you just said made no fucking sense!`,
        `${username}, that sounded like gibberish! Are you having a stroke?`
      ] : [
        `${username}, I'm waiting for you to say something! Did you fall asleep?`,
        `Come on ${username}, I don't have all day! Say something!`,
        `${username}, your silence is more boring than your personality!`
      ];
      
      const roastResponse = smartResponses[Math.floor(Math.random() * smartResponses.length)];
      await speakResponse(roastResponse);
      
    } catch (error) {
      console.error('Error processing speech:', error);
      setIsProcessingAudio(false);
      showErrorPopup('Speech processing failed. Please check your microphone and connection.');
    }
  };

  // Generate contextual roast based on user input
  const generateContextualRoast = (userSpeech: string, username: string): string => {
    const lowerSpeech = userSpeech.toLowerCase();
    
    if (lowerSpeech.includes('hello') || lowerSpeech.includes('hi')) {
      return `Oh wow ${username}, "hello"? That's the best you got? How fucking original!`;
    }
    if (lowerSpeech.includes('fuck') || lowerSpeech.includes('shit')) {
      return `${username} trying to be tough with profanity? That's cute, like a puppy trying to bark!`;
    }
    if (lowerSpeech.includes('stupid') || lowerSpeech.includes('dumb')) {
      return `${username} calling me stupid? Look in the mirror, genius!`;
    }
    if (lowerSpeech.includes('you suck') || lowerSpeech.includes('bad')) {
      return `${username}, if I suck, what does that make you for calling me? A fucking loser!`;
    }
    if (lowerSpeech.includes('ugly') || lowerSpeech.includes('look')) {
      return `${username} talking about looks? Have you seen yourself in a mirror lately?`;
    }
    
    if (userSpeech.length < 10) {
      return `${username}, that's all you got? "${userSpeech}"? My grandmother has better comebacks!`;
    } else {
      return `${username} said "${userSpeech}" - wow, such eloquence! Did you practice that in the mirror?`;
    }
  };

  // Speak response using Web Speech API (fallback since ElevenLabs credits depleted)
  const speakResponse = async (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2;
        utterance.pitch = 0.9;
        utterance.volume = 1;
        
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          utterance.voice = voices[0];
        }
        
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
        console.log('Speech synthesis not supported, continuing without audio');
        setIsProcessingAudio(false);
        setIsUserTurn(true);
      }
    } catch (error) {
      console.error('Error in speech synthesis:', error);
      setIsProcessingAudio(false);
      setIsUserTurn(true);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created with size:', audioBlob.size, 'bytes');
        audioChunksRef.current = [];
        
        await sendAudioForTranscription(audioBlob);
      };
      
      console.log('Microphone setup complete');
    } catch (error) {
      console.error('Error setting up microphone:', error);
      showErrorPopup('Microphone access denied or not available');
    }
  };

  const endCall = () => {
    console.log('Ending call - stopping all audio and timers');
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    setIsCallActive(false);
    setIsRecording(false);
    setIsAiSpeaking(false);
    setIsRinging(false);
    setIsUserTurn(false);
    setIsProcessingAudio(false);
    setIsGeneratingResponse(false);
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    onBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Error Popup */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg border border-red-500"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848, 0 0 20px rgba(239, 68, 68, 0.5)'
            }}
          >
            <p className="text-red-400 font-medium">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!isCallActive ? (
        // Pre-call screen
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center flex-1 flex flex-col justify-center items-center px-8"
        >
          <div className="mb-8">
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent font-['Audiowide']">
              Call Hopar
            </h1>
            
            <p className="text-gray-300 text-lg mb-8">
              Ready to get absolutely destroyed in voice chat?
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
          className="text-center flex-1 flex flex-col justify-center items-center"
        >
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
        </motion.div>
      ) : (
        // Active call screen
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center relative h-screen flex flex-col justify-between py-16"
        >
          {/* Top Section - Hopar's state */}
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
            <p className="text-gray-400 text-sm mt-2">{formatTime(callDuration)}</p>
          </div>

          {/* Central Audio Visualization */}
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
              <AudioWaveform isActive={isRecording || isAiSpeaking} />
            </div>
          </div>

          {/* Bottom Section - User's state and controls */}
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
          </div>
        </motion.div>
      )}
    </div>
  );
}