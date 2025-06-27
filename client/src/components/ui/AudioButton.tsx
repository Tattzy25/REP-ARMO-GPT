import React, { useState, useEffect } from 'react';
import { Volume2, Pause, Loader2 } from 'lucide-react';

interface AudioButtonProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  size?: number;
  disabled?: boolean;
  onError?: (error: string) => void;
}

export function AudioButton({ 
  text, 
  className = "", 
  style, 
  title,
  size = 24,
  disabled = false,
  onError
}: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup function to stop audio when component unmounts
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    // Stop ElevenLabs audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  const handleReadAloud = () => {
    if (isLoadingAudio || disabled) {
      // Do nothing if already loading or disabled
      return;
    }
    
    if (isPlaying) {
      // Stop current playback
      stopPlayback();
    } else if (text) {
      // Start new playback
      playWithElevenLabs(text);
    }
  };

  const playWithElevenLabs = async (textToSpeak: string) => {
    try {
      setIsLoadingAudio(true);
      setIsPlaying(false);
      
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (!response.ok) {
        throw new Error(`Voice synthesis failed: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
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
        if (onError) {
          onError('Audio playback failed. Please try again.');
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      setIsPlaying(false);
      setIsLoadingAudio(false);
      setCurrentAudio(null);
      if (onError) {
        onError(`Voice synthesis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const getButtonTitle = () => {
    if (title) return title;
    if (isLoadingAudio) return "Loading audio...";
    if (isPlaying) return "Pause";
    return "Read Out Loud";
  };

  const getIcon = () => {
    if (isLoadingAudio) {
      return <Loader2 size={size} className="animate-spin" />;
    }
    if (isPlaying) {
      return <Pause size={size} />;
    }
    return <Volume2 size={size} />;
  };

  return (
    <button
      onClick={handleReadAloud}
      className={className}
      style={style}
      title={getButtonTitle()}
      disabled={isLoadingAudio || disabled}
    >
      {getIcon()}
    </button>
  );
}