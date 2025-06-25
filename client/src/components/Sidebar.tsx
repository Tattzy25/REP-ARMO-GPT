import { motion } from "framer-motion";
import { vibeConfigs } from "@/lib/vibes";

interface SidebarProps {
  currentVibe: string;
  onVibeSelect: (vibe: string) => void;
}

export default function Sidebar({ currentVibe, onVibeSelect }: SidebarProps) {
  const features = Object.values(vibeConfigs);

  return (
    <div className="w-80 border-r border-armo-accent/20 flex flex-col relative z-10" style={{background: '#2e2e2e'}}>
      {/* Header */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="p-6 border-b border-armo-accent/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          {/* Armenian flag colors accent */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-armo-red via-blue-500 to-orange-400 flex items-center justify-center neumorphic">
            <span className="text-xl font-bold">Հ</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-neon-cyan">Armo-GPT</h1>
            <p className="text-sm text-gray-400">Your Armenian AI Hopar</p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-2 p-3 rounded-xl neumorphic" style={{background: '#2e2e2e', boxShadow: '8px 8px 16px #272727, -8px -8px 16px #353535'}}>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm">Armo Hopar is online</span>
        </div>
      </motion.div>

      {/* Vibez Menu */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-neon-teal">Choose Your Vibe</h2>
        
        <div className="space-y-3">
          {features.map((feature, index) => (
            <motion.button
              key={feature.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onVibeSelect(feature.id)}
              className={`w-full p-4 rounded-xl transition-all duration-300 text-left group ${
                currentVibe === feature.id ? 'active' : ''
              } ${
                feature.glowColor === 'cyan' ? 'hover:neon-cyan-glow' : 
                feature.glowColor === 'coral' ? 'hover:neon-coral-glow' : 
                'hover:neon-teal-glow'
              }`}
              style={{background: '#2e2e2e', boxShadow: '8px 8px 16px #272727, -8px -8px 16px #353535'}}
            >
              <div className="flex items-center space-x-3">
                <i className={`${feature.icon} ${
                  feature.glowColor === 'cyan' ? 'text-neon-cyan' : 
                  feature.glowColor === 'coral' ? 'text-neon-coral' : 
                  'text-neon-teal'
                } text-xl group-hover:bounce-slow`}></i>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-xs text-gray-400">{feature.subtitle}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 border-t border-armo-accent/20"
      >
        <div className="flex items-center space-x-3 p-3 rounded-xl" style={{background: '#2e2e2e', boxShadow: 'inset 8px 8px 16px #272727, inset -8px -8px 16px #353535'}}>
          <div className="w-8 h-8 bg-gradient-to-r from-neon-cyan to-neon-teal rounded-full flex items-center justify-center">
            <i className="fas fa-user text-xs"></i>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Guest User</p>
            <p className="text-xs text-gray-400">Free Tier</p>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
