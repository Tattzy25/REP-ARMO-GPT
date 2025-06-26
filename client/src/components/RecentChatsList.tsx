import { useState, useEffect } from 'react';
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
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getVibeDisplayName = (vibe: string) => {
    const vibeNames: Record<string, string> = {
      'default': 'Default Chat',
      'roast': 'Roast Mode',
      'famous': 'Famous Mode',
      'call': 'Voice Call',
    };
    return vibeNames[vibe] || vibe.charAt(0).toUpperCase() + vibe.slice(1);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-400">Loading recent chats...</div>
      </div>
    );
  }

  if (recentChats.length === 0) {
    return (
      <div className="p-4">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-500" />
        <div className="text-sm text-gray-400 text-center">No recent chats</div>
        <div className="text-xs text-gray-500 mt-1 text-center">Start chatting to see history here!</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto p-4">
      <h3 className="text-white font-semibold text-sm mb-3">Recent Chats</h3>
      {recentChats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id, chat.vibe)}
          className="w-full text-left p-3 rounded-lg transition-all duration-200"
          style={{
            background: '#2e2e2e',
            boxShadow: '3px 3px 6px #1f1f1f, -3px -3px 6px #3d3d3d',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
            target.style.boxShadow = 'none';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.background = '#2e2e2e';
            target.style.boxShadow = '3px 3px 6px #1f1f1f, -3px -3px 6px #3d3d3d';
          }}
        >
          <div className="text-white font-medium text-sm">
            {getVibeDisplayName(chat.vibe)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDate(chat.createdAt)}
          </div>
        </button>
      ))}
    </div>
  );
}