import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X, Image } from "lucide-react";
import { chatApi, type ChatMessage } from "@/lib/api";
import { vibeConfigs } from "@/lib/vibes";
import StreamingMessage from "./StreamingMessage";
import InputArea from "./InputArea";
import VoiceCallInterface from "./VoiceCallInterface";

interface ChatInterfaceProps {
  currentVibe: string;
  onBackToLobby: () => void;
  isSidebarCollapsed?: boolean;
  isMobile?: boolean;
  currentSessionId?: number | null;
}

interface StagedFile {
  id: string;
  file: File;
  uploadedData?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
}

interface StagedFile {
  id: string;
  file: File;
  uploadedData?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
}

export default function ChatInterface({ currentVibe, onBackToLobby, isSidebarCollapsed = false, isMobile = false, currentSessionId }: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [showVoiceInterface, setShowVoiceInterface] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const vibeConfig = vibeConfigs[currentVibe];

  // Load chat history
  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ['/api/chat', currentVibe, 'history'],
    queryFn: () => chatApi.getChatHistory(currentVibe),
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (vibe: string) => chatApi.createSession(vibe),
    onSuccess: (session) => {
      setSessionId(session.id);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, content, attachments }: { sessionId: number; content: string; attachments?: StagedFile[] }) => {
      setStreamingMessage(""); // Initialize streaming
      
      return chatApi.sendMessage(
        sessionId,
        content,
        // onDelta - real-time streaming
        (deltaContent: string) => {
          setStreamingMessage(prev => prev + deltaContent);
        },
        // onComplete - when AI finishes
        (completedMessage: ChatMessage) => {
          setTimeout(() => {
            setStreamingMessage(null);
            setMessages(prev => [...prev, completedMessage]);
            queryClient.invalidateQueries({ queryKey: [`/api/chat/${currentVibe}/history`] });
            // Clear staged files after successful send
            setStagedFiles([]);
          }, 500); // Small delay to let streaming animation finish smoothly
        },
        // onUserMessage - add user message immediately
        (userMessage: ChatMessage) => {
          setMessages(prev => [...prev, userMessage]);
        },
        attachments
      );
    },
  });

  // Initialize chat
  useEffect(() => {
    if (chatHistory) {
      if (chatHistory.sessionId) {
        setSessionId(chatHistory.sessionId);
        setMessages(chatHistory.messages);
      } else {
        // Create new session
        createSessionMutation.mutate(currentVibe);
        // Add welcome message
        if (vibeConfig.welcomeMessage) {
          setMessages([{
            id: 0,
            sessionId: 0,
            sender: 'armo',
            content: vibeConfig.welcomeMessage,
            createdAt: new Date().toISOString()
          }]);
        }
      }
    }
  }, [chatHistory, currentVibe]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = (content: string) => {
    if (sessionId && (content.trim() || stagedFiles.length > 0)) {
      sendMessageMutation.mutate({ 
        sessionId, 
        content: content || "What do you see in this image?",
        attachments: stagedFiles.length > 0 ? stagedFiles : undefined
      });
    }
  };

  const handleVoiceToggle = () => {
    // TODO: Implement voice functionality
    console.log('Voice toggle');
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Add file to staging area immediately
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const stagedFile: StagedFile = {
        id: fileId,
        file: file
      };
      
      setStagedFiles(prev => [...prev, stagedFile]);

      // Upload file in background
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('File uploaded successfully:', result.file);
        
        // Update the staged file with upload data
        setStagedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  uploadedData: {
                    filename: result.file.filename,
                    originalName: result.file.originalName,
                    mimetype: result.file.mimetype,
                    size: result.file.size,
                    url: `/api/files/${result.file.filename}`
                  }
                }
              : f
          )
        );
      } else {
        console.error('File upload failed:', result.error);
        // Remove failed file from staging
        setStagedFiles(prev => prev.filter(f => f.id !== fileId));
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const removeStagedFile = (fileId: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file: File) => {
    // Only images are allowed now
    return <Image size={16} />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Chat Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`flex items-center justify-between border-b border-gray-600/20 backdrop-blur ${isMobile ? 'p-3' : 'p-4'}`}
        style={{ 
          background: '#3a3a3a',
          boxShadow: '0 4px 8px #323232'
        }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onBackToLobby}
            className={`rounded-lg transition-all duration-200 ${isMobile ? 'p-1.5' : 'p-2'}`}
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
          >
            <ArrowLeft size={isMobile ? 16 : 20} className="text-white" />
          </button>
          <div className="flex-1 text-center">
            <h1 className={`font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-400 bg-clip-text text-transparent ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {vibeConfig.title}
            </h1>
            <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>{vibeConfig.subtitle}</p>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto space-y-4 pb-40 chat-messages ${isMobile ? 'p-3' : 'p-6'}`} style={{ background: '#3a3a3a' }}>
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <StreamingMessage
                key={message.id}
                content={message.content}
                sender={message.sender}
                createdAt={message.createdAt}
                metadata={message.metadata}
              />
            ))}
            
            {streamingMessage && (
              <StreamingMessage
                content={streamingMessage}
                sender="armo"
                isStreaming={true}
              />
            )}
            
            {sendMessageMutation.isPending && !streamingMessage && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-armo-red via-blue-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">Հ</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm p-4" style={{
                  background: 'white',
                  boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
                }}>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* LOCKED INPUT AREA - DO NOT MODIFY POSITIONING */}
      <div 
        className="fixed bottom-0 z-50"
        style={{
          left: isMobile ? '0' : isSidebarCollapsed ? '0' : '320px',
          right: '0',
          background: '#3a3a3a',
          borderTop: '1px solid #555',
          padding: '0'
        }}
      >
        {/* Staged Files Area */}
        {stagedFiles.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-600">
            <div className="flex flex-wrap gap-2">
              {stagedFiles.map((stagedFile) => (
                <div
                  key={stagedFile.id}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                  style={{
                    background: '#404040',
                    boxShadow: '2px 2px 4px #323232, -2px -2px 4px #484848'
                  }}
                >
                  {getFileIcon(stagedFile.file)}
                  <span className="text-sm text-white max-w-32 truncate">
                    {stagedFile.file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({(stagedFile.file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={() => removeStagedFile(stagedFile.id)}
                    className="p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <InputArea
          onSendMessage={handleSendMessage}
          onVoiceToggle={handleVoiceToggle}
          onFileUpload={handleFileUpload}
          disabled={sendMessageMutation.isPending}
          isSidebarCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
          hasStagedFiles={stagedFiles.length > 0}
        />
      </div>

      {/* Voice Call Interface Overlay */}
      {showVoiceInterface && (
        <VoiceCallInterface 
          onClose={() => setShowVoiceInterface(false)}
          currentVibe={currentVibe}
        />
      )}
    </div>
  );
}
