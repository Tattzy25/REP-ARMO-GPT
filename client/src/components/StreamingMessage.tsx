import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StreamingMessageProps {
  content: string;
  sender: 'user' | 'armo';
  isStreaming?: boolean;
}

export default function StreamingMessage({ content, sender, isStreaming = false }: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(isStreaming ? '' : content);

  useEffect(() => {
    if (isStreaming && content) {
      let i = 0;
      const streamInterval = setInterval(() => {
        if (i < content.length) {
          setDisplayedContent(content.slice(0, i + 1));
          i++;
        } else {
          clearInterval(streamInterval);
        }
      }, 30);

      return () => clearInterval(streamInterval);
    }
  }, [content, isStreaming]);

  if (sender === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start space-x-3 message-container justify-end"
      >
        <div className="flex-1 flex justify-end">
          <div className="bg-gradient-to-r from-neon-cyan to-neon-teal rounded-2xl rounded-tr-sm p-4 neumorphic max-w-md">
            <p className="text-sm text-white">{displayedContent}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-cyan to-neon-teal flex items-center justify-center flex-shrink-0">
          <i className="fas fa-user text-sm"></i>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start space-x-3 message-container"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-armo-red via-blue-500 to-orange-400 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold">Հ</span>
      </div>
      <div className="flex-1">
        <div className="bg-armo-blue rounded-2xl rounded-tl-sm p-4 neumorphic max-w-md">
          <p className="text-sm message-content">{displayedContent}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-neon-cyan ml-1 typing-animation"></span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Just now</p>
      </div>
    </motion.div>
  );
}
