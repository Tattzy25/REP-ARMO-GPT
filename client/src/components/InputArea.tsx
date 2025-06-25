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
      className="p-4 border-t border-armo-accent/20 bg-armo-navy/80 backdrop-blur"
    >
      <div className="flex items-end space-x-3 max-w-4xl mx-auto">
        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl bg-armo-blue neumorphic hover:neon-teal-glow transition-all duration-300 flex-shrink-0"
          disabled={disabled}
        >
          <i className="fas fa-paperclip text-neon-teal"></i>
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
          <div className="bg-armo-blue rounded-2xl neumorphic-inset p-4">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
              placeholder="Ask Armo Hopar anything... (Armenian/English)"
              className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Voice Input */}
        <button
          onClick={handleVoiceToggle}
          className={`p-3 rounded-xl bg-armo-blue neumorphic transition-all duration-300 flex-shrink-0 ${
            isRecording ? 'neon-coral-glow' : 'hover:neon-coral-glow'
          }`}
          disabled={disabled}
        >
          <i className={`fas fa-microphone ${isRecording ? 'text-neon-coral animate-pulse' : 'text-neon-coral'}`}></i>
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-teal neumorphic hover:neon-cyan-glow transition-all duration-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-paper-plane text-white"></i>
        </button>
      </div>
    </motion.div>
  );
}
