import { motion } from "framer-motion";
import { vibeConfigs } from "@/lib/vibes";

interface ArmoLobbyProps {
  onSelectVibe: (vibe: string) => void;
}

export default function ArmoLobby({ onSelectVibe }: ArmoLobbyProps) {
  /*
   * ARMO LOBBY PAGE COLOR SPECIFICATIONS (FOR AI REFERENCE ONLY):
   * 
   * BACKGROUND COLORS:
   * - Main page background: #3a3a3a (Dark gray)
   * - Central container background: #3a3a3a (Same dark gray)
   * - Container neumorphic shadows: #323232 (darker) and #484848 (lighter)
   * 
   * TEXT COLORS:
   * - Main title "Բարի գալուստ!" and "Welcome to Armo Lobby": Red-blue-orange gradient (from-red-500 via-blue-500 to-orange-500)
   * - Subtitle "Your chaotic Armenian AI companion": text-gray-300 (Light gray)
   * - Feature button text: text-white (White)
   * 
   * BUTTON COLORS - LOCKED DO NOT CHANGE UNLESS SPECIFICALLY REQUESTED:
   * - Feature buttons background: #3a3a3a (Dark gray - neumorphic cards)
   * - Feature buttons border-radius: 24px
   * - Feature buttons shadows: inset 14px 14px 28px #313131, inset -14px -14px 28px #434343
   * - Feature buttons hover glow: 0 0 20px rgba(147, 51, 234, 0.6) (Neon purple)
   * 
   * ⚠️ CRITICAL: These feature card styles are LOCKED and must NOT be modified
   * unless the user specifically requests changes to "those cards" or "feature cards"
   * ⚠️ HOVER GLOW LOCKED: Neon purple glow effect is protected - DO NOT MODIFY
   * - Character circle background: Gradient from armo-red via blue-500 to orange-400
   * - Character name tag background: #404040
   * 
   * HEADER TITLE: Should dynamically show "Armo Lobby" when appState === "lobby"
   */
  
  // Get specific features in order: Armo-GPT first, then filtered features, then Gallery last
  const filteredFeatures = Object.values(vibeConfigs).filter(feature => 
    !feature.title.startsWith('Armo') && 
    !['lobby', 'gallery', 'recent', 'therapy', 'default'].includes(feature.id)
  );
  
  const armoGptFeature = vibeConfigs.default; // Armo-GPT is the default vibe
  const galleryFeature = vibeConfigs.gallery;
  
  const features = [armoGptFeature, ...filteredFeatures, galleryFeature];

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
          <p className="text-2xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-blue-500 to-orange-500">Welcome to Armo Lobby</p>
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
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
        >
          {/* 🔒 LOCKED: Feature card styling - DO NOT MODIFY unless user specifically requests "change those cards" */}
          {features.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectVibe(feature.id)}
              className="group p-6 transition-all duration-300"
              style={{
                borderRadius: '24px',
                background: '#3a3a3a',
                boxShadow: 'inset 14px 14px 28px #313131, inset -14px -14px 28px #434343'
              }}
              /* 🔒 LOCKED: Neon purple hover glow - DO NOT MODIFY this hover effect */
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'inset 14px 14px 28px #313131, inset -14px -14px 28px #434343, 0 0 20px rgba(147, 51, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'inset 14px 14px 28px #313131, inset -14px -14px 28px #434343';
              }}
            >
              <div className="text-4xl mb-3 group-hover:bounce-slow">{feature.emoji}</div>
              <h3 className="font-bold text-lg text-white">{feature.title}</h3>
            </motion.button>
          ))}
        </motion.div>

        <p className="text-sm text-gray-300">Click any feature above to start chatting with Armo Hopar</p>
      </div>
    </div>
  );
}
