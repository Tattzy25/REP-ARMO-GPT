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

  sendMessage: async (
    sessionId: number, 
    content: string, 
    onDelta?: (content: string) => void,
    onComplete?: (message: ChatMessage) => void,
    onUserMessage?: (message: ChatMessage) => void,
    attachments?: any[]
  ) => {
    const response = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        sender: 'user',
        content: attachments && attachments.length > 0 
          ? `${content}\n\n📎 Files attached: ${attachments.map(f => f.file.name).join(', ')}`
          : content,
        metadata: attachments && attachments.length > 0 ? { 
          attachments: attachments.map(f => ({
            originalName: f.file.name,
            size: f.file.size,
            type: f.file.type,
            uploadedData: f.uploadedData
          }))
        } : null
      })
    });

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'user_message' && onUserMessage) {
                onUserMessage(data.message);
              } else if (data.type === 'delta' && onDelta) {
                onDelta(data.content);
              } else if (data.type === 'complete' && onComplete) {
                onComplete(data.message);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
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
