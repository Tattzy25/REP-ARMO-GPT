import { motion } from "framer-motion";
import { vibeConfigs } from "@/lib/vibes";
import logoImage from "@/assets/logo.png";
import { useState } from "react";

interface SidebarProps {
  currentVibe: string;
  onVibeSelect: (vibe: string) => void;
}

export default function Sidebar({ currentVibe, onVibeSelect }: SidebarProps) {
  const features = Object.values(vibeConfigs);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="fixed left-0 top-0 w-80 h-screen border-r border-armo-accent/20 flex flex-col z-10 overflow-hidden" style={{background: '#2e2e2e'}}>
      {/* Header */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="p-6 border-b border-armo-accent/20"
      >
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src={logoImage} 
            alt="Armo GPT Logo" 
            className="w-32 h-32 rounded-lg"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
            }}
          />
        </div>
        
        <div className="flex items-center space-x-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-neon-cyan">Your Hopar, The AI Overload</h1>
          </div>
        </div>
        
        
      </motion.div>
      {/* Navigation Buttons */}
      <div className="flex-1 p-4 relative overflow-hidden flex flex-col">
        {/* Home Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            setIsDropdownOpen(false);
            onVibeSelect('lobby');
          }}
          className="w-full mb-3 relative px-6 py-4 font-bold text-white cursor-pointer transition-all duration-200 inline-flex items-center justify-center rounded-full border hover:scale-105"
          style={{
            background: 'linear-gradient(to bottom, #171717, #242424)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)',
            borderColor: '#292929',
          }}
        >
          ARMO LOBBY
          <div 
            className="ml-3 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200"
            style={{
              background: 'linear-gradient(to bottom, #171717, #242424)',
              boxShadow: '0 0 1px rgba(0, 0, 0, 1)',
              borderColor: '#252525',
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5"
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(26, 25, 25, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 1))',
              }}
            >
              <defs>
                <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="homeIconGradient">
                  <stop style={{stopColor: '#FFFFFF', stopOpacity: 1}} offset="0%" />
                  <stop style={{stopColor: '#AAAAAA', stopOpacity: 1}} offset="100%" />
                </linearGradient>
              </defs>
              <path fill="url(#homeIconGradient)" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </div>
        </motion.button>

        {/* Dropdown Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full mb-4 relative px-6 py-4 font-bold text-white cursor-pointer transition-all duration-200 inline-flex items-center justify-center rounded-full border"
          style={{
            background: 'linear-gradient(to bottom, #171717, #242424)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)',
            borderColor: '#292929',
            transform: isDropdownOpen ? 'translateY(2px)' : 'translateY(0)',
          }}
        >
          THE VIBEZ
          <div 
            className="ml-3 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200"
            style={{
              background: 'linear-gradient(to bottom, #171717, #242424)',
              boxShadow: '0 0 1px rgba(0, 0, 0, 1)',
              borderColor: '#252525',
            }}
          >
            <svg 
              viewBox="0 0 32 32" 
              className="w-6 h-6 transition-transform duration-400"
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(26, 25, 25, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 1))',
                transform: isDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)'
              }}
            >
              <defs>
                <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="iconGradient">
                  <stop style={{stopColor: '#FFFFFF', stopOpacity: 1}} offset="0%" />
                  <stop style={{stopColor: '#AAAAAA', stopOpacity: 1}} offset="100%" />
                </linearGradient>
              </defs>
              <path fill="url(#iconGradient)" d="M4 15a1 1 0 0 0 1 1h19.586l-4.292 4.292a1 1 0 0 0 1.414 1.414l6-6a.99.99 0 0 0 .292-.702V15c0-.13-.026-.26-.078-.382a.99.99 0 0 0-.216-.324l-6-6a1 1 0 0 0-1.414 1.414L24.586 14H5a1 1 0 0 0-1 1z" />
            </svg>
          </div>
        </motion.button>

        {/* Gallery Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => {
            setIsDropdownOpen(false);
            onVibeSelect('gallery');
          }}
          className="w-full mb-3 relative px-6 py-4 font-bold text-white cursor-pointer transition-all duration-200 inline-flex items-center justify-center rounded-full border hover:scale-105"
          style={{
            background: 'linear-gradient(to bottom, #171717, #242424)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)',
            borderColor: '#292929',
          }}
        >
          GALLERY
          <div 
            className="ml-3 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200"
            style={{
              background: 'linear-gradient(to bottom, #171717, #242424)',
              boxShadow: '0 0 1px rgba(0, 0, 0, 1)',
              borderColor: '#252525',
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5"
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(26, 25, 25, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 1))',
              }}
            >
              <defs>
                <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="galleryIconGradient">
                  <stop style={{stopColor: '#FFFFFF', stopOpacity: 1}} offset="0%" />
                  <stop style={{stopColor: '#AAAAAA', stopOpacity: 1}} offset="100%" />
                </linearGradient>
              </defs>
              <path fill="url(#galleryIconGradient)" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        </motion.button>

        {/* Recent Chats Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            setIsDropdownOpen(false);
            onVibeSelect('recent');
          }}
          className="w-full mb-4 relative px-6 py-4 font-bold text-white cursor-pointer transition-all duration-200 inline-flex items-center justify-center rounded-full border hover:scale-105"
          style={{
            background: 'linear-gradient(to bottom, #171717, #242424)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)',
            borderColor: '#292929',
          }}
        >
          RECENT CHATS
          <div 
            className="ml-3 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200"
            style={{
              background: 'linear-gradient(to bottom, #171717, #242424)',
              boxShadow: '0 0 1px rgba(0, 0, 0, 1)',
              borderColor: '#252525',
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5"
              style={{
                filter: 'drop-shadow(0 10px 20px rgba(26, 25, 25, 0.9)) drop-shadow(0 0 4px rgba(0, 0, 0, 1))',
              }}
            >
              <defs>
                <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="chatIconGradient">
                  <stop style={{stopColor: '#FFFFFF', stopOpacity: 1}} offset="0%" />
                  <stop style={{stopColor: '#AAAAAA', stopOpacity: 1}} offset="100%" />
                </linearGradient>
              </defs>
              <path fill="url(#chatIconGradient)" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          </div>
        </motion.button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-4 right-4 z-50 rounded-xl overflow-hidden"
            style={{
              top: '360px',
              width: '272px',
              background: '#2e2e2e',
              boxShadow: '8px 8px 16px #272727, -8px -8px 16px #353535',
            }}
          >
            <div 
              className="p-2 space-y-2 overflow-y-auto dropdown-content"
              style={{
                maxHeight: 'calc(100vh - 300px)'
              }}
            >
              {features.map((feature, index) => (
                <motion.button
                  key={feature.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onVibeSelect(feature.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full p-3 rounded-lg transition-all duration-300 text-left group ${
                    currentVibe === feature.id ? 'active' : ''
                  } ${
                    feature.glowColor === 'cyan' ? 'hover:neon-cyan-glow' : 
                    feature.glowColor === 'coral' ? 'hover:neon-coral-glow' : 
                    'hover:neon-teal-glow'
                  }`}
                  style={{
                    background: currentVibe === feature.id ? '#3a3a3a' : '#2a2a2a', 
                    boxShadow: currentVibe === feature.id 
                      ? 'inset 4px 4px 8px #1f1f1f, inset -4px -4px 8px #3b3b3b'
                      : '4px 4px 8px #232323, -4px -4px 8px #333333'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${feature.icon} ${
                      feature.glowColor === 'cyan' ? 'text-neon-cyan' : 
                      feature.glowColor === 'coral' ? 'text-neon-coral' : 
                      'text-neon-teal'
                    } text-lg group-hover:bounce-slow`}></i>
                    <div>
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-400">{feature.subtitle}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Overlay to close dropdown */}
        {isDropdownOpen && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
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
