import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onVoiceToggle: () => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

export default function InputArea({ onSendMessage, onVoiceToggle, onFileUpload, disabled = false }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      autoResize();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    onVoiceToggle();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  useEffect(() => {
    autoResize();
  }, [message]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky bottom-0 p-4 border-t border-gray-600/20 backdrop-blur mt-auto"
      style={{
        background: '#3a3a3a',
        boxShadow: '0 -4px 8px #323232'
      }}
    >
      <div className="flex items-end space-x-3 max-w-4xl mx-auto">
        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl transition-all duration-200 flex-shrink-0"
          style={{
            background: '#404040',
            boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#404040';
          }}
          disabled={disabled}
          title="Upload files (images, documents, audio, video)"
        >
          <i className="fas fa-paperclip text-white"></i>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
        />

        {/* Input Field */}
        <div className="flex-1 relative">
          <div className="rounded-2xl p-4" style={{
            background: '#404040',
            boxShadow: 'inset 6px 6px 12px #323232, inset -6px -6px 12px #484848'
          }}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              placeholder="Ask Armo Hopar anything... (Armenian/English)"
              className="w-full bg-transparent text-white placeholder-gray-300 resize-none outline-none"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Voice Input Button */}
        <button
          onClick={handleVoiceToggle}
          className="p-3 rounded-xl transition-all duration-200 flex-shrink-0"
          style={{
            background: isRecording ? 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)' : '#404040',
            boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
          }}
          onMouseEnter={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = '#404040';
            }
          }}
          disabled={disabled}
          title="Voice input - speak your message"
        >
          <i className={`fas fa-microphone text-white ${isRecording ? 'animate-pulse' : ''}`}></i>
        </button>

        {/* Send Message Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-3 rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: !message.trim() || disabled ? '#404040' : 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
            boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
          }}
          onMouseEnter={(e) => {
            if (message.trim() && !disabled) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Send message (Enter)"
        >
          <i className="fas fa-paper-plane text-white"></i>
        </button>
      </div>
    </motion.div>
  );
}
