import api from './api';

export interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  role: 'User' | 'Assistant';
  content: string;
  createdAt: string;
}

export const getSessions = async () => {
  const response = await api.get<ChatSession[]>('/chat/sessions');
  return response.data;
};

export const createSession = async (title?: string) => {
  const response = await api.post<ChatSession>('/chat/sessions', { title });
  return response.data;
};

export const renameSession = async (id: number, title: string) => {
  const response = await api.put<ChatSession>(`/chat/sessions/${id}`, { title });
  return response.data;
};

export const deleteSession = async (id: number) => {
  await api.delete(`/chat/sessions/${id}`);
};

export const getMessages = async (sessionId: number) => {
  const response = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  return response.data;
};
