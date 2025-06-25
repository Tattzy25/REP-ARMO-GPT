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
          <div className="rounded-2xl rounded-tr-sm p-4 max-w-md" style={{
            background: 'linear-gradient(135deg, #20b2aa, #40e0d0, #48d1cc)',
            boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
          }}>
            <p className="text-sm text-white">{displayedContent}</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
          background: 'linear-gradient(135deg, #20b2aa, #40e0d0, #48d1cc)',
          boxShadow: '4px 4px 8px #323232, -4px -4px 8px #484848'
        }}>
          <i className="fas fa-user text-sm text-white"></i>
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
        <div className="rounded-2xl rounded-tl-sm p-4 max-w-md" style={{
          background: 'white',
          boxShadow: '6px 6px 12px #323232, -6px -6px 12px #484848'
        }}>
          <p className="text-sm text-black message-content">{displayedContent}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-gray-600 ml-1 typing-animation"></span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Just now</p>
      </div>
    </motion.div>
  );
}
