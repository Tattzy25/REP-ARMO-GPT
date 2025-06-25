import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Volume2, Share2 } from "lucide-react";

interface StreamingMessageProps {
  content: string;
  sender: 'user' | 'armo';
  isStreaming?: boolean;
}

export default function StreamingMessage({ content, sender, isStreaming = false }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(isStreaming ? '' : content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      console.log('Message copied to clipboard');
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleReadAloud = async () => {
    try {
      console.log('Requesting ElevenLabs voice synthesis...');
      
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content })
      });

      if (!response.ok) {
        throw new Error(`Voice synthesis failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        // Stop any currently playing audio
        const existingAudio = document.querySelector('audio[data-elevenlabs]');
        if (existingAudio) {
          existingAudio.remove();
        }

        // Create and play the audio
        const audio = new Audio(data.audioUrl);
        audio.setAttribute('data-elevenlabs', 'true');
        audio.volume = 0.8;
        
        await audio.play();
        console.log('Playing ElevenLabs voice synthesis');
      } else {
        throw new Error('Invalid response from voice synthesis API');
      }
    } catch (error) {
      console.error('ElevenLabs voice synthesis failed:', error);
      
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
        console.log('Using fallback browser speech synthesis');
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Armo-GPT Message',
      text: content,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Message shared successfully');
      } else {
        await navigator.clipboard.writeText(`${content}\n\n- Shared from Armo-GPT`);
        console.log('Message copied for sharing (fallback)');
      }
    } catch (err) {
      console.error('Failed to share message:', err);
    }
  };

  useEffect(() => {
    if (isStreaming && content) {
      let i = 0;
      const streamInterval = setInterval(() => {
        if (i < content.length) {
          setDisplayedContent(content.slice(0, i + 1));
          i++;
        } else {
          clearInterval(streamInterval);
        }
      }, 30);

      return () => clearInterval(streamInterval);
    }
  }, [content, isStreaming]);

  if (sender === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start space-x-3 message-container justify-end"
      >
        <div className="flex-1 flex justify-end">
          <div className="rounded-2xl rounded-tr-sm p-4 max-w-md" style={{
            background: 'linear-gradient(135deg, #20b2aa, #40e0d0, #48d1cc)',
            boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
          }}>
            <p className="text-sm text-white">{displayedContent}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
          background: 'linear-gradient(135deg, #20b2aa, #40e0d0, #48d1cc)',
          boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
        }}>
          <i className="fas fa-user text-sm" style={{ color: 'white' }}></i>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start space-x-3 message-container"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-armo-red via-blue-500 to-orange-400 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold">Հ</span>
      </div>
      <div className="flex-1">
        <div className="rounded-2xl rounded-tl-sm p-4 max-w-md" style={{
          background: 'white',
          boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
        }}>
          <p className="text-sm text-black message-content">{displayedContent}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-gray-600 ml-1 typing-animation"></span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-400">
            Just now
          </div>
          {sender === 'armo' && !isStreaming && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleCopy}
                className="p-1 rounded-full hover:bg-gray-600 transition-colors duration-200"
                title="Copy message"
              >
                <Copy size={14} className="text-gray-400 hover:text-white" />
              </button>
              <button
                onClick={handleReadAloud}
                className="p-1 rounded-full hover:bg-gray-600 transition-colors duration-200"
                title="Read aloud"
              >
                <Volume2 size={14} className="text-gray-400 hover:text-white" />
              </button>
              <button
                onClick={handleShare}
                className="p-1 rounded-full hover:bg-gray-600 transition-colors duration-200"
                title="Share message"
              >
                <Share2 size={14} className="text-gray-400 hover:text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
