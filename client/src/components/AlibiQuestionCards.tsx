import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { QuestionBubble } from "./QuestionBubble";

interface AlibiQuestionCardsProps {
  onComplete: (answers: string[], questions: string[]) => void;
  onBack: () => void;
  username?: string;
}

const getPersonalizedQuestions = (username: string = "[Your Name]") => [
  `Yo ${username}, what mess are you trying to cover up?`,
  `Who's breathing down your neck?`,
  `Which ride-or-die partner backs your alibi?`,
  `What "totally legit" excuse are you selling?`,
  `Where were you "definitely not" when the chaos went down?`,
  `What "bulletproof" evidence seals the deal?`
];

export function AlibiQuestionCards({ onComplete, onBack, username = "[Your Name]" }: AlibiQuestionCardsProps) {
  const questions = getPersonalizedQuestions(username);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""));
  const [showJokePopup, setShowJokePopup] = useState(false);
  const [jokeContent, setJokeContent] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleNext = async () => {
    // Check if we should show a joke popup
    if (currentQuestion === 2 || currentQuestion === 5) { // After questions 3 and 6
      setJokeContent("Generating roast..."); // Loading state
      setShowJokePopup(true);
      
      try {
        const joke = await generateJoke(currentQuestion, answers);
        setJokeContent(joke);
      } catch (error) {
        console.error('Error generating joke:', error);
        setShowJokePopup(false);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
        setShowErrorPopup(true);
      }
    } else if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, proceed to completion
      onComplete(answers, questions);
    }
  };

  const handleContinueFromJoke = () => {
    setShowJokePopup(false);
    // Continue to next question or complete
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete(answers, questions);
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

  const validateAnswer = (answer: string) => {
    const trimmed = answer.trim();
    const wordCount = trimmed.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = trimmed.length;
    
    return {
      isValid: charCount >= 15 && wordCount >= 3,
      charCount,
      wordCount,
      needsMoreChars: charCount < 15,
      needsMoreWords: wordCount < 3
    };
  };

  const generateJoke = async (questionIndex: number, userAnswers: string[]): Promise<string> => {
    try {
      let contextPrompt = "";
      if (questionIndex === 2) { // After question 3
        contextPrompt = `Someone is making an alibi. They got in trouble for: "${userAnswers[0] || "something vague"}", someone named "${userAnswers[1] || "someone mysterious"}" is after them, and "${userAnswers[2] || "nobody reliable"}" is their alibi partner. Roast this situation in 1-2 sentences without repeating their exact words. Make it witty and Armenian-style humor.`;
      } else { // After question 6  
        contextPrompt = `Someone's alibi continues: their excuse is "${userAnswers[3] || "something weak"}", they claim they were at "${userAnswers[4] || "nowhere specific"}", and their evidence is "${userAnswers[5] || "nothing solid"}". Roast how ridiculous this complete alibi is in 1-2 sentences without repeating their exact words. Make it witty and Armenian-style humor.`;
      }

      const response = await fetch('/api/joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: contextPrompt,
          answers: userAnswers.slice(0, questionIndex + 1)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.joke) {
          throw new Error('No joke content received from server');
        }
        return data.joke;
      } else {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      throw error; // Re-throw error to be handled by caller
    }
  };

  const currentAnswer = answers[currentQuestion];
  const validation = validateAnswer(currentAnswer);
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = validation.isValid;

  return (
    <div className="min-h-screen flex flex-col mobile-content-padding" style={{ background: "#3a3a3a" }}>
      {/* Desktop Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="desktop-header flex items-center justify-between border-b border-gray-600/20 backdrop-blur p-3"
        style={{ 
          background: '#3a3a3a',
          boxShadow: '0 4px 8px #323232'
        }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button
            onClick={onBack}
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
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-400 bg-clip-text text-transparent">
              Gimmi Alibi Ara
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 pt-4">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl mb-4"
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
                className={`w-full h-32 p-4 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none transition-all duration-200 ${
                  currentAnswer && !validation.isValid 
                    ? 'focus:ring-2 focus:ring-red-500 border-2 border-red-500' 
                    : 'focus:ring-2 focus:ring-blue-500'
                }`}
                style={{
                  background: '#2e2e2e',
                  boxShadow: 'inset 8px 8px 16px #262626, inset -8px -8px 16px #363636'
                }}
              />
              
              {/* Validation Message */}
              {currentAnswer && !validation.isValid && (
                <div className="text-orange-400 text-sm font-medium">
                  Give me at least 3 words (15+ characters) so Hopar can spin a good yarn.
                  <div className="text-xs text-gray-400 mt-1">
                    Current: {validation.wordCount} word{validation.wordCount !== 1 ? 's' : ''}, {validation.charCount} character{validation.charCount !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
              
              {/* Success indicator */}
              {validation.isValid && currentAnswer && (
                <div className="text-green-400 text-sm font-medium">
                  Perfect! Hopar has enough to work with ✓
                </div>
              )}
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
            onClick={() => {
              // Validate all answers before completing
              const allValid = answers.every(answer => validateAnswer(answer).isValid);
              if (allValid) {
                onComplete(answers, questions);
              }
            }}
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

      {/* Animated Joke Popup */}
      {showJokePopup && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.8)" }}
        >
          <motion.div
            initial={{ rotateX: -90 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl w-full rounded-2xl p-8 text-center"
            style={{
              background: '#2e2e2e'
            }}
          >
            {/* Hopar Avatar/Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mb-6 text-6xl"
            >
              🎭
            </motion.div>

            {/* Joke Content */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-white text-lg font-medium leading-relaxed mb-6"
            >
              {jokeContent}
            </motion.p>

            {/* Hopar Signature */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 1.2 }}
              className="text-orange-400 font-bold text-sm"
            >
              - Armo Hopar
            </motion.div>
            
            {/* Continue Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 1.5 }}
              onClick={handleContinueFromJoke}
              className="mt-6 px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: '#2e2e2e',
                boxShadow: 'inset 6px 6px 12px #252525, inset -6px -6px 12px #373737'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 6px 6px 12px #252525, inset -6px -6px 12px #373737, 0 0 20px rgba(147, 51, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'inset 6px 6px 12px #252525, inset -6px -6px 12px #373737';
              }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.8)" }}
        >
          <motion.div
            initial={{ rotateX: -90 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md w-full rounded-2xl p-8 text-center"
            style={{
              background: '#2e2e2e'
            }}
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mb-6 text-6xl"
            >
              ⚠️
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-white text-lg font-medium leading-relaxed mb-6"
            >
              <p className="mb-4">There is an issue with the system:</p>
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </motion.div>
            
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 1.0 }}
              onClick={() => setShowErrorPopup(false)}
              className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: '#2e2e2e',
                boxShadow: 'inset 6px 6px 12px #252525, inset -6px -6px 12px #373737'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 6px 6px 12px #252525, inset -6px -6px 12px #373737, 0 0 20px rgba(147, 51, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'inset 6px 6px 12px #252525, inset -6px -6px 12px #373737';
              }}
            >
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      </div>
    </div>
  );
}