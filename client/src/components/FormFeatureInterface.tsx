import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Download, Share, User, Maximize2, Copy } from 'lucide-react';

// Question configurations for each feature
const FEATURE_QUESTIONS = {
  alibi: [
    {
      id: 'mess',
      question: 'What mess are you trying to cover up?',
      placeholder: 'e.g. ghosting my rent payment, ditching work for a concert'
    },
    {
      id: 'watcher',
      question: "Who's breathing down your neck?",
      placeholder: 'e.g. my landlord with a wrench, angry Karen at HR'
    },
    {
      id: 'partner',
      question: 'Which ride-or-die partner backs your alibi?',
      placeholder: 'e.g. my cousin Vinny, my imaginary shark trainer'
    },
    {
      id: 'excuse',
      question: 'What "totally legit" excuse are you selling?',
      placeholder: 'e.g. testing a jetpack prototype, judging a snail race'
    },
    {
      id: 'location',
      question: 'Where were you "definitely not" when the chaos went down?',
      placeholder: 'e.g. deep-dive in Area 51, chilling at that Vegas penthouse'
    },
    {
      id: 'evidence',
      question: 'What "bulletproof" evidence seals the deal?',
      placeholder: 'e.g. timestamped llama selfie, signed witness statement from a squirrel'
    }
  ],
  famous: [
    {
      id: 'talent',
      question: 'What jaw-dropping talent are you unleashing?',
      placeholder: 'e.g. belting opera mid-backflip, painting portraits blindfolded'
    },
    {
      id: 'badge',
      question: 'What fame badge are you chasing?',
      placeholder: 'e.g. viral TikTok dance, moon-discovered pink comet, world\'s best pizza'
    },
    {
      id: 'bigshot',
      question: "Who's the big-shot you gotta impress?",
      placeholder: 'e.g. Beyoncé, The Rock, Tony Stark'
    },
    {
      id: 'stunt',
      question: 'Which insane stunt will break the internet?',
      placeholder: 'e.g. skydiving into the Super Bowl, eating 100 hot dogs live'
    },
    {
      id: 'line',
      question: "What line won't you cross, even for clout?",
      placeholder: 'e.g. posing naked with jellyfish, selling your best friend'
    },
    {
      id: 'stagename',
      question: 'Your legendary stage name?',
      placeholder: 'e.g. DJ Thunderbolt, The Chocolate Queen, Captain Quirk'
    },
    {
      id: 'catchphrase',
      question: 'Your power catchphrase or hashtag?',
      placeholder: 'e.g. #YOLOChamp, I came, I sang, I slayed, Stay weird!'
    }
  ],
  hired: [
    {
      id: 'skill',
      question: 'What kick-ass skill makes you tick?',
      placeholder: 'e.g. demolishing pizza slices, owning Mario Kart, color-coding chaos'
    },
    {
      id: 'soulsucker',
      question: 'What soul-sucking task would make you nope right out?',
      placeholder: 'e.g. dawn-alarm calls, wrestling spiders, wearing neckties'
    },
    {
      id: 'title',
      question: 'If you could pick any ridiculous title, what would it be?',
      placeholder: 'e.g. Supreme Taco Taster, Meme Overlord, Chief Unicorn Wrangler'
    },
    {
      id: 'hq',
      question: "Where's your dream HQ?",
      placeholder: 'e.g. hammock on a private beach, Mars colony lobby, Willy Wonka\'s chocolate room'
    },
    {
      id: 'boss',
      question: "Who's the boss or sidekick you'd actually survive with?",
      placeholder: 'e.g. Batman, Elon Musk, my grandma (she\'s tough)'
    },
    {
      id: 'perk',
      question: 'What perk would make you swoon every morning?',
      placeholder: 'e.g. endless free tacos, daily nap pods, company jet for pet goldfish'
    }
  ]
};

interface FormFeatureInterfaceProps {
  featureId: 'alibi' | 'famous' | 'hired';
  onBack: () => void;
}

interface AnimatedStartButtonProps {
  onClick: () => void;
  children: string;
}

// Animated Start Button Component
function AnimatedStartButton({ onClick, children }: AnimatedStartButtonProps) {
  return (
    <div className="flex justify-center items-center">
      <button 
        className="animated-start-button relative cursor-pointer border-none flex items-center justify-center 
                   transition-all duration-300 min-w-[200px] p-5 h-[68px] 
                   font-semibold text-lg text-white rounded-[14px]
                   bg-[#2e2e2e] hover:scale-105 focus:scale-100
                   shadow-[0_0.5px_0.5px_1px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.2),0_4px_5px_0px_rgba(0,0,0,0.05)]
                   hover:shadow-[0_0_1px_2px_rgba(255,255,255,0.3),0_15px_30px_rgba(0,0,0,0.3),0_10px_3px_-3px_rgba(0,0,0,0.04)]"
        onClick={onClick}
      >
        <span className="relative z-10 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="1em" width="1em" className="opacity-80">
            <path fill="currentColor" d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63Z" />
          </svg>
          {children}
        </span>
      </button>
    </div>
  );
}

