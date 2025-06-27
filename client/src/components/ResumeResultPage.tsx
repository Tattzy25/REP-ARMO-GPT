import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResumeQuestionCards } from "./ResumeQuestionCards";
import { ResumeRecapPage } from "./ResumeRecapPage";

interface ResumeResultPageProps {
  onBack: () => void;
}

export function ResumeResultPage({ onBack }: ResumeResultPageProps) {
  const [showQuestions, setShowQuestions] = useState(true);
  const [answers, setAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);

  // Get user info from storage
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    enabled: false // We'll get this from local storage or context
  });

  const username = user?.username || localStorage.getItem('username') || "User";

  const handleQuestionsComplete = (userAnswers: string[], userQuestions: string[]) => {
    setAnswers(userAnswers);
    setQuestions(userQuestions);
    setShowQuestions(false);
  };

  const handleBackToQuestions = () => {
    setShowQuestions(true);
  };

  const handleRestart = () => {
    setAnswers([]);
    setQuestions([]);
    setShowQuestions(true);
  };

  if (showQuestions) {
    return (
      <ResumeQuestionCards
        onComplete={handleQuestionsComplete}
        onBack={onBack}
        username={username}
      />
    );
  }

  return (
    <ResumeRecapPage
      answers={answers}
      questions={questions}
      onBack={handleBackToQuestions}
      onRestart={handleRestart}
      username={username}
    />
  );
}