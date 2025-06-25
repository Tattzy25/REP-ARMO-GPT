import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onVoiceToggle: () => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
  isSidebarCollapsed?: boolean;
  isMobile?: boolean;
}

export default function InputArea({ onSendMessage, onVoiceToggle, onFileUpload, disabled = false, isSidebarCollapsed = false, isMobile = false }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      console.log('Sending message:', message.trim());
      onSendMessage(message.trim());
      setMessage("");
      autoResize();
      
      // Simple refocus after sending
      setTimeout(() => textareaRef.current?.focus(), 100);
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

  const handleVoiceToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    
    if (newRecordingState) {
      console.log('Starting voice recording...');
      // TODO: Start actual voice recording here
    } else {
      console.log('Stopping voice recording...');
      // TODO: Stop voice recording and process audio here
    }
    
    onVoiceToggle();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
      onFileUpload(file);
      // Reset input to allow same file selection again
      e.target.value = '';
    }
  };

  useEffect(() => {
    autoResize();
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Simple focus management - only when truly needed
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If clicking on message area but not on buttons, refocus textarea
      if (target.closest('.chat-messages') && 
          !target.closest('button') && 
          !target.closest('[role="button"]') &&
          !target.closest('.message-container button')) {
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`input-area p-4 ${isMobile ? 'pb-6' : ''}`}
      style={{
        background: '#3a3a3a',
        borderTop: '1px solid #555'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ChatGPT-style Input Container */}
        <div className="relative flex items-center">
          <div 
            className="flex-1 relative rounded-3xl transition-all duration-200"
            style={{
              background: '#404040',
              boxShadow: 'inset 3px 3px 8px #323232, inset -3px -3px 8px #484848',
              border: '1px solid #555'
            }}
          >
            {/* Left Side Buttons */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2 rounded-full transition-all duration-200 hover:bg-gray-600"
                title="Attach file"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21.44 11.05L12.25 20.24C11.12 21.37 9.59 22 7.99 22C6.39 22 4.86 21.37 3.73 20.24C2.6 19.11 1.97 17.58 1.97 15.98C1.97 14.38 2.6 12.85 3.73 11.72L12.92 2.53C13.69 1.76 14.76 1.33 15.88 1.33C17 1.33 18.07 1.76 18.84 2.53C19.61 3.3 20.04 4.37 20.04 5.49C20.04 6.61 19.61 7.68 18.84 8.45L10.15 17.14C9.76 17.53 9.24 17.75 8.7 17.75C8.16 17.75 7.64 17.53 7.25 17.14C6.86 16.75 6.64 16.23 6.64 15.69C6.64 15.15 6.86 14.63 7.25 14.24L15.54 5.95" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Plus Button with Dropdown */}
              <div className="relative tools-dropdown">
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  disabled={disabled}
                  className="p-2 rounded-full transition-all duration-200 hover:bg-gray-600"
                  title="More tools"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Tools Dropdown */}
                {isToolsOpen && (
                  <div 
                    className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg border border-gray-600 min-w-[150px] z-20"
                    style={{
                      boxShadow: '4px 4px 12px #1a1a1a, -2px -2px 8px #4a4a4a'
                    }}
                  >
                    <button
                      onClick={() => {
                        setIsToolsOpen(false);
                        // TODO: Implement Deep Search functionality
                        console.log('Deep Search clicked');
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center space-x-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Deep Search</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Ask Armo Hopar anything... (Armenian/English)"
              disabled={disabled}
              className="w-full min-h-[60px] max-h-32 py-4 pl-20 pr-28 bg-transparent resize-none outline-none text-white placeholder-gray-400 transition-all duration-200"
              style={{
                fontSize: '16px',
                lineHeight: '1.5'
              }}
            />

            {/* Right Side Buttons Container */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
              {/* Voice Toggle Button */}
              <button
                onMouseDown={handleVoiceToggle}
                disabled={disabled}
                className="p-2 rounded-full transition-all duration-200 hover:bg-gray-600"
                style={{
                  background: isRecording ? '#ff4444' : 'transparent'
                }}
                title="Voice input"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isRecording ? "white" : "#9ca3af"}>
                  <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"/>
                  <path d="M19 10V12C19 16.42 15.42 20 11 20H9V22H11C16.52 22 21 17.52 21 12V10H19Z"/>
                  <path d="M5 10V12C5 13.66 6.34 15 8 15V13C6.34 13 5 11.66 5 10Z"/>
                </svg>
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={disabled || !message.trim()}
                className="p-2 rounded-full transition-all duration-200"
                style={{
                  background: (!disabled && message.trim()) ? 'linear-gradient(45deg, #ff4444, #4444ff, #ff8844)' : 'transparent',
                  opacity: (!disabled && message.trim()) ? 1 : 0.5
                }}
                title="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={(!disabled && message.trim()) ? "white" : "#9ca3af"}>
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.txt,.doc,.docx"
        />
      </div>
    </motion.div>
  );
}
