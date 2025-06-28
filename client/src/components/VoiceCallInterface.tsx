import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';

interface VoiceCallInterfaceProps {
  onClose: () => void;
  currentVibe: string;
}

type VoiceState = 'listening' | 'speaking' | 'processing' | 'idle';

export default function VoiceCallInterface({ onClose, currentVibe }: VoiceCallInterfaceProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Tap to start conversation');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context for visualization
  const initAudioVisualization = useCallback(async () => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, []);

  // Audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average / 255);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to audio visualization
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAndRespond(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setVoiceState('listening');
      setStatusText('HOPAR LISTENING...');
      updateAudioLevel();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatusText('Microphone access denied');
    }
  }, [updateAudioLevel]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setVoiceState('processing');
      setStatusText('Processing...');
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, []);

  // Transcribe audio and get AI response
  const transcribeAndRespond = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Transcribe with Gemini
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const transcribeResponse = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const transcribeResult = await transcribeResponse.json();
      
      if (transcribeResult.success && transcribeResult.transcription) {
        // Send to chat API for AI response
        const chatResponse = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: transcribeResult.transcription,
            vibe: currentVibe
          })
        });

        if (chatResponse.ok) {
          const reader = chatResponse.body?.getReader();
          let aiResponse = '';
          
          if (reader) {
            const decoder = new TextDecoder();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      aiResponse += parsed.content;
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // Speak the AI response
          if (aiResponse.trim()) {
            await speakResponse(aiResponse.trim());
          }
        }
      }
    } catch (error) {
      console.error('Voice conversation error:', error);
      setStatusText('Something went wrong');
    } finally {
      setIsTranscribing(false);
      setVoiceState('idle');
      setStatusText('Tap to continue conversation');
    }
  }, [currentVibe]);

  // Speak AI response using TTS
  const speakResponse = useCallback(async (text: string) => {
    setIsSpeaking(true);
    setVoiceState('speaking');
    setStatusText('HOPAR SPEAKING...');

    try {
      // Try ElevenLabs first
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.audioUrl) {
          const audio = new Audio(result.audioUrl);
          
          audio.onended = () => {
            setIsSpeaking(false);
            setVoiceState('idle');
            setStatusText('Tap to continue');
          };
          
          await audio.play();
          return;
        }
      }

      // Fallback to browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsSpeaking(false);
        setVoiceState('idle');
        setStatusText('Tap to continue');
      };
      
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setVoiceState('idle');
      setStatusText('Tap to continue');
    }
  }, []);

  // Handle screen tap for touchless experience
  const handleScreenTap = useCallback(() => {
    if (voiceState === 'idle' && !isTranscribing && !isSpeaking) {
      startRecording();
    } else if (voiceState === 'listening') {
      stopRecording();
    }
  }, [voiceState, isTranscribing, isSpeaking, startRecording, stopRecording]);

  // Initialize audio visualization on mount
  useEffect(() => {
    initAudioVisualization();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initAudioVisualization]);

  // Auto-start first interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      if (voiceState === 'idle') {
        setStatusText('Tap anywhere to start');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [voiceState]);

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center cursor-pointer"
      onClick={handleScreenTap}
    >
      {/* Back Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-8 left-8 p-4 rounded-full border-2 border-white/30 hover:border-white/50 transition-colors z-10"
        title="Close voice call interface"
        aria-label="Close voice call interface"
      >
        <ArrowLeft className="w-6 h-6 text-white" />
      </button>

      {/* Main Microphone */}
      <div className="relative mb-16">
        <div 
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            voiceState === 'listening' 
              ? 'shadow-[0_0_50px_#00ff00,0_0_100px_#00ff00,0_0_150px_#00ff00]' 
              : voiceState === 'speaking'
              ? 'shadow-[0_0_50px_#ff4444,0_0_100px_#ff4444,0_0_150px_#ff4444]'
              : 'shadow-[0_0_30px_rgba(255,255,255,0.3)]'
          }`}
          style={{
            background: voiceState === 'listening' 
              ? '#00ff00' 
              : voiceState === 'speaking' 
              ? '#ff4444' 
              : 'rgba(255,255,255,0.1)',
            animation: isRecording || isSpeaking ? 'pulse 1.5s infinite' : 'none'
          }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
            <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"/>
            <path d="M19 10V12C19 16.42 15.42 20 11 20H9V22H11C16.52 22 21 17.52 21 12V10H19Z"/>
            <path d="M5 10V12C5 13.66 6.34 15 8 15V13C6.34 13 5 11.66 5 10Z"/>
          </svg>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-white text-2xl font-light tracking-wider mb-24 text-center">
        {statusText}
      </div>

      {/* Audio Visualizer */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        <div 
          className="w-64 h-64 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.8) 70%)',
            boxShadow: voiceState === 'listening' || voiceState === 'speaking' 
              ? '0 0 100px rgba(255,100,100,0.5), inset 0 0 50px rgba(0,255,255,0.3)'
              : '0 0 50px rgba(255,255,255,0.1)'
          }}
        >
          {/* Audio Waveform Bars */}
          <div className="flex items-center justify-center space-x-1">
            {Array.from({ length: 20 }).map((_, i) => {
              const isActive = isRecording || isSpeaking;
              const baseHeight = 10;
              const activeHeight = Math.random() * (audioLevel * 80 + 40) + baseHeight;
              const height = isActive ? activeHeight : baseHeight;
              
              return (
                <div
                  key={i}
                  className="rounded-full transition-all duration-150"
                  style={{
                    width: '3px',
                    height: `${height}px`,
                    background: `linear-gradient(to top, 
                      ${voiceState === 'listening' ? '#00ff00' : voiceState === 'speaking' ? '#ff4444' : '#00ffff'}, 
                      ${voiceState === 'listening' ? '#ffff00' : voiceState === 'speaking' ? '#ff8888' : '#0088ff'})`,
                    opacity: isActive ? 0.8 + Math.random() * 0.2 : 0.3,
                    transform: isActive ? `scaleY(${0.8 + Math.random() * 0.4})` : 'scaleY(1)',
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="absolute bottom-16 text-white/60 text-lg">
        {voiceState === 'processing' && 'Processing with Gemini...'}
        {voiceState === 'idle' && !isTranscribing && 'Tap anywhere to speak'}
      </div>


    </div>
  );
}