import React, { useState } from 'react';
import { ResumeQuestionCards } from './ResumeQuestionCards';
import { ResumeRecapPage } from './ResumeRecapPage';

interface ResumeResultPageProps {
  onBack: () => void;
  onRestart: () => void;
  username?: string;
}

export function ResumeResultPage({ onBack, onRestart, username = "[Your Name]" }: ResumeResultPageProps) {
  const [showQuestions, setShowQuestions] = useState(true);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);

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
    onRestart();
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