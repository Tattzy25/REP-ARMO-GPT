import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Download, Share2, User, Maximize2, Copy, Loader2 } from 'lucide-react';

interface AlibiResultPageProps {
  questions: string[];
  answers: string[];
  onBack: () => void;
  onRestart: () => void;
}

export function AlibiResultPage({ questions, answers, onBack, onRestart }: AlibiResultPageProps) {
  const [alibiStory, setAlibiStory] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    generateAlibiStory();
  }, []);

  const generateAlibiStory = async () => {
    setIsGenerating(true);
    try {
      // Create a comprehensive prompt with all the user's answers
      const alibiContext = `
User needs a complete alibi story. Here are their answers:
1. What they got in trouble for: "${answers[0] || "unknown situation"}"
2. Who is investigating them: "${answers[1] || "someone"}"
3. Their alibi partner: "${answers[2] || "no one reliable"}"
4. Their excuse: "${answers[3] || "no excuse"}"
5. Where they claim to have been: "${answers[4] || "nowhere specific"}"
6. Their evidence: "${answers[5] || "no evidence"}"

Generate a complete, detailed alibi story that weaves all these elements together into a believable narrative. Make it sound like Armo Hopar wrote it - witty, slightly edgy, but practical. Include specific details and make it sound convincing. The story should be 3-4 paragraphs long.
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: alibiContext,
          vibe: "roast",
          sessionId: Date.now() // Temporary session for alibi generation
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlibiStory(data.response || "Hopar couldn't craft your alibi right now. Try again later!");
      } else {
        throw new Error('Failed to generate alibi');
      }
    } catch (error) {
      console.error('Error generating alibi:', error);
      setAlibiStory("Something went wrong while crafting your alibi. Hopar's creativity machine needs a reboot!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(alibiStory);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([alibiStory], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'my-alibi.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Alibi',
          text: alibiStory,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopy();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "#3a3a3a" }}>
      <div className="w-full max-w-4xl flex flex-col items-center">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div 
            className="px-8 py-4 rounded-2xl"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            <h1 className="text-2xl lg:text-3xl font-bold text-white text-center">
              <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                Hopar Got You<br />Here Is Your Alibi
              </span>
            </h1>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-3xl mb-8"
        >
          <div 
            className="rounded-2xl p-8 lg:p-12 relative"
            style={{
              background: '#3a3a3a',
              boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
            }}
          >
            {/* Back Arrow - Desktop */}
            <button
              onClick={onBack}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full text-white hover:scale-110 transition-all duration-200 hidden md:block"
              style={{
                background: '#3a3a3a',
                boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            
            {/* Restart Arrow - Desktop */}
            <button
              onClick={onRestart}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full text-white hover:scale-110 transition-all duration-200 hidden md:block"
              style={{
                background: '#3a3a3a',
                boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
              }}
            >
              <RotateCcw size={24} />
            </button>

            {/* Alibi Story Content */}
            <div className="mx-4 md:mx-12">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                  <p className="text-white text-lg">Hopar is crafting your perfect alibi...</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`prose prose-invert max-w-none ${isExpanded ? '' : 'max-h-96 overflow-hidden'}`}
                >
                  <div 
                    className="p-6 rounded-xl text-gray-100 leading-relaxed whitespace-pre-wrap"
                    style={{
                      background: '#2a2a2a',
                      boxShadow: 'inset 6px 6px 12px #222222, inset -6px -6px 12px #323232'
                    }}
                  >
                    {alibiStory}
                  </div>
                  
                  {alibiStory.length > 500 && (
                    <button
                      onClick={toggleExpanded}
                      className="mt-4 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-4"
        >
          <button
            onClick={onRestart}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Restart"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Download"
          >
            <Download size={24} />
          </button>
          
          <button
            onClick={handleShare}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Share"
          >
            <Share2 size={24} />
          </button>
          
          <button
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Profile"
          >
            <User size={24} />
          </button>
          
          <button
            onClick={toggleExpanded}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Expand"
          >
            <Maximize2 size={24} />
          </button>
          
          <button
            onClick={handleCopy}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
            title="Copy"
          >
            <Copy size={24} />
          </button>
        </motion.div>

        {/* Mobile Navigation Arrows */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex md:hidden gap-6"
        >
          <button
            onClick={onBack}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            <ArrowLeft size={24} />
          </button>
          
          <button
            onClick={onRestart}
            className="p-4 rounded-xl text-white hover:scale-110 transition-all duration-200"
            style={{
              background: '#3a3a3a',
              boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
            }}
          >
            <RotateCcw size={24} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}