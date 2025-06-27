import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface AlibiWelcomeScreenProps {
  onStart: () => void;
  onBack: () => void;
}

export function AlibiWelcomeScreen({ onStart, onBack }: AlibiWelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#bbbbbb] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex items-center justify-center relative">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-[#bbbbbb] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform duration-200"
          style={{
            boxShadow: 'inset -8px -8px 16px #9f9f9f, inset 8px 8px 16px #d7d7d7'
          }}
        >
          <ArrowLeft size={24} />
        </button>

        {/* Main Content Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#bbbbbb] rounded-[40px] p-12 max-w-2xl w-full mx-16"
          style={{
            boxShadow: 'inset -20px -20px 40px #9f9f9f, inset 20px 20px 40px #d7d7d7'
          }}
        >
          {/* Title with gradient text */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold mb-2">
              <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                &lt;code&gt;
              </span>
            </h1>
            <h2 className="text-5xl font-bold mb-2">
              <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                GimmiAlibiAra
              </span>
            </h2>
            <h3 className="text-6xl font-bold">
              <span className="bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 bg-clip-text text-transparent">
                &lt;/code&gt;
              </span>
            </h3>
          </div>

          {/* Description Text */}
          <div className="text-center mb-8">
            <p className="text-white text-xl leading-relaxed font-medium">
              this screen would be the. introduction<br />
              screen. the very first screen we would<br />
              briefly explain how this is going to<br />
              work. The user has the option to either<br />
              click back and leave or click start<br />
              and. continue
            </p>
          </div>
        </motion.div>

        {/* Start Button */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#bbbbbb] rounded-[20px] px-8 py-6 text-white font-semibold text-lg min-w-[200px] hover:shadow-lg transition-all duration-300"
            style={{
              boxShadow: 'inset -12px -12px 24px #9f9f9f, inset 12px 12px 24px #d7d7d7'
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-white"
              >
                <path 
                  d="M8 5v14l11-7z" 
                  fill="currentColor"
                />
              </svg>
              <span>START</span>
            </div>
          </motion.button>
          
          <div className="mt-4 text-center">
            <p className="text-white text-sm opacity-80">
              I will provide a<br />
              animated start button<br />
              code. That will be<br />
              placed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}