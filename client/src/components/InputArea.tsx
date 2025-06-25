import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onVoiceToggle: () => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
  isSidebarCollapsed?: boolean;
}

export default function InputArea({ onSendMessage, onVoiceToggle, onFileUpload, disabled = false, isSidebarCollapsed = false }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      console.log('Sending message:', message.trim());
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

  const handleVoiceToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed bottom-0 right-0 p-4 border-t border-gray-600/20 backdrop-blur z-50 transition-all duration-300 ${
        isSidebarCollapsed ? 'left-0' : 'left-80'
      }`}
      style={{
        background: '#3a3a3a',
        boxShadow: '0 -4px 8px #323232'
      }}
    >
      <div className="flex items-end space-x-3 max-w-4xl mx-auto">
        {/* File Upload Button */}
        <div 
          className="neumorphic-button" 
          onClick={() => {
            if (!disabled) {
              fileInputRef.current?.click();
            }
          }} 
          title="Upload files (images, documents, audio, video)"
        >
          <div className="toggle">
            <input type="checkbox" disabled={disabled} />
            <span className="button" />
            <span className="label">📎</span>
          </div>
        </div>
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
        <div 
          className="neumorphic-button" 
          onClick={handleVoiceToggle} 
          title="Click to start/stop recording"
        >
          <div className="toggle">
            <input type="checkbox" checked={isRecording} disabled={disabled} readOnly />
            <span 
              className="button"
              style={{
                background: isRecording ? '#ff4444' : '#3a3a3a',
                borderRadius: '50px'
              }}
            />
            <span 
              className="label"
              style={{
                color: isRecording ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'
              }}
            >
              🎤
            </span>
          </div>
        </div>

        {/* Send Message Button */}
        <div 
          className={`neumorphic-button ${!message.trim() || disabled ? 'disabled' : ''}`} 
          onClick={() => {
            if (message.trim() && !disabled) {
              handleSend();
            }
          }} 
          title="Send message (Enter to send)"
        >
          <div className="toggle">
            <input type="checkbox" disabled={!message.trim() || disabled} />
            <span className="button" />
            <span className="label">✈️</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
