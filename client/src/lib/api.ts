import { apiRequest } from "./queryClient";

export interface ChatMessage {
  id: number;
  sessionId: number;
  sender: 'user' | 'armo';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface ChatSession {
  id: number;
  userId?: number;
  vibe: string;
  createdAt?: Date;
}

export interface ChatHistoryResponse {
  sessionId?: number;
  messages: ChatMessage[];
}

export const chatApi = {
  getChatHistory: async (vibe: string): Promise<ChatHistoryResponse> => {
    const response = await apiRequest('GET', `/api/chat/${vibe}/history`);
    return response.json();
  },

  createSession: async (vibe: string): Promise<ChatSession> => {
    const response = await apiRequest('POST', '/api/chat/session', {
      vibe,
      userId: null
    });
    return response.json();
  },

  sendMessage: async (sessionId: number, content: string): Promise<{
    userMessage: ChatMessage;
    armoMessage: ChatMessage;
    aiResponse: string;
  }> => {
    const response = await apiRequest('POST', '/api/chat/message', {
      sessionId,
      sender: 'user',
      content,
      metadata: null
    });
    return response.json();
  },

  search: async (query: string): Promise<{ results: any[] }> => {
    const response = await apiRequest('POST', '/api/search', { query });
    return response.json();
  },

  synthesizeVoice: async (text: string): Promise<{ audioUrl: string; success: boolean }> => {
    const response = await apiRequest('POST', '/api/voice/synthesize', { text });
    return response.json();
  }
};
