import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QuestionBubble } from "./QuestionBubble";

interface AlibiQuestionCardsProps {
  onComplete: (answers: string[]) => void;
  onBack: () => void;
  username?: string;
}

const getPersonalizedQuestions = (username: string = "[Your Name]") => [
  `Yo ${username}, what mess are you trying to cover up?`,
  `Who's breathing down your neck, ${username}?`,
  `Which ride-or-die partner backs your alibi, ${username}?`,
  `What "totally legit" excuse are you selling, ${username}?`,
  `Where were you "definitely not" when the chaos went down, ${username}?`,
  `What "bulletproof" evidence seals the deal, ${username}?`
];

export function AlibiQuestionCards({ onComplete, onBack, username = "[Your Name]" }: AlibiQuestionCardsProps) {
  const questions = getPersonalizedQuestions(username);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""));
  const [showJokePopup, setShowJokePopup] = useState(false);
  const [jokeContent, setJokeContent] = useState("");

  const handleNext = () => {
    // Check if we should show a joke popup
    if (currentQuestion === 2 || currentQuestion === 5) { // After questions 3 and 6
      const joke = generateJoke(currentQuestion, answers);
      setJokeContent(joke);
      setShowJokePopup(true);
      
      // Auto-hide popup after 4 seconds
      setTimeout(() => {
        setShowJokePopup(false);
        // Continue to next question or complete
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          onComplete(answers);
        }
      }, 4000);
    } else if (currentQuestion < questions.length - 1) {
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

  const generateJoke = (questionIndex: number, userAnswers: string[]) => {
    if (questionIndex === 2) { // After question 3 (0-indexed)
      const mess = userAnswers[0] || "something mysterious";
      const investigator = userAnswers[1] || "someone scary";
      const partner = userAnswers[2] || "their imaginary friend";
      
      const jokes = [
        `So let me get this straight... you're in trouble for "${mess}" and "${investigator}" is hunting you down? Good thing "${partner}" has your back - nothing says "trustworthy alibi" like that combo! 😏`,
        `Ah yes, "${mess}" - truly the crime of the century! And with "${investigator}" breathing down your neck, you called in "${partner}" as your alibi? This is either genius or completely unhinged! 🤔`,
        `"${mess}" eh? Classic move! And now "${investigator}" is onto you, so you're banking on "${partner}" to save the day? This alibi is already legendary! 🎭`
      ];
      
      return jokes[Math.floor(Math.random() * jokes.length)];
    } else if (questionIndex === 5) { // After question 6 (0-indexed)
      const excuse = userAnswers[3] || "a totally believable story";
      const location = userAnswers[4] || "somewhere definitely innocent";
      const evidence = userAnswers[5] || "rock-solid proof";
      
      const jokes = [
        `Wait, wait, wait... your excuse is "${excuse}" and you were at "${location}" with "${evidence}" as proof? This alibi is so wild even I'm starting to believe it! 🤯`,
        `Let me paint this picture: "${excuse}" happened while you were at "${location}" and your evidence is "${evidence}"... you're either a criminal mastermind or completely insane! 🎨`,
        `So your grand finale is "${excuse}" at "${location}" backed by "${evidence}"? Hopar is both impressed and terrified by your creativity! 🎪`
      ];
      
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    return "";
  };

  const currentAnswer = answers[currentQuestion];
  const validation = validateAnswer(currentAnswer);
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canProceed = validation.isValid;

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
                onComplete(answers);
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
              background: '#3a3a3a',
              boxShadow: '20px 20px 40px #323232, -20px -20px 40px #484848'
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
            
            {/* Auto-close indicator */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              className="mt-4 h-1 bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}