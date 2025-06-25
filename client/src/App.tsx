import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ArmoLobby from "@/components/ArmoLobby";
import ChatInterface from "@/components/ChatInterface";
import CallInterface from "@/components/CallInterface";
import Sidebar from "@/components/Sidebar";

type AppState = 'lobby' | 'chat' | 'call';

function App() {
  const [appState, setAppState] = useState<AppState>('lobby');
  const [currentVibe, setCurrentVibe] = useState<string>('default');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleVibeSelect = (vibe: string) => {
    setCurrentVibe(vibe);
    if (vibe === 'lobby') {
      setAppState('lobby');
    } else if (vibe === 'call') {
      setAppState('call');
    } else if (vibe === 'gallery' || vibe === 'recent') {
      setAppState('chat'); // For now, these will use the chat interface
    } else {
      setAppState('chat');
    }
  };

  const handleBackToLobby = () => {
    setAppState('lobby');
    setCurrentVibe('default');
  };

  const handleEndCall = () => {
    setAppState('lobby');
    setCurrentVibe('default');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen w-full" style={{ background: '#3a3a3a' }}>
          
          {/* Sidebar */}
          <Sidebar
            currentVibe={currentVibe}
            onVibeSelect={handleVibeSelect}
            onSidebarToggle={setIsSidebarCollapsed}
          />

          {/* Main Content Area */}
          <div 
            className={`flex flex-col relative min-h-screen transition-all duration-300 ${
              isSidebarCollapsed ? 'ml-0' : 'ml-80'
            }`}
            style={{ background: '#3a3a3a' }}
          >
            {appState === 'lobby' && (
              <ArmoLobby onSelectVibe={handleVibeSelect} />
            )}
            
            {appState === 'chat' && (
              <ChatInterface
                currentVibe={currentVibe}
                onBackToLobby={handleBackToLobby}
              />
            )}
            
            {appState === 'call' && (
              <CallInterface onEndCall={handleEndCall} />
            )}
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
