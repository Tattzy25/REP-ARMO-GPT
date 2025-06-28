import { useState, useEffect } from 'react';
import { Clock, MoreVertical, Trash2, Calendar } from 'lucide-react';

interface ChatSession {
  id: number;
  vibe: string;
  title?: string;
  createdAt: string;
}

interface RecentChatsListProps {
  onSelectChat: (sessionId: number, vibe: string) => void;
}

export default function RecentChatsList({ onSelectChat }: RecentChatsListProps) {
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

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

  const deleteChat = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chat/session/${chatId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
        setActiveMenu(null);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const extendChat = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chat/session/${chatId}/extend`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setActiveMenu(null);
        // Could show a success message here
      }
    } catch (error) {
      console.error('Failed to extend chat:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = diffInMs / (1000 * 60);
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else if (diffInDays < 7) {
        return `${Math.floor(diffInDays)}d ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return 'Unknown';
    }
  };

  const getChatDisplayTitle = (chat: ChatSession) => {
    // Use auto-generated title if available, otherwise fall back to time-based title
    if (chat.title) {
      return chat.title;
    }
    
    const date = new Date(chat.createdAt);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    const vibeNames: Record<string, string> = {
      'default': 'Chat',
      'roast': 'Roast Session',
      'famous': 'Fame Strategy',
      'call': 'Voice Call',
      'gimmi-alibi-ara': 'Alibi Story',
    };
    
    const baseName = vibeNames[chat.vibe] || 'Chat';
    return `${baseName} ${timeStr}`;
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
    <div 
      className="space-y-2 max-h-64 p-4 scrollbar-hidden" 
      style={{ 
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
      <h3 className="text-white font-semibold text-sm mb-3">Recent Chats</h3>
      {recentChats.map((chat) => (
        <div key={chat.id} className="relative">
          <div
            onClick={() => onSelectChat(chat.id, chat.vibe)}
            className="w-full text-left p-3 rounded-lg transition-all duration-200 relative group cursor-pointer"
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
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium text-sm">
                  {getChatDisplayTitle(chat)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDate(chat.createdAt)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === chat.id ? null : chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <MoreVertical className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
          
          {activeMenu === chat.id && (
            <div 
              className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden"
              style={{
                background: '#2e2e2e',
                boxShadow: '3px 3px 6px #1f1f1f, -3px -3px 6px #3d3d3d',
              }}
            >
              <button
                onClick={() => extendChat(chat.id)}
                className="w-full px-3 py-2 text-left text-xs text-white hover:bg-gray-600 flex items-center"
              >
                <Calendar className="w-3 h-3 mr-2" />
                Extend 30 days
              </button>
              <button
                onClick={() => deleteChat(chat.id)}
                className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-gray-600 flex items-center"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Delete chat
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}