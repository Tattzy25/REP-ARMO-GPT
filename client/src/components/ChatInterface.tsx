import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ChatMessage } from "@/lib/api";
import { vibeConfigs } from "@/lib/vibes";
import StreamingMessage from "./StreamingMessage";
import InputArea from "./InputArea";

interface ChatInterfaceProps {
  currentVibe: string;
  onBackToLobby: () => void;
}

export default function ChatInterface({ currentVibe, onBackToLobby }: ChatInterfaceProps) {
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
    mutationFn: ({ sessionId, content }: { sessionId: number; content: string }) =>
      chatApi.sendMessage(sessionId, content),
    onSuccess: (response) => {
      // Add user message immediately
      setMessages(prev => [...prev, response.userMessage]);
      
      // Stream AI response
      setStreamingMessage(response.aiResponse);
      
      // After streaming completes, add the final message
      setTimeout(() => {
        setMessages(prev => [...prev, response.armoMessage]);
        setStreamingMessage(null);
      }, response.aiResponse.length * 30 + 500);
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
            createdAt: new Date()
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

  const handleFileUpload = (file: File) => {
    // TODO: Implement file upload
    console.log('File upload:', file);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Chat Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-4 border-b border-gray-600/20 backdrop-blur"
        style={{ 
          background: '#3a3a3a',
          boxShadow: '0 4px 8px #323232'
        }}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToLobby}
            className="p-2 rounded-lg transition-all duration-200"
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
            <i className="fas fa-arrow-left" style={{ color: 'white' }}></i>
          </button>
          <div>
            <h2 className="font-bold text-lg text-white">{vibeConfig.title}</h2>
            <p className="text-sm text-gray-300">{vibeConfig.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-white">Online</span>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
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

      {/* Input Area */}
      <InputArea
        onSendMessage={handleSendMessage}
        onVoiceToggle={handleVoiceToggle}
        onFileUpload={handleFileUpload}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
}
