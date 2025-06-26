import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface ChatSession {
  id: number;
  vibe: string;
  createdAt: string;
}

interface RecentChatsListProps {
  onSelectChat: (sessionId: number, vibe: string) => void;
}

export default function RecentChatsList({ onSelectChat }: RecentChatsListProps) {
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      console.log('Fetching recent chats...');
      const response = await fetch('/api/chat/recent');
      
      if (response.ok) {
        const chats = await response.json();
        console.log('Recent chats received:', chats);
        setRecentChats(chats);
      } else {
        console.error('Failed to fetch recent chats - Response not OK:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch recent chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const generateChatTitle = (vibe: string) => {
    const titles = {
      default: ['General Chat', 'Casual Talk', 'Daily Chat'],
      roast: ['Roast Session', 'Savage Mode', 'No Mercy Chat'],
      call: ['Voice Call', 'Phone Chat', 'Audio Session'],
      famous: ['Fame Talk', 'Celebrity Mode', 'Star Chat']
    };
    
    const vibeTitle = titles[vibe as keyof typeof titles] || titles.default;
    return vibeTitle[Math.floor(Math.random() * vibeTitle.length)];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (recentChats.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No recent chats</p>
        <p className="text-sm mt-2">Start a new conversation to see your chat history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h3 className="text-lg font-bold text-white mb-4 text-center">Recent Chats</h3>
      {recentChats.map((chat, index) => (
        <motion.button
          key={chat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectChat(chat.id, chat.vibe)}
          className="w-full p-4 rounded-xl text-left transition-all duration-200 group"
          style={{
            background: '#3a3a3a',
            boxShadow: '4px 4px 8px #2e2e2e, -4px -4px 8px #464646'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3a3a3a';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">
                {generateChatTitle(chat.vibe)}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {chat.vibe.charAt(0).toUpperCase() + chat.vibe.slice(1)} mode
              </p>
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(chat.createdAt)}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}