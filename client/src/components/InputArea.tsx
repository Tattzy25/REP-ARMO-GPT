import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Paperclip, Mic, Send, MicOff, Image, FileText } from "lucide-react";

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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || uploadedFiles.length > 0) && !disabled) {
      let messageToSend = message.trim();
      
      // If there are files, add file information to the message
      if (uploadedFiles.length > 0) {
        const fileInfo = uploadedFiles.map(file => `[File: ${file.name}]`).join(' ');
        messageToSend = messageToSend ? `${messageToSend}\n\n${fileInfo}` : fileInfo;
      }
      
      console.log('Sending message:', messageToSend);
      onSendMessage(messageToSend);
      setMessage("");
      setUploadedFiles([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => [...prev, ...fileArray]);
      
      // Process each file
      fileArray.forEach(file => {
        console.log('File selected:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
        
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          return;
        }
        
        onFileUpload(file);
      });
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
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
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed bottom-0 left-0 right-0 transition-all duration-300 ${isMobile ? 'p-3' : 'p-6'}`}
      style={{
        background: '#3a3a3a',
        borderTop: '1px solid #404040',
        boxShadow: '0 -4px 8px #323232'
      }}
    >
      <div className="flex flex-col max-w-4xl mx-auto">
        {/* File Upload Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: '#404040',
                  boxShadow: 'inset 2px 2px 4px #323232, inset -2px -2px 4px #484848'
                }}
              >
                {file.type.startsWith('image/') ? (
                  <Image size={16} className="text-blue-400" />
                ) : (
                  <FileText size={16} className="text-green-400" />
                )}
                <span className="text-white text-sm truncate max-w-32">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-300 ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`flex items-end ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
        {/* File Upload Button */}
        <div 
          className="neumorphic-button" 
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) {
              fileInputRef.current?.click();
            }
          }} 
          title="Upload files (images, documents, audio, video)"
        >
          <div className="toggle">
            <input type="checkbox" disabled={disabled} />
            <span className="button" style={{ background: '#3a3a3a' }} />
            <span className="label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>📎</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.json,.csv,.xml"
          multiple
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
              autoFocus
            />
          </div>
        </div>

        {/* Voice Input Button */}
        <div 
          className="neumorphic-button" 
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            if (message.trim() && !disabled) {
              handleSend();
            }
          }} 
          title="Send message (Enter to send)"
        >
          <div className="toggle">
            <input type="checkbox" disabled={!message.trim() || disabled} />
            <span className="button" style={{ background: '#3a3a3a' }} />
            <span className="label" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>✈️</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
