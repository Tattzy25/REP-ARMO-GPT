import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { vibeConfigs } from '@/lib/vibes';
import RecentChatsList from './RecentChatsList';
import logoImage from '@assets/logo - armo gpt_1750839826863.png';

interface SidebarProps {
  currentVibe: string;
  onVibeSelect: (vibe: string) => void;
  onSidebarToggle?: (isCollapsed: boolean) => void;
  isMobile?: boolean;
  onSelectChat?: (sessionId: number, vibe: string) => void;
  onMobileClose?: () => void;
}

export default function Sidebar({ currentVibe, onVibeSelect, onSidebarToggle, isMobile = false, onSelectChat, onMobileClose }: SidebarProps) {
  const features = Object.values(vibeConfigs);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);

  const handleToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onSidebarToggle?.(collapsed);
  };

  return (
    <>
      <div 
        className={`fixed left-0 top-0 h-screen border-r border-armo-accent/20 flex flex-col z-10 overflow-hidden transition-all duration-300`}
        style={{
          background: '#2e2e2e',
          width: isCollapsed ? '0px' : '320px',
          transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        {/* Close Button for Mobile */}
        {isMobile && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={onMobileClose}
              className="p-2 rounded-lg text-white hover:bg-gray-600 transition-colors duration-200"
              style={{ background: "#3a3a3a" }}
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        {/* Toggle Switch for Desktop */}
        {!isMobile && (
          <div className="absolute top-4 right-4 z-50">
            <label className="inline-flex items-center cursor-pointer">
              <div 
                className="relative h-7 w-14 rounded-full overflow-hidden"
                style={{
                  boxShadow: '-6px -3px 6px rgb(50, 50, 50), 6px 3px 9px rgb(25, 25, 25), 3px 3px 3px rgb(25, 25, 25) inset, -3px -3px 3px rgb(50, 50, 50) inset'
                }}
              >
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={isCollapsed}
                  onChange={(e) => handleToggle(e.target.checked)}
                />
                <div 
                  className="h-full w-full rounded-full transition-transform duration-400"
                  style={{
                    background: '#262626',
                    width: '200%',
                    transform: isCollapsed ? 'translate3d(25%, 0, 0)' : 'translate3d(-75%, 0, 0)',
                    boxShadow: '-6px -3px 6px rgb(25, 25, 25), 6px 3px 9px rgb(25, 25, 25)'
                  }}
                />
              </div>
            </label>
          </div>
        )}

        {/* Header */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="p-4 border-b border-armo-accent/20"
        >
          {/* Logo */}
          <div className="flex justify-center mb-3">
            <img 
              src={logoImage} 
              alt="Armo GPT Logo" 
              className="w-24 h-24 rounded-lg"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
              }}
            />
          </div>
          
          <div className="flex items-center space-x-3 mb-3">
            <div>
              <h1 className="text-lg font-bold text-neon-cyan">Your Hopar, The AI Overload</h1>
            </div>
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex-1 p-3 relative overflow-y-auto flex flex-col dropdown-content">
          {/* Home Button */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setIsDropdownOpen(false);
              onVibeSelect('lobby');
            }}
            className="w-full mb-2 relative px-4 py-3 font-bold text-white cursor-pointer transition-all duration-200 inline-flex items-center justify-center rounded-full border"
            style={{
              background: 'linear-gradient(to bottom, #171717, #242424)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)',
              borderColor: '#292929',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = 'none';
              const svg = e.currentTarget.querySelector('svg path');
              if (svg) svg.style.fill = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to bottom, #171717, #242424)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)';
              const svg = e.currentTarget.querySelector('svg path');
              if (svg) svg.style.fill = 'url(#homeIconGradient)';
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
            className="w-full mb-3 relative px-4 py-3 font-bold text-white cursor-pointer transition-all duration-200 inline-flex items-center justify-center rounded-full border"
            style={{
              background: 'linear-gradient(to bottom, #171717, #242424)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)',
              borderColor: '#292929',
              transform: isDropdownOpen ? 'translateY(2px)' : 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = 'none';
                const svg = e.currentTarget.querySelector('svg path');
                if (svg) svg.style.fill = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDropdownOpen) {
                e.currentTarget.style.background = 'linear-gradient(to bottom, #171717, #242424)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)';
                const svg = e.currentTarget.querySelector('svg path');
                if (svg) svg.style.fill = 'url(#iconGradient)';
              }
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
            className="w-full mb-2 relative px-4 py-3 font-bold text-white cursor-pointer transition-all duration-200 inline-flex items-center justify-center rounded-full border"
            style={{
              background: 'linear-gradient(to bottom, #171717, #242424)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)',
              borderColor: '#292929',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = 'none';
              const svg = e.currentTarget.querySelector('svg path');
              if (svg) svg.style.fill = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to bottom, #171717, #242424)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 1), 0 10px 20px rgba(0, 0, 0, 0.4)';
              const svg = e.currentTarget.querySelector('svg path');
              if (svg) svg.style.fill = 'url(#galleryIconGradient)';
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

          {/* Chat History Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full mb-3"
          >
            <div 
              className="flex rounded-2xl p-1"
              style={{
                background: '#2e2e2e',
                boxShadow: '10px 10px 20px #1f1f1f, -10px -10px 20px #3d3d3d'
              }}
            >
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  setShowRecentChats(true);
                }}
                className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-none cursor-pointer font-bold text-xs uppercase transition-all duration-200"
                style={{
                  background: '#2e2e2e',
                  boxShadow: 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d',
                  color: '#ffffff',
                  margin: '3px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                  e.target.style.color = '#ffffff';
                  const svg = e.target.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d';
                  e.target.style.background = '#2e2e2e';
                  e.target.style.color = '#ffffff';
                  const svg = e.target.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-4 h-4 mr-2"
                  style={{ fill: '#ffffff', transition: 'fill 0.2s' }}
                >
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
                Recent
              </button>
              
              <button 
                onClick={async () => {
                  try {
                    setIsDropdownOpen(false);
                    console.log('Creating new chat for vibe:', currentVibe);
                    
                    const response = await fetch('/api/chat/session', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ vibe: currentVibe }),
                    });
                    
                    if (!response.ok) {
                      const errorText = await response.text();
                      throw new Error(`Failed to create session: ${response.status} ${errorText}`);
                    }
                    
                    const newSession = await response.json();
                    console.log('Created new session:', newSession);
                    
                    if (onSelectChat && newSession.id) {
                      onSelectChat(newSession.id, currentVibe);
                      // Show recent chats automatically after creating new session
                      setShowRecentChats(true);
                    }
                  } catch (error) {
                    console.error('Error creating new chat:', error);
                    alert('Failed to create new chat. Please try again.');
                  }
                }}
                className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-none cursor-pointer font-bold text-xs uppercase transition-all duration-200"
                style={{
                  background: '#2e2e2e',
                  boxShadow: 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d',
                  color: '#ffffff',
                  margin: '3px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                  e.target.style.color = '#ffffff';
                  const svg = e.target.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d';
                  e.target.style.background = '#2e2e2e';
                  e.target.style.color = '#ffffff';
                  const svg = e.target.querySelector('svg');
                  if (svg) svg.style.fill = '#ffffff';
                }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-4 h-4 mr-2"
                  style={{ fill: '#ffffff', transition: 'fill 0.2s' }}
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                New Chat
              </button>
            </div>
          </motion.div>

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
              style={{ pointerEvents: 'auto' }}
            />
          )}

          {/* Recent Chats List */}
          {showRecentChats && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-4 right-4 z-50 rounded-xl overflow-hidden"
              style={{
                top: '120px',
                bottom: '20px',
                width: '272px',
                background: '#2e2e2e',
                boxShadow: '8px 8px 16px #272727, -8px -8px 16px #353535',
              }}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-600/20">
                  <button
                    onClick={() => setShowRecentChats(false)}
                    className="text-white hover:text-red-400 transition-colors"
                  >
                    ← Back to Vibez
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <RecentChatsList 
                    onSelectChat={(sessionId, vibe) => {
                      setShowRecentChats(false);
                      if (onSelectChat) {
                        onSelectChat(sessionId, vibe);
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Overlay to close recent chats */}
          {showRecentChats && (
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setShowRecentChats(false)}
              style={{ pointerEvents: 'auto' }}
            />
          )}
        </div>

        {/* Account & Settings */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-3 border-t border-armo-accent/20 relative z-50"
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            className="flex justify-center rounded-2xl p-1"
            style={{
              background: '#2e2e2e',
              boxShadow: '10px 10px 20px #1f1f1f, -10px -10px 20px #3d3d3d'
            }}
          >
            <button 
              className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-none cursor-pointer font-bold text-xs uppercase transition-all duration-200"
              style={{
                background: '#2e2e2e',
                boxShadow: 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d',
                color: '#ffffff',
                margin: '3px'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                e.target.style.color = '#ffffff';
                const svg = e.target.querySelector('svg');
                if (svg) svg.style.fill = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d';
                e.target.style.background = '#2e2e2e';
                e.target.style.color = '#ffffff';
                const svg = e.target.querySelector('svg');
                if (svg) svg.style.fill = '#ffffff';
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 mr-2"
                style={{ fill: '#ffffff', transition: 'fill 0.2s' }}
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Account
            </button>
            
            <button 
              className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-none cursor-pointer font-bold text-xs uppercase transition-all duration-200"
              style={{
                background: '#2e2e2e',
                boxShadow: 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d',
                color: '#ffffff',
                margin: '3px'
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
                e.target.style.color = '#ffffff';
                const svg = e.target.querySelector('svg');
                if (svg) svg.style.fill = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = 'inset 5px 5px 5px #1f1f1f, inset -5px -5px 5px #3d3d3d';
                e.target.style.background = '#2e2e2e';
                e.target.style.color = '#ffffff';
                const svg = e.target.querySelector('svg');
                if (svg) svg.style.fill = '#ffffff';
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-5 h-5 mr-2"
                style={{ fill: '#ffffff', transition: 'fill 0.2s' }}
              >
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              Settings
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Toggle Button when collapsed */}
      {isCollapsed && (
        <div className="fixed left-2 top-4 z-50">
          <button
            onClick={() => handleToggle(false)}
            className="p-2 rounded-lg transition-all duration-200"
            style={{
              background: '#2e2e2e',
              boxShadow: '4px 4px 8px #1f1f1f, -4px -4px 8px #3d3d3d'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2e2e2e';
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 text-white"
              fill="currentColor"
            >
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        </div>
      )}
    </>
  );
}