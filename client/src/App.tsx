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
import { AlibiWelcomeScreen } from "@/components/AlibiWelcomeScreen";
import { AlibiQuestionCards } from "@/components/AlibiQuestionCards";
import { AlibiRecapPage } from "@/components/AlibiRecapPage";
import { AlibiResultPage } from "@/components/AlibiResultPage";
import { ResumeWelcomeScreen } from "@/components/ResumeWelcomeScreen";
import { ResumeQuestionCards } from "@/components/ResumeQuestionCards";
import { ResumeRecapPage } from "@/components/ResumeRecapPage";
import { ResumeResultPage } from "@/components/ResumeResultPage";
import { CaptionQuestionCards } from "@/components/CaptionQuestionCards";
import { CaptionResultPage } from "@/components/CaptionResultPage";

type AppState = "lobby" | "chat" | "call" | "alibi-welcome" | "alibi-questions" | "alibi-recap" | "alibi-result" | "resume-welcome" | "resume-questions" | "resume-result" | "resume-recap" | "caption-questions" | "caption-result";

function App() {
  const [appState, setAppState] = useState<AppState>("lobby");
  const [currentVibe, setCurrentVibe] = useState<string>("default");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [alibiAnswers, setAlibiAnswers] = useState<string[]>([]);
  const [alibiQuestions, setAlibiQuestions] = useState<string[]>([]);
  const [resumeAnswers, setResumeAnswers] = useState<string[]>([]);
  const [resumeQuestions, setResumeQuestions] = useState<string[]>([]);
  const [captionAnswers, setCaptionAnswers] = useState<string[]>([]);
  const [captionQuestions, setCaptionQuestions] = useState<string[]>([]);

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
    } else if (vibe === "alibi") {
      setAppState("alibi-welcome");
    } else if (vibe === "hired") {
      setAppState("resume-welcome");
    } else if (vibe === "famous") {
      setAppState("caption-questions");
    } else if (vibe === "gallery" || vibe === "recent") {
      setAppState("chat"); // For now, these will use the chat interface
    } else {
      setAppState("chat");
    }
  };

  const handleSelectChat = async (sessionId: number, vibe: string) => {
    console.log('Selecting chat session:', { sessionId, vibe });
    setCurrentVibe(vibe);
    setCurrentSessionId(sessionId);
    
    // Special handling for alibi sessions - route back to result page
    if (vibe === "gimmi-alibi-ara") {
      try {
        // Fetch the session messages to get the alibi data
        const response = await fetch(`/api/chat/session/${sessionId}/messages`);
        if (response.ok) {
          const messages = await response.json();
          
          // Find the user request and AI response
          const userMessage = messages.find((m: any) => m.sender === 'user' && m.metadata?.type === 'alibi-request');
          const aiMessage = messages.find((m: any) => m.sender === 'armo' && m.metadata?.type === 'alibi-response');
          
          if (userMessage && aiMessage) {
            // Extract answers from metadata
            const answers = userMessage.metadata?.answers || [];
            const questions = [
              "Yo User, what mess are you trying to cover up?",
              "Who's breathing down your neck?",
              "Which ride-or-die partner backs your alibi?",
              "What \"totally legit\" excuse are you selling?",
              "Where were you \"definitely not\" when the chaos went down?",
              "What \"bulletproof\" evidence seals the deal?"
            ];
            
            // Set the alibi data and route to result page
            setAlibiAnswers(answers);
            setAlibiQuestions(questions);
            setAppState("alibi-result");
            return;
          }
        }
      } catch (error) {
        console.error('Error loading alibi session:', error);
      }
    }
    
    // Special handling for resume sessions - route back to result page
    if (vibe === "you-are-hired-ara") {
      try {
        // Fetch the session messages to get the resume data
        const response = await fetch(`/api/chat/session/${sessionId}/messages`);
        if (response.ok) {
          const messages = await response.json();
          
          // Find the user request and AI response
          const userMessage = messages.find((m: any) => m.sender === 'user' && m.metadata?.type === 'resume-request');
          const aiMessage = messages.find((m: any) => m.sender === 'armo' && m.metadata?.type === 'resume-response');
          
          if (userMessage && aiMessage) {
            // Extract answers from metadata
            const answers = userMessage.metadata?.answers || [];
            const questions = [
              "What's your dream job/position?",
              "What company or industry are you targeting?",
              "What are your key skills and experience?",
              "What's your biggest professional achievement?",
              "What's a weakness you've turned into a strength?",
              "What's your salary expectation?"
            ];
            
            // Set the resume data and route to result page
            setResumeAnswers(answers);
            setResumeQuestions(questions);
            setAppState("resume-result");
            return;
          }
        }
      } catch (error) {
        console.error('Error loading resume session:', error);
      }
    }
    
    // Default behavior for other vibes
    if (appState === "lobby") {
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

  const handleAlibiStart = () => {
    setAppState("alibi-questions");
  };

  const handleAlibiBack = () => {
    setAppState("lobby");
  };

  const handleAlibiComplete = (answers: string[], questions: string[]) => {
    console.log('Alibi answers:', answers);
    setAlibiAnswers(answers);
    setAlibiQuestions(questions);
    setAppState("alibi-recap");
  };

  const handleAlibiQuestionsBack = () => {
    setAppState("alibi-welcome");
  };

  const handleRecapEdit = (questionIndex: number) => {
    // Inline editing is already implemented in the recap page
    // This function might be used for future enhancements
  };

  const handleRecapBack = () => {
    setAppState("alibi-questions");
  };

  const handleRecapNext = () => {
    setAppState("alibi-result");
  };

  const handleResultBack = () => {
    setAppState("alibi-recap");
  };

  const handleResultRestart = () => {
    setAppState("alibi-welcome");
    setAlibiAnswers([]);
    setAlibiQuestions([]);
  };

  // Resume handlers
  const handleResumeStart = () => {
    setAppState("resume-questions");
  };

  const handleResumeComplete = (answers: string[], questions: string[]) => {
    console.log('Resume answers:', answers);
    setResumeAnswers(answers);
    setResumeQuestions(questions);
    setAppState("resume-recap");
  };

  const handleResumeQuestionsBack = () => {
    setAppState("resume-welcome");
  };

  const handleResumeRecapEdit = (questionIndex: number, newAnswer: string) => {
    const updatedAnswers = [...resumeAnswers];
    updatedAnswers[questionIndex] = newAnswer;
    setResumeAnswers(updatedAnswers);
  };

  const handleResumeRecapBack = () => {
    setAppState("resume-questions");
  };

  const handleResumeRecapNext = () => {
    setAppState("resume-result");
  };

  const handleResumeResultBack = () => {
    setAppState("resume-recap");
  };

  const handleResumeResultRestart = () => {
    setAppState("resume-welcome");
    setResumeAnswers([]);
    setResumeQuestions([]);
  };

  const handleCaptionComplete = (answers: string[], questions: string[]) => {
    console.log('Caption answers:', answers);
    setCaptionAnswers(answers);
    setCaptionQuestions(questions);
    setAppState("caption-result");
  };

  const handleCaptionBack = () => {
    setAppState("lobby");
  };

  const handleCaptionResultBack = () => {
    setAppState("caption-questions");
  };

  const handleCaptionResultRestart = () => {
    setAppState("caption-questions");
    setCaptionAnswers([]);
    setCaptionQuestions([]);
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(true); // Always open on mobile
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    console.log('closeMobileSidebar called, setting state to false');
    setIsMobileSidebarOpen(false);
  };

  const getPageTitle = () => {
    switch (appState) {
      case "lobby":
        return "Armo Lobby";
      case "chat":
        if (currentVibe === "default") return "Armo Lobby";
        if (currentVibe === "roast") return "Smoke & Roast";
        if (currentVibe === "therapy") return "Therapy Session";
        if (currentVibe === "famous") return "Make Me Famous";
        if (currentVibe === "job") return "You Are Hired";
        return "Armo Lobby";
      case "call":
        return "Call Hopar";
      case "alibi-welcome":
      case "alibi-questions":
      case "alibi-recap":
      case "alibi-result":
        return "Gimmi Alibi Ara";
      case "resume-welcome":
      case "resume-questions":
      case "resume-result":
      case "resume-recap":
        return "Your Hired Ara";
      case "caption-questions":
      case "caption-result":
        return "Make Me Famous Ara";
      default:
        return "Armo Lobby";
    }
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
            <button
              onClick={() => {
                console.log('Circle button clicked, opening sidebar');
                handleSidebarToggle();
              }}
              className="absolute left-4 w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer"
              style={{ background: "#2e2e2e" }}
            >
              <div className="w-3 h-3 rounded-full bg-white"></div>
            </button>
            <div className="text-white font-bold text-lg">{getPageTitle()}</div>
          </div>

          {/* Mobile Overlay */}
          <div
            className={`mobile-overlay ${isMobileSidebarOpen ? "show" : ""}`}
            onClick={closeMobileSidebar}
          />

          {/* Sidebar */}
          <div
            className={`sidebar transition-all duration-300 ${isMobile ? (isMobileSidebarOpen ? "open" : "") : isSidebarCollapsed ? "w-16" : "w-80"}`}
            data-mobile={isMobile}
            data-mobile-open={isMobileSidebarOpen}
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
              onMobileClose={closeMobileSidebar}
              isMobileSidebarOpen={isMobileSidebarOpen}
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

            {appState === "alibi-welcome" && (
              <AlibiWelcomeScreen
                onStart={handleAlibiStart}
              />
            )}

            {appState === "alibi-questions" && (
              <AlibiQuestionCards
                onComplete={handleAlibiComplete}
                onBack={handleAlibiQuestionsBack}
              />
            )}

            {appState === "alibi-recap" && (
              <AlibiRecapPage
                questions={alibiQuestions}
                answers={alibiAnswers}
                onEdit={handleRecapEdit}
                onBack={handleRecapBack}
                onNext={handleRecapNext}
                username="User"
              />
            )}

            {appState === "alibi-result" && (
              <AlibiResultPage
                questions={alibiQuestions}
                answers={alibiAnswers}
                onBack={handleResultBack}
                onRestart={handleResultRestart}
                username="User"
              />
            )}

            {appState === "resume-welcome" && (
              <ResumeWelcomeScreen
                onStart={handleResumeStart}
                onBack={handleBackToLobby}
              />
            )}

            {appState === "resume-questions" && (
              <ResumeQuestionCards
                onComplete={handleResumeComplete}
                onBack={handleResumeQuestionsBack}
              />
            )}

            {appState === "resume-recap" && (
              <ResumeRecapPage
                questions={resumeQuestions}
                answers={resumeAnswers}
                onEdit={handleResumeRecapEdit}
                onBack={handleResumeRecapBack}
                onNext={handleResumeRecapNext}
                username="User"
              />
            )}

            {appState === "resume-result" && (
              <ResumeResultPage
                questions={resumeQuestions}
                answers={resumeAnswers}
                onBack={handleResumeResultBack}
                onRestart={handleResumeResultRestart}
                username="User"
              />
            )}

            {appState === "caption-questions" && (
              <CaptionQuestionCards
                onComplete={handleCaptionComplete}
                onBack={handleCaptionBack}
                username="User"
              />
            )}

            {appState === "caption-result" && (
              <CaptionResultPage
                questions={captionQuestions}
                answers={captionAnswers}
                onBack={handleCaptionResultBack}
                onRestart={handleCaptionResultRestart}
                username="User"
              />
            )}
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
