import { motion } from "framer-motion";
import { AnimatedButton } from "./AnimatedButton";
import { ArrowLeft } from "lucide-react";

interface ResumeWelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
}

export function ResumeWelcomeScreen({ onStart, onBack }: ResumeWelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 mobile-content-padding" style={{ background: "#3a3a3a" }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-20 p-3 rounded-full transition-colors duration-200"
        style={{
          background: '#3a3a3a',
          boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8844)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#3a3a3a';
        }}
      >
        <ArrowLeft className="h-6 w-6 text-white" />
      </button>
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Main Content Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-8 lg:p-12 max-w-2xl"
          style={{
            background: '#3a3a3a',
            boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
          }}
        >
          {/* Title with gradient text */}
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-6xl font-bold mb-2">
              <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                &lt;code&gt;
              </span>
            </h1>
            <h2 className="text-3xl lg:text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                YourHiredAra
              </span>
            </h2>
            <h3 className="text-4xl lg:text-6xl font-bold">
              <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                &lt;/code&gt;
              </span>
            </h3>
          </div>

          {/* Description Text */}
          <div className="text-center">
            <p className="text-white text-lg lg:text-xl leading-relaxed font-medium">
              You've activated Armo Hopar's Career Maker.<br />
              Time to craft a resume so fire<br />
              even the CEO will slide into your DMs.<br />
              Ready? Hit "Let's Roll."
            </p>
          </div>
        </motion.div>

        {/* Animated Start Button */}
        <div className="flex justify-center mt-8 lg:mt-0">
          <AnimatedButton onClick={onStart} />
        </div>
      </div>
    </div>
  );
}