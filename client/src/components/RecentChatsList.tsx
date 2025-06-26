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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching recent chats...');
      
      const response = await fetch('/api/chat/recent');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('Raw response text:', text);
      
      let chats;
      try {
        chats = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
      }
      
      console.log('Parsed chats:', chats);
      setRecentChats(Array.isArray(chats) ? chats : []);
    } catch (error) {
      console.error('Failed to fetch recent chats:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
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
    } catch {
      return 'Unknown';
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

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-400">Error: {error}</div>
        <button 
          onClick={fetchRecentChats}
          className="text-xs text-blue-400 hover:text-blue-300 mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (recentChats.length === 0) {
    return (
      <div className="p-4 text-center">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-500" />
        <div className="text-sm text-gray-400">No recent chats</div>
        <div className="text-xs text-gray-500 mt-1">Start chatting to see history here!</div>
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
            const target = e.currentTarget;
            target.style.background = 'linear-gradient(135deg, #ff4444, #4444ff, #ff8800)';
            target.style.boxShadow = 'none';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
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