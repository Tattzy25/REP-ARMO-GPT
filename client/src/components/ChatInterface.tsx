import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Volume2, Share2, ArrowLeft } from "lucide-react";
import { chatApi, type ChatMessage } from "@/lib/api";
import { vibeConfigs } from "@/lib/vibes";
import StreamingMessage from "./StreamingMessage";
import InputArea from "./InputArea";

interface ChatInterfaceProps {
  currentVibe: string;
  onBackToLobby: () => void;
  isSidebarCollapsed?: boolean;
  isMobile?: boolean;
}

export default function ChatInterface({ currentVibe, onBackToLobby, isSidebarCollapsed = false, isMobile = false }: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
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
    mutationFn: ({ sessionId, content, metadata }: { sessionId: number; content: string; metadata?: any }) => {
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
          }, 500); // Small delay to let streaming animation finish smoothly
        },
        // onUserMessage - add user message immediately
        (userMessage: ChatMessage) => {
          setMessages(prev => [...prev, userMessage]);
        }
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
    if (sessionId) {
      sendMessageMutation.mutate({ sessionId, content });
    }
  };

  const handleVoiceToggle = () => {
    // TODO: Implement voice functionality
    console.log('Voice toggle');
  };

  const handleFileUpload = async (file: File) => {
    try {
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
        
        // Just log the successful upload, don't automatically send a message
        console.log(`File "${result.file.originalName}" ready for sharing in chat`);
        // User can manually mention the file in their next message if needed
      } else {
        console.error('File upload failed:', result.error);
      }
    } catch (error) {
      console.error('File upload error:', error);
    }
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
        <InputArea
          onSendMessage={handleSendMessage}
          onVoiceToggle={handleVoiceToggle}
          onFileUpload={handleFileUpload}
          disabled={sendMessageMutation.isPending}
          isSidebarCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
