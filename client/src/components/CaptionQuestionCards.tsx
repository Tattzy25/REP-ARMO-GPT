import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { QuestionBubble } from "./QuestionBubble";

interface CaptionQuestionCardsProps {
  onComplete: (answers: string[], questions: string[]) => void;
  onBack: () => void;
  username?: string;
}

const getPersonalizedQuestions = (username: string = "[Your Name]") => [
  `What jaw-dropping talent are you unleashing, ${username}?`,
  `What fame badge are you chasing?`,
  `Who's the big-shot you gotta impress?`,
  `Which insane stunt will break the internet?`,
  `What line won't you cross, even for clout?`,
  `Your legendary stage name?`,
  `Your power catchphrase or hashtag?`
];

const getPlaceholders = () => [
  "e.g. belting opera mid-backflip, painting portraits blindfolded",
  "e.g. viral TikTok dance, moon-discovered pink comet, world's best pizza",
  "e.g. Beyoncé, The Rock, Tony Stark",
  "e.g. skydiving into the Super Bowl, eating 100 hot dogs live",
  "e.g. posing naked with jellyfish, selling your best friend",
  "e.g. DJ Thunderbolt, The Chocolate Queen, Captain Quirk",
  "e.g. #YOLOChamp, I came, I sang, I slayed, Stay weird!"
];

export function CaptionQuestionCards({ onComplete, onBack, username = "[Your Name]" }: CaptionQuestionCardsProps) {
  const questions = getPersonalizedQuestions(username);
  const placeholders = getPlaceholders();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(""));
  const [showJokePopup, setShowJokePopup] = useState(false);
  const [jokeContent, setJokeContent] = useState("");

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
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onComplete(answers, questions);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const generateJoke = async (questionIndex: number, currentAnswers: string[]): Promise<string> => {
    try {
      const response = await fetch('/api/joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Someone wants to be famous. They have a talent: "${currentAnswers[0]}", want to achieve: "${currentAnswers[1]}", and want to impress: "${currentAnswers[2]}". Roast their fame pursuit in 1-2 sentences with Armenian-style humor.`,
          userAnswers: currentAnswers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate joke');
      }

      const data = await response.json();
      return data.joke || "Hopar's got nothing... that's suspicious! 🤔";
    } catch (error) {
      console.error('Error generating joke:', error);
      throw error;
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col pt-20" style={{ backgroundColor: '#bbbbbb' }}>
      {/* Progress Bar */}
      <div className="px-4 md:px-6 mb-6">
        <div className="w-full bg-gray-300 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pb-20">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl space-y-8"
        >
          <QuestionBubble question={questions[currentQuestion]} />
          
          {/* Answer Input */}
          <div className="space-y-4">
            <textarea
              value={answers[currentQuestion]}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={placeholders[currentQuestion]}
              className={`w-full h-32 p-4 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none transition-all duration-200 ${
                answers[currentQuestion] && !validateAnswer(answers[currentQuestion]).isValid 
                  ? 'focus:ring-2 focus:ring-red-500 border-2 border-red-500' 
                  : 'focus:ring-2 focus:ring-blue-500'
              }`}
              style={{
                background: '#2e2e2e',
                boxShadow: 'inset 8px 8px 16px #262626, inset -8px -8px 16px #363636'
              }}
            />
            
            {/* Validation Message */}
            {answers[currentQuestion] && !validateAnswer(answers[currentQuestion]).isValid && (
              <div className="text-orange-400 text-sm font-medium">
                Give me at least 3 words (15+ characters) so Hopar can craft your fame story.
                <div className="text-xs text-gray-400 mt-1">
                  Current: {validateAnswer(answers[currentQuestion]).wordCount} word{validateAnswer(answers[currentQuestion]).wordCount !== 1 ? 's' : ''}, {validateAnswer(answers[currentQuestion]).charCount} character{validateAnswer(answers[currentQuestion]).charCount !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            
            {/* Success indicator */}
            {validateAnswer(answers[currentQuestion]).isValid && (
              <div className="text-green-400 text-sm font-medium flex items-center gap-2">
                ✓ Perfect! Ready for the next step.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-10">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
            currentQuestion === 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95'
          }`}
          style={{
            background: '#3a3a3a',
            boxShadow: currentQuestion === 0 ? 'none' : '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
          }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={handleNext}
          disabled={!validateAnswer(answers[currentQuestion]).isValid}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
            !validateAnswer(answers[currentQuestion]).isValid 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95 hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500'
          }`}
          style={{
            background: validateAnswer(answers[currentQuestion]).isValid ? '#3a3a3a' : '#3a3a3a',
            boxShadow: !validateAnswer(answers[currentQuestion]).isValid ? 'none' : '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
          }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Joke Popup */}
      {showJokePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-6 rounded-2xl text-center"
            style={{
              background: '#3a3a3a',
              boxShadow: '20px 20px 40px #2e2e2e, -20px -20px 40px #464646'
            }}
          >
            <div className="text-white mb-6">
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                Hopar's Roast
              </h3>
              <p className="text-gray-300 leading-relaxed">{jokeContent}</p>
            </div>
            
            <button
              onClick={handleContinueFromJoke}
              className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: '#3a3a3a',
                boxShadow: '8px 8px 16px #2e2e2e, -8px -8px 16px #464646'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #ef4444, #3b82f6, #f97316)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3a3a3a';
              }}
            >
              Continue
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}