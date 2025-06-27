import { motion } from "framer-motion";
import { AnimatedButton } from "./AnimatedButton";

interface AlibiWelcomeScreenProps {
  onStart: () => void;
}

export function AlibiWelcomeScreen({ onStart }: AlibiWelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 mobile-content-padding" style={{ background: "#3a3a3a" }}>
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
            <h1 className="text-4xl lg:text-6xl font-bold mb-2 text-white">
              &lt;code&gt;
            </h1>
            <h2 className="text-3xl lg:text-5xl font-bold mb-2 text-white">
              GimmiAlibiAra
            </h2>
            <h3 className="text-4xl lg:text-6xl font-bold text-white">
              &lt;/code&gt;
            </h3>
          </div>

          {/* Description Text */}
          <div className="text-center">
            <p className="text-white text-lg lg:text-xl leading-relaxed font-medium">
              You've summoned Armo Hopar's Alibi Maker.<br />
              Time to cook up a cover story so wild<br />
              even your landlord will believe it.<br />
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