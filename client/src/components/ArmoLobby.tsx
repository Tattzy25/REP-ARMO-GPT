import { motion } from "framer-motion";
import { vibeConfigs } from "@/lib/vibes";

interface ArmoLobbyProps {
  onSelectVibe: (vibe: string) => void;
}

export default function ArmoLobby({ onSelectVibe }: ArmoLobbyProps) {
  const features = Object.values(vibeConfigs);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-4xl rounded-2xl p-8" style={{ 
        background: '#3a3a3a',
        boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-blue-500 to-orange-500 glow-animation">
            Բարի գալուստ!
          </h1>
          <p className="text-2xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-blue-500 to-orange-500">Welcome to Armo-GPT</p>
          <p className="text-lg text-gray-300">Your chaotic Armenian AI companion is ready to serve</p>
        </motion.div>

        {/* Character Animation Area */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 relative"
        >
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-armo-red via-blue-500 to-orange-400 flex items-center justify-center text-6xl pulse-slow" style={{
            boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
          }}>
            🤖
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full" style={{
            background: '#404040',
            boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
          }}>
            <span className="text-sm text-neon-cyan">Armo Hopar</span>
          </div>
        </motion.div>

        {/* Feature Selection Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
        >
          {features.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectVibe(feature.id)}
              className="group p-6 rounded-2xl transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)',
                boxShadow: '8px 8px 16px #323232, -8px -8px 16px #484848'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '8px 8px 16px #323232, -8px -8px 16px #484848, 0 0 8px rgba(255, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '8px 8px 16px #323232, -8px -8px 16px #484848';
              }}
            >
              <div className="text-4xl mb-3 group-hover:bounce-slow">{feature.emoji}</div>
              <h3 className="font-bold text-lg mb-1 text-white">{feature.title.split(' ')[0]}</h3>
              <p className="text-xs text-gray-200">{feature.subtitle.split(' ').slice(0, 2).join(' ')}</p>
            </motion.button>
          ))}
        </motion.div>

        <p className="text-sm text-gray-300">Click any feature above to start chatting with Armo Hopar</p>
      </div>
    </div>
  );
}
