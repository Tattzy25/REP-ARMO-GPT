import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { QuestionBubble } from "./QuestionBubble";

interface ResumeQuestionCardsProps {
  onComplete: (answers: string[], questions: string[]) => void;
  onBack: () => void;
  username?: string;
}

const getPersonalizedQuestions = (username: string = "[Your Name]") => [
  `Yo ${username}, what's the dream job you're gunning for?`,
  `What company or industry are you trying to break into?`,
  `What skills or experience are you flexing on your resume?`,
  `What's your biggest professional achievement that makes you shine?`,
  `What's one weakness you can spin into a strength?`,
  `What salary range are you aiming for, king/queen?`
];

export function ResumeQuestionCards({ onComplete, onBack, username = "[Your Name]" }: ResumeQuestionCardsProps) {
  const questions = getPersonalizedQuestions(username);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""));
  const [showJokePopup, setShowJokePopup] = useState(false);
  const [jokeContent, setJokeContent] = useState("");

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
        setJokeContent("Hopar's roast machine is taking a coffee break! ☕");
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
        contextPrompt = `Someone is looking for a job. They want to work as "${userAnswers[0] || "something vague"}" at "${userAnswers[1] || "somewhere mysterious"}", and they're bragging about "${userAnswers[2] || "nothing impressive"}". Roast their job search approach in 1-2 sentences without repeating their exact words. Make it witty and Armenian-style humor with career advice.`;
      } else { // After question 6  
        contextPrompt = `This job seeker's biggest achievement is "${userAnswers[3] || "something weak"}", their weakness is "${userAnswers[4] || "something concerning"}", and they want to make "${userAnswers[5] || "unrealistic money"}". Roast their career expectations in 1-2 sentences without repeating their exact words. Make it witty and Armenian-style humor with brutal honesty.`;
      }

      const response = await fetch('/api/joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          prompt: contextPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate joke');
      }

      const data = await response.json();
      return data.joke || "Hopar's wit is temporarily offline!";
    } catch (error) {
      console.error('Error generating joke:', error);
      throw error;
    }
  };

  const currentAnswer = answers[currentQuestion];
  const validation = validateAnswer(currentAnswer);
  const isValid = validation.isValid;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#3a3a3a" }}>
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
                    Give me at least 3 words (15+ characters) so Hopar can craft your perfect resume.
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
        <div className="flex items-center justify-center gap-8 mb-8">
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

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!isValid}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
              isValid ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              background: '#3a3a3a',
              boxShadow: isValid 
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
                      ? 'bg-purple-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Completion Button (only on last question) */}
        {currentQuestion === questions.length - 1 && isValid && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleNext}
            className="mt-8 px-8 py-4 rounded-xl text-white font-semibold text-lg hover:scale-105 transition-transform duration-200"
            style={{
              background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            Generate My Professional Resume
          </motion.button>
        )}
        </div>
      </div>

      {/* Joke Popup */}
      {showJokePopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-lg w-full rounded-2xl p-6 text-center"
            style={{
              background: '#3a3a3a'
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">🔥 Hopar's Take</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">{jokeContent}</p>
            <button
              onClick={handleContinueFromJoke}
              className="px-6 py-3 rounded-lg text-white font-semibold hover:scale-105 transition-transform duration-200"
              style={{
                background: '#3a3a3a',
                boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '8px 8px 16px #323232, -8px -8px 16px #484848, 0 0 20px rgba(147, 51, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '8px 8px 16px #323232, -8px -8px 16px #484848';
              }}
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}