export default function FormFeatureInterface({ featureId, onBack }: FormFeatureInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro, 1-n = questions, n+1 = results
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const questions = FEATURE_QUESTIONS[featureId];
  const totalSteps = questions.length + 2; // intro + questions + results
  
  const featureTitles = {
    alibi: 'Give Me an Alibi Ara',
    famous: 'Make Me Famous Ara',
    hired: 'You Are Hired Ara'
  };

  const featureColors = {
    alibi: 'from-red-500 to-blue-500',
    famous: 'from-pink-500 to-purple-500',
    hired: 'from-blue-500 to-green-500'
  };

  // Introduction screen
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-[#bbbbbb] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Back button */}
          <button
            onClick={onBack}
            className="mb-8 p-3 rounded-full bg-[#2e2e2e] text-white hover:bg-[#3a3a3a] 
                       transition-colors shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Feature title */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl font-bold bg-gradient-to-r ${featureColors[featureId]} bg-clip-text text-transparent mb-4`}>
              {featureTitles[featureId]}
            </h1>
          </div>

          {/* Introduction card */}
          <div className="bg-[#3a3a3a] rounded-3xl p-8 mb-8 text-center text-white
                         shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]">
            <p className="text-lg leading-relaxed mb-6">
              This screen would be the introduction screen, the very first screen we would 
              briefly explain how this is going to work. The user has the option to either 
              click back and leave or click start and continue.
            </p>
            <div className="text-sm opacity-80">
              {featureId === 'alibi' && "I'll help you craft the perfect alibi story with savage edge and attitude."}
              {featureId === 'famous' && "I'll create viral captions and hashtags to make you Instagram famous."}
              {featureId === 'hired' && "I'll build you a killer resume that gets you hired with edgy humor."}
            </div>
          </div>

          {/* Start button */}
          <AnimatedStartButton onClick={() => setCurrentStep(1)}>
            Start Adventure
          </AnimatedStartButton>
        </div>
      </div>
    );
  }

  // Questions screen
  if (currentStep >= 1 && currentStep <= questions.length) {
    const questionIndex = currentStep - 1;
    const question = questions[questionIndex];
    const progress = (currentStep / totalSteps) * 100;

    return (
      <div className="min-h-screen bg-[#bbbbbb] flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Navigation arrows */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              className="p-4 rounded-full bg-[#2e2e2e] text-white hover:bg-[#3a3a3a] 
                         transition-colors shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <button
              onClick={() => {
                if (currentStep < questions.length) {
                  setCurrentStep(currentStep + 1);
                } else {
                  // Generate results
                  handleGenerateResults();
                }
              }}
              disabled={!answers[question.id]?.trim()}
              className="p-4 rounded-full bg-[#2e2e2e] text-white hover:bg-[#3a3a3a] 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Question card */}
          <div className="bg-[#3a3a3a] rounded-3xl p-8 mb-8 text-center
                         shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]">
            {/* Question bubble */}
            <div className="bg-[#2e2e2e] rounded-2xl p-6 mb-6 text-white">
              <h2 className="text-xl font-semibold mb-2">
                {question.question}
              </h2>
            </div>

            {/* Answer input */}
            <div className="bg-[#4a4a4a] rounded-2xl p-4 mb-4">
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                placeholder={question.placeholder}
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none h-24 
                          border-none outline-none text-lg"
                autoFocus
              />
            </div>

            {/* Edit note */}
            <p className="text-sm text-gray-300">
              In this area, we would have the questions and user answers. With available edit 
              options if the user wants to change an answer they wouldn't need to go back.
            </p>
          </div>

          {/* Progress bar */}
          <div className="bg-[#2e2e2e] rounded-full h-3 mb-4 shadow-inner">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${featureColors[featureId]} transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-center text-sm text-gray-600">
            Question {currentStep} of {questions.length}
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  return (
    <div className="min-h-screen bg-[#bbbbbb] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Back button */}
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          className="mb-8 p-3 rounded-full bg-[#2e2e2e] text-white hover:bg-[#3a3a3a] 
                     transition-colors shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Results header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold bg-gradient-to-r ${featureColors[featureId]} bg-clip-text text-transparent`}>
            {featureId === 'alibi' && 'Hopar Got You - Here is Your Alibi'}
            {featureId === 'famous' && 'Hopar Gonna Make You Famous AF'}
            {featureId === 'hired' && 'You Are Hired - Here is Your Resume'}
          </h1>
        </div>

        {featureId === 'famous' ? (
          // Famous feature - Split screen layout
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Captions section */}
            <div className="bg-[#3a3a3a] rounded-3xl p-6 text-white
                           shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]">
              <h3 className="text-xl font-semibold mb-4 text-center">Captions</h3>
              <div className="bg-[#2e2e2e] rounded-2xl p-6 h-64 overflow-y-auto">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-300">Generating captions...</div>
                  </div>
                ) : results && results.success ? (
                  <div className="text-white whitespace-pre-wrap">
                    {/* Extract captions from the full content */}
                    {results.content.split('\n').slice(0, Math.ceil(results.content.split('\n').length / 2)).join('\n')}
                  </div>
                ) : (
                  <p className="text-gray-300 text-center">
                    The captions would go here that was generated with the ability to share 
                    directly to their chosen social media, or copy or regenerate with the buttons below.
                  </p>
                )}
              </div>
              <ActionButtons />
            </div>

            {/* Hashtags section */}
            <div className="bg-[#3a3a3a] rounded-3xl p-6 text-white
                           shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]">
              <h3 className="text-xl font-semibold mb-4 text-center">Hashtags</h3>
              <div className="bg-[#2e2e2e] rounded-2xl p-6 h-64 overflow-y-auto">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-300">Generating hashtags...</div>
                  </div>
                ) : results && results.success ? (
                  <div className="text-white whitespace-pre-wrap">
                    {/* Extract hashtags from the full content */}
                    {results.content.split('\n').slice(Math.ceil(results.content.split('\n').length / 2)).join('\n')}
                  </div>
                ) : (
                  <p className="text-gray-300 text-center">
                    The hashtags would go here that was generated with the ability to share 
                    directly to their chosen social media, or copy or regenerate with the buttons below.
                  </p>
                )}
              </div>
              <ActionButtons />
            </div>
          </div>
        ) : (
          // Alibi and Hired features - Single column layout
          <div className="bg-[#3a3a3a] rounded-3xl p-8 mb-8 text-white
                         shadow-[8px_8px_16px_#9f9f9f,-8px_-8px_16px_#d7d7d7]">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-semibold mb-4">
                {featureId === 'alibi' ? 'RECAP' : 'Your Complete Resume'}
              </h3>
            </div>
            
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
                  In this area, we would have the {featureId === 'alibi' ? 'questions and user answers' : 'complete resume'}. 
                  With available edit options if the user wants to change an answer they wouldn't need to 
                  go back, and {featureId === 'alibi' ? 'each question and answer should be saved during each session' : 'the resume should be formatted professionally'} 
                  just in case the user needs to go back and change an answer.
                </p>
              )}
            </div>
            
            <ActionButtons showPDF={featureId === 'hired'} />
          </div>
        )}

        {/* Regenerate button */}
        <div className="text-center">
          <button
            onClick={() => setCurrentStep(1)}
            className="px-8 py-4 bg-[#2e2e2e] text-white rounded-2xl hover:bg-[#3a3a3a] 
                       transition-colors shadow-[0_4px_8px_rgba(0,0,0,0.3)] flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" />
            Start Over
          </button>
        </div>
      </div>
    </div>
  );

  async function handleGenerateResults() {
    setIsGenerating(true);
    setCurrentStep(totalSteps - 1);
    
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
}

// Action buttons component
function ActionButtons({ showPDF = false }: { showPDF?: boolean }) {
  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button className="p-3 rounded-full bg-[#2e2e2e] hover:bg-[#4a4a4a] transition-colors">
        <RotateCcw className="w-5 h-5 text-white" />
      </button>
      {showPDF && (
        <button className="p-3 rounded-full bg-[#2e2e2e] hover:bg-[#4a4a4a] transition-colors">
          <Download className="w-5 h-5 text-white" />
        </button>
      )}
      <button className="p-3 rounded-full bg-[#2e2e2e] hover:bg-[#4a4a4a] transition-colors">
        <Share className="w-5 h-5 text-white" />
      </button>
      <button className="p-3 rounded-full bg-[#2e2e2e] hover:bg-[#4a4a4a] transition-colors">
        <User className="w-5 h-5 text-white" />
      </button>
      <button className="p-3 rounded-full bg-[#2e2e2e] hover:bg-[#4a4a4a] transition-colors">
        <Maximize2 className="w-5 h-5 text-white" />
      </button>
      <button className="p-3 rounded-full bg-[#2e2e2e] hover:bg-[#4a4a4a] transition-colors">
        <Copy className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}