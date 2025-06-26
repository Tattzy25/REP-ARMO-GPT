import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Menu, X } from "lucide-react";
import ArmoLobby from "@/components/ArmoLobby";
import ChatInterface from "@/components/ChatInterface";
import CallInterface from "@/components/CallInterface";
import FormFeatureInterface from "@/components/FormFeatureInterface";
import Sidebar from "@/components/Sidebar";

type AppState = "lobby" | "chat" | "call" | "form";

function App() {
  const [appState, setAppState] = useState<AppState>("lobby");
  const [currentVibe, setCurrentVibe] = useState<string>("default");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentFeatureId, setCurrentFeatureId] = useState<'alibi' | 'famous' | 'hired' | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleVibeSelect = (vibe: string) => {
    setCurrentVibe(vibe);
    setCurrentSessionId(null); // Clear session when switching vibes
    
    if (vibe === "lobby") {
      setAppState("lobby");
    } else if (vibe === "call") {
      setAppState("call");
    } else if (vibe === "gallery" || vibe === "recent") {
      setAppState("chat"); // For now, these will use the chat interface
    } else if (vibe === "alibi" || vibe === "famous" || vibe === "hired") {
      // Form-based features
      setCurrentFeatureId(vibe as 'alibi' | 'famous' | 'hired');
      setAppState("form");
    } else {
      setAppState("chat");
    }
  };

  const handleSelectChat = (sessionId: number, vibe: string) => {
    console.log('Selecting chat session:', { sessionId, vibe });
    setCurrentVibe(vibe);
    setCurrentSessionId(sessionId);
    if (appState === "lobby") {
      setAppState("chat");
    }
  };

  const handleBackToLobby = () => {
    setAppState("lobby");
    setCurrentVibe("default");
    setCurrentFeatureId(null);
  };

  const handleEndCall = () => {
    setAppState("lobby");
    setCurrentVibe("default");
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div
          className="min-h-screen w-full relative"
          style={{ background: "#bbbbbb" }}
        >
          {/* Mobile Header */}
          <div
            className="mobile-header fixed top-0 left-0 right-0 z-50 h-16 px-4 hidden items-center justify-center relative"
            style={{
              background: "#3a3a3a",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div className="text-white font-bold text-lg">Armo-GPT</div>
            <button
              onClick={handleSidebarToggle}
              className="absolute right-4 p-2 rounded-lg text-white"
              style={{ background: "#2e2e2e" }}
            >
              {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Overlay */}
          <div
            className={`mobile-overlay ${isMobileSidebarOpen ? "show" : ""}`}
            onClick={closeMobileSidebar}
          />

          {/* Sidebar */}
          <div
            className={`sidebar transition-all duration-300 ${isMobile ? (isMobileSidebarOpen ? "open" : "") : isSidebarCollapsed ? "w-16" : "w-80"}`}
          >
            <Sidebar
              currentVibe={currentVibe}
              onVibeSelect={(vibe) => {
                handleVibeSelect(vibe);
                if (isMobile) closeMobileSidebar();
              }}
              onSidebarToggle={setIsSidebarCollapsed}
              isMobile={isMobile}
              onSelectChat={handleSelectChat}
            />
          </div>

          {/* Main Content Area */}
          <div
            className={`main-content flex flex-col relative min-h-screen transition-all duration-300 ${
              isMobile ? "pt-16" : isSidebarCollapsed ? "ml-0" : "ml-80"
            }`}
            style={{ background: "#3a3a3a" }}
          >
            {appState === "lobby" && (
              <ArmoLobby onSelectVibe={handleVibeSelect} />
            )}

            {appState === "chat" && (
              <ChatInterface
                currentVibe={currentVibe}
                onBackToLobby={handleBackToLobby}
                isSidebarCollapsed={isSidebarCollapsed}
                isMobile={isMobile}
                currentSessionId={currentSessionId}
              />
            )}

            {appState === "call" && <CallInterface onEndCall={handleEndCall} />}

            {appState === "form" && currentFeatureId && (
              <FormFeatureInterface
                featureId={currentFeatureId}
                onBack={handleBackToLobby}
              />
            )}
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
