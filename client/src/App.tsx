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

  const handleVibeSelect = (vibe: string) => {
    setCurrentVibe(vibe);
    if (vibe === 'lobby') {
      setAppState('lobby');
    } else if (vibe === 'call') {
      setAppState('call');
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
        <div className="h-screen bg-gradient-to-br from-armo-navy via-armo-blue to-armo-accent">
          
          {/* Sidebar */}
          <Sidebar
            currentVibe={currentVibe}
            onVibeSelect={handleVibeSelect}
          />

          {/* Main Content Area */}
          <div className="ml-80 flex flex-col relative h-full">
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
