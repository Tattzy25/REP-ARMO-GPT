import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QuestionBubble } from "./QuestionBubble";

interface AlibiQuestionCardsProps {
  onComplete: (answers: string[]) => void;
  onBack: () => void;
  username?: string;
}

const getPersonalizedQuestions = (username: string = "hopar") => [
  `Yo ${username}, what mess are you trying to cover up?`,
  `Who's breathing down your neck, ${username}?`,
  `Which ride-or-die partner backs your alibi, ${username}?`,
  `What "totally legit" excuse are you selling, ${username}?`,
  `Where were you "definitely not" when the chaos went down, ${username}?`,
  `What "bulletproof" evidence seals the deal, ${username}?`
];

export function AlibiQuestionCards({ onComplete, onBack, username = "hopar" }: AlibiQuestionCardsProps) {
  const questions = getPersonalizedQuestions(username);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""));

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, proceed to completion
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      onBack();
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = answers[currentQuestion].trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "#3a3a3a" }}>
      <div className="w-full max-w-4xl flex flex-col items-center">
        
        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl mb-8"
        >
          <div 
            className="rounded-2xl p-8 lg:p-12"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            {/* Question Bubble */}
            <div className="mb-8 flex justify-center">
              <QuestionBubble question={questions[currentQuestion]} />
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              <textarea
                value={answers[currentQuestion]}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-32 p-4 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  background: '#2e2e2e',
                  boxShadow: 'inset 8px 8px 16px #262626, inset -8px -8px 16px #363636'
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full max-w-2xl mb-8">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            className="w-16 h-16 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Question Counter */}
          <div className="text-white text-lg font-semibold">
            {currentQuestion + 1} / {questions.length}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
              canProceed ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              background: '#3a3a3a',
              boxShadow: canProceed 
                ? '8px 8px 16px #323232, -8px -8px 16px #484848'
                : 'inset 4px 4px 8px #323232, inset -4px -4px 8px #484848'
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md">
          <div
            className="h-12 rounded-full flex items-center justify-center px-6"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            <div className="flex space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    index <= currentQuestion
                      ? 'bg-gradient-to-r from-red-500 via-blue-500 to-orange-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Completion Button (only on last question) */}
        {isLastQuestion && canProceed && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onComplete(answers)}
            className="mt-6 px-8 py-3 rounded-xl text-white font-semibold hover:scale-105 transition-transform duration-200"
            style={{
              background: 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            Generate My Alibi
          </motion.button>
        )}
      </div>
    </div>
  );
}