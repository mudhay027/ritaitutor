import api from './api';

export const askQuestion = async (question: string, activePdf: string | null, marks: number, sessionId?: number) => {
    const response = await api.post('/ai/ask', { question, activePdf, marks, sessionId });
    return response.data;
};

export const modifyAnswer = async (request: string, previousAnswer: string) => {
    const response = await api.post('/ai/modify', { request, previousAnswer });
    return response.data;
};
