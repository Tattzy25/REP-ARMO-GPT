import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Download, Share, Copy } from 'lucide-react';

interface FormFeatureInterfaceProps {
  featureId: 'alibi' | 'famous' | 'hired';
  onBack: () => void;
}

export function FormFeatureInterface({ featureId, onBack }: FormFeatureInterfaceProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);

  const features = {
    alibi: {
      title: "Give Me an Alibi Ara",
      welcomeText: "You've summoned Armo Hopar's Alibi Maker.\nTime to cook up a cover story so wild\neven your landlord will believe it.\nReady? Hit \"Let's Roll.\"",
      buttonText: "Let's Roll",
      questions: [
        { id: 'mess', label: 'What mess do you need to cover up?', placeholder: 'I accidentally...' },
        { id: 'watcher', label: 'Who\'s watching/questioning you?', placeholder: 'My boss, my partner...' },
        { id: 'partner', label: 'Who\'s your ride-or-die that can back you up?', placeholder: 'My best friend...' },
        { id: 'excuse', label: 'What\'s your "totally legit" excuse?', placeholder: 'I was helping my grandma...' },
        { id: 'location', label: 'Where were you "definitely not"?', placeholder: 'Definitely not at the casino...' },
        { id: 'evidence', label: 'What\'s your bulletproof evidence?', placeholder: 'I have receipts, photos...' }
      ]
    },
    famous: {
      title: "Make Me Famous Ara",
      welcomeText: "Welcome to Armo Hopar's Fame Factory.\nTime to turn your wild dreams into\nviral reality that breaks the internet.\nReady to blow up? Hit \"Make It Viral.\"",
      buttonText: "Make It Viral",
      questions: [
        { id: 'talent', label: 'What\'s your secret talent?', placeholder: 'I can sing, dance, cook...' },
        { id: 'badge', label: 'What kind of fame do you want?', placeholder: 'Viral TikTok star, Instagram influencer...' },
        { id: 'bigshot', label: 'Which celebrity do you want to impress?', placeholder: 'The Rock, Taylor Swift...' },
        { id: 'stunt', label: 'What\'s your internet-breaking stunt?', placeholder: 'Singing while skydiving...' },
        { id: 'line', label: 'What line won\'t you cross for fame?', placeholder: 'Never embarrass my family...' },
        { id: 'stagename', label: 'What\'s your stage name?', placeholder: 'DJ Awesome, The Real Deal...' },
        { id: 'catchphrase', label: 'What\'s your catchphrase/hashtag?', placeholder: '#BossMode, "Let\'s get it"...' }
      ]
    },
    hired: {
      title: "You Are Hired Ara",
      welcomeText: "Step into Armo Hopar's Career Command Center.\nTime to craft the resume that makes\nemployers fight over you like Black Friday.\nReady to get hired? Hit \"Build My Empire.\"",
      buttonText: "Build My Empire",
      questions: [
        { id: 'skill', label: 'What skill makes you unstoppable?', placeholder: 'Problem solving, creativity...' },
        { id: 'soulsucker', label: 'What task kills your soul?', placeholder: 'Paperwork, meetings...' },
        { id: 'title', label: 'What\'s your dream job title?', placeholder: 'Chief Fun Officer, Dragon Slayer...' },
        { id: 'hq', label: 'Where\'s your dream office?', placeholder: 'Beach house, space station...' },
        { id: 'boss', label: 'Who\'s your ideal boss/teammate?', placeholder: 'Someone who gets it...' },
        { id: 'perk', label: 'What perk would seal the deal?', placeholder: 'Unlimited coffee, pet-friendly...' }
      ]
    }
  };

  const currentFeature = features[featureId];
  const totalSteps = currentFeature.questions.length;

  // Handle starting the form from welcome screen
  const handleStart = () => {
    setShowWelcome(false);
  };

  // Handle form navigation
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerateResults();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setShowWelcome(true);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  async function handleGenerateResults() {
    setIsGenerating(true);
    
    try {
      const response = await fetch(`/api/form/generate/${featureId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate results');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error generating results:', error);
      setResults({ 
        success: false, 
        content: "Sorry, I couldn't generate your content right now. Please try again!",
        featureId 
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Animated start button component
  const AnimatedStartButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="relative overflow-hidden px-12 py-4 text-xl font-semibold text-white
                 bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 
                 rounded-2xl shadow-[8px_8px_16px_#1a1a1a,-8px_-8px_16px_#4a4a4a]
                 hover:shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#4a4a4a]
                 transform hover:scale-105 transition-all duration-300 ease-in-out
                 before:absolute before:inset-0 before:bg-gradient-to-r 
                 before:from-orange-500 before:via-red-500 before:to-blue-500 
                 before:opacity-0 before:transition-opacity before:duration-300
                 hover:before:opacity-20 active:scale-95"
    >
      <span className="relative z-10 bg-gradient-to-r from-red-400 via-blue-400 to-orange-400 bg-clip-text text-transparent">
        {children}
      </span>
    </button>
  );

  // Action buttons component
  const ActionButtons = ({ showPDF = false }: { showPDF?: boolean }) => (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      <button className="p-3 rounded-xl bg-[#3a3a3a] text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500 transition-all duration-300 shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#4a4a4a]">
        <Copy className="h-5 w-5" />
      </button>
      <button className="p-3 rounded-xl bg-[#3a3a3a] text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500 transition-all duration-300 shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#4a4a4a]">
        <Share className="h-5 w-5" />
      </button>
      <button className="p-3 rounded-xl bg-[#3a3a3a] text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500 transition-all duration-300 shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#4a4a4a]">
        <RotateCcw className="h-5 w-5" />
      </button>
      {showPDF && (
        <button className="p-3 rounded-xl bg-[#3a3a3a] text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500 transition-all duration-300 shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#4a4a4a]">
          <Download className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-[#bbbbbb] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="p-3 rounded-xl bg-[#3a3a3a] text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500 transition-all duration-300 shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
              {currentFeature.title}
            </h1>
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Welcome Card */}
          <div className="bg-[#3a3a3a] rounded-3xl p-16 text-center text-white shadow-[16px_16px_32px_#9f9f9f,-16px_-16px_32px_#d7d7d7]">
            <div className="text-2xl leading-relaxed font-medium mb-12 whitespace-pre-line">
              {currentFeature.welcomeText}
            </div>
            
            <AnimatedStartButton onClick={handleStart}>
              {currentFeature.buttonText}
            </AnimatedStartButton>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (results) {
    return (
      <div className="min-h-screen bg-[#bbbbbb] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setResults(null)}
              className="p-3 rounded-xl bg-[#3a3a3a] text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500 transition-all duration-300 shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
              {currentFeature.title}
            </h1>
            <div className="w-12" />
          </div>

          {/* Results Content */}
          {featureId === 'famous' ? (
            // Split screen for Make Me Famous
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Captions section */}
              <div className="bg-[#3a3a3a] rounded-3xl p-6 text-white shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]">
                <h3 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Captions
                </h3>
                <div className="bg-[#2e2e2e] rounded-2xl p-6 h-64 overflow-y-auto">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-300">Generating captions...</div>
                    </div>
                  ) : results && results.success ? (
                    <div className="text-white whitespace-pre-wrap">
                      {results.content.split('\n').slice(0, Math.ceil(results.content.split('\n').length / 2)).join('\n')}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-center">Content will appear here...</p>
                  )}
                </div>
                <ActionButtons />
              </div>

              {/* Hashtags section */}
              <div className="bg-[#3a3a3a] rounded-3xl p-6 text-white shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]">
                <h3 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                  Hashtags
                </h3>
                <div className="bg-[#2e2e2e] rounded-2xl p-6 h-64 overflow-y-auto">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-300">Generating hashtags...</div>
                    </div>
                  ) : results && results.success ? (
                    <div className="text-white whitespace-pre-wrap">
                      {results.content.split('\n').slice(Math.ceil(results.content.split('\n').length / 2)).join('\n')}
                    </div>
                  ) : (
                    <p className="text-gray-300 text-center">Content will appear here...</p>
                  )}
                </div>
                <ActionButtons />
              </div>
            </div>
          ) : (
            // Single screen for Alibi and Resume
            <div className="bg-[#3a3a3a] rounded-3xl p-8 text-white shadow-[16px_16px_32px_#9f9f9f,-16px_-16px_32px_#d7d7d7]">
              <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                {featureId === 'alibi' ? 'Your Perfect Alibi' : 'Your Dream Resume'}
              </h3>
              
              <div className="bg-[#2e2e2e] rounded-2xl p-8 min-h-[400px]">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-300">
                      Generating your {featureId === 'alibi' ? 'alibi story' : 'resume'}...
                    </div>
                  </div>
                ) : results && results.success ? (
                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                    {results.content}
                  </div>
                ) : (
                  <p className="text-gray-300 text-center leading-relaxed">
                    Content will appear here...
                  </p>
                )}
              </div>
              
              <ActionButtons showPDF={featureId === 'hired'} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Question Form Screens
  const currentQuestion = currentFeature.questions[currentStep];

  return (
    <div className="min-h-screen bg-[#bbbbbb] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handlePrevious}
            className="p-3 rounded-xl bg-[#3a3a3a] text-white hover:bg-gradient-to-r hover:from-red-500 hover:via-blue-500 hover:to-orange-500 transition-all duration-300 shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
            {currentFeature.title}
          </h1>
          <div className="w-12" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-[#9f9f9f] rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-[#3a3a3a] rounded-3xl p-8 text-white shadow-[16px_16px_32px_#9f9f9f,-16px_-16px_32px_#d7d7d7]">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {currentQuestion.label}
          </h2>
          
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="w-full h-32 p-4 bg-[#2e2e2e] border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
          />
          
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-500 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]?.trim()}
              className="px-6 py-3 bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {currentStep === totalSteps - 1 ? 'Generate!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FormFeatureInterface;