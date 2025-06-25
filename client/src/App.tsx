import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Menu, X } from "lucide-react";
import ArmoLobby from "@/components/ArmoLobby";
import ChatInterface from "@/components/ChatInterface";
import CallInterface from "@/components/CallInterface";
import Sidebar from "@/components/Sidebar";

type AppState = "lobby" | "chat" | "call";

function App() {
  const [appState, setAppState] = useState<AppState>("lobby");
  const [currentVibe, setCurrentVibe] = useState<string>("default");
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
    if (vibe === "lobby") {
      setAppState("lobby");
    } else if (vibe === "call") {
      setAppState("call");
    } else if (vibe === "gallery" || vibe === "recent") {
      setAppState("chat"); // For now, these will use the chat interface
    } else {
      setAppState("chat");
    }
  };

  const handleBackToLobby = () => {
    setAppState("lobby");
    setCurrentVibe("default");
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
          {isMobile && (
            <div
              className="fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between"
              style={{
                background: "#3a3a3a",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <div className="text-white font-bold text-lg">Armo-GPT</div>
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-lg text-white"
                style={{ background: "#2e2e2e" }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                >
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </button>
            </div>
          )}

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
            />
          </div>

          {/* Main Content Area */}
          <div
            className={`main-content flex flex-col relative min-h-screen transition-all duration-300 ${
              isMobile ? "pt-16 w-full" : isSidebarCollapsed ? "ml-0" : "ml-80"
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
              />
            )}

            {appState === "call" && <CallInterface onEndCall={handleEndCall} />}
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
