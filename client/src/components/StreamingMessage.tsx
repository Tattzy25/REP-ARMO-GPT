import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Volume2, Share2, FileText, Image, Music, Video } from "lucide-react";

interface StreamingMessageProps {
  content: string;
  sender: 'user' | 'armo';
  isStreaming?: boolean;
  createdAt?: string;
}

interface FileAttachmentProps {
  sender: 'user' | 'armo';
  content: string;
}

function FileAttachment({ sender, content }: FileAttachmentProps) {
  // Check if message contains file upload indicator
  if (!content.includes('📎 Uploaded:')) {
    return null;
  }

  // Extract file info from content
  const match = content.match(/📎 Uploaded: (.+?) \((.+?)\)/);
  if (!match) return null;

  const [, filename, size] = match;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  const isAudio = /\.(mp3|wav|ogg)$/i.test(filename);
  const isVideo = /\.(mp4|webm|ogg)$/i.test(filename);

  const getFileIcon = () => {
    if (isImage) return <Image size={16} />;
    if (isAudio) return <Music size={16} />;
    if (isVideo) return <Video size={16} />;
    return <FileText size={16} />;
  };

  return (
    <div className="mt-2 p-3 rounded-lg border border-gray-300 bg-gray-50">
      <div className="flex items-center space-x-2 text-gray-700">
        {getFileIcon()}
        <span className="text-sm font-medium">{filename}</span>
        <span className="text-xs text-gray-500">({size})</span>
      </div>
    </div>
  );
}

export default function StreamingMessage({ content, sender, isStreaming = false, createdAt }: StreamingMessageProps) {

  const formatTime = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
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
      }, 20); // Faster streaming for smoother effect

      return () => clearInterval(streamInterval);
    }
  }, [content, isStreaming]);

  if (sender === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex items-start space-x-3 message-container justify-end"
        style={{ zIndex: 1, position: 'relative' }}
      >
        <div className="flex-1 flex justify-end">
          <div className="rounded-2xl rounded-tr-sm p-4 max-w-md" style={{
            background: 'linear-gradient(135deg, #20b2aa, #40e0d0, #48d1cc)',
            boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848',
            position: 'relative',
            zIndex: 2
          }}>
            <p className="text-sm text-white" style={{ fontWeight: '500' }}>{displayedContent}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
          background: 'linear-gradient(135deg, #20b2aa, #40e0d0, #48d1cc)',
          boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
        }}>
          <span className="text-sm font-bold text-white">U</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-start space-x-3 message-container"
      style={{ zIndex: 1, position: 'relative' }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
        background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8844)',
        boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
      }}>
        <span className="text-sm font-bold text-white">Հ</span>
      </div>
      <div className="flex-1">
        <div className="rounded-2xl rounded-tl-sm p-4 max-w-md" style={{
          background: '#ffffff',
          boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848',
          minHeight: '40px',
          position: 'relative',
          zIndex: 2
        }}>
          <div className="text-sm message-content" style={{ color: '#111111', fontWeight: '500' }}>
            {displayedContent}
            {/* Render file attachments if present */}
            {createdAt && content.includes('📎 Uploaded:') && (
              <FileAttachment sender={sender} content={content} />
            )}
          </div>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-gray-600 ml-1 typing-animation"></span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-400">
              {formatTime(createdAt)}
            </div>
            {sender === 'armo' && !isStreaming && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: '#404040',
                    boxShadow: '2px 2px 4px #323232, -2px -2px 4px #484848'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(45deg, #ff4444, #4444ff, #ff8844)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#404040';
                  }}
                  title="Copy message"
                >
                  <Copy size={12} className="text-white" />
                </button>
                <button
                  onClick={handleReadAloud}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: '#404040',
                    boxShadow: '2px 2px 4px #323232, -2px -2px 4px #484848'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(45deg, #ff4444, #4444ff, #ff8844)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#404040';
                  }}
                  title="Read aloud"
                >
                  <Volume2 size={12} className="text-white" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: '#404040',
                    boxShadow: '2px 2px 4px #323232, -2px -2px 4px #484848'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(45deg, #ff4444, #4444ff, #ff8844)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#404040';
                  }}
                  title="Share message"
                >
                  <Share2 size={12} className="text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
