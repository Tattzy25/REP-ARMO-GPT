import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CallInterfaceProps {
  onEndCall: () => void;
}

export default function CallInterface({ onEndCall }: CallInterfaceProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate call connection
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center p-8 h-full">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm mx-auto"
      >
        {/* iPhone-style call screen */}
        <div className="bg-black rounded-3xl p-1 shadow-2xl" style={{aspectRatio: '9/19.5'}}>
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl p-6 h-full flex flex-col">
            {/* Status Bar */}
            <div className="flex justify-between items-center text-white text-sm mb-8">
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
              <span>100%</span>
            </div>

            {/* Call Status */}
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm">
                {isConnected ? formatDuration(callDuration) : "Connecting..."}
              </p>
              <p className="text-white text-lg font-semibold">Armo Hopar</p>
              <p className="text-gray-400 text-xs mt-1">
                {isConnected ? "Connected" : "Calling..."}
              </p>
            </div>

            {/* Avatar */}
            <div className="flex-1 flex items-center justify-center mb-8">
              <motion.div
                animate={{ 
                  scale: isConnected ? [1, 1.1, 1] : 1,
                  rotate: isConnected ? [0, 5, -5, 0] : 0
                }}
                transition={{ 
                  duration: 2, 
                  repeat: isConnected ? Infinity : 0,
                  repeatType: "reverse"
                }}
                className="w-32 h-32 rounded-full bg-gradient-to-r from-armo-red via-blue-500 to-orange-400 flex items-center justify-center text-6xl"
              >
                🤖
              </motion.div>
            </div>

            {/* Call Status Indicator */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-4"
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">Voice Active</span>
                </div>
              </motion.div>
            )}

            {/* Call Controls */}
            <div className="flex justify-center space-x-8 mb-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center"
              >
                <i className="fas fa-microphone-slash text-white text-xl"></i>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onEndCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center neon-coral-glow"
              >
                <i className="fas fa-phone-slash text-white text-xl"></i>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center"
              >
                <i className="fas fa-volume-up text-white text-xl"></i>
              </motion.button>
            </div>

            {/* Voice Waveform Animation */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center space-x-1 mb-4"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-neon-cyan rounded-full"
                    animate={{
                      height: [8, 24, 8, 16, 8],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
