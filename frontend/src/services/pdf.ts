import api from './api';

export const getPdfs = async () => {
    const response = await api.get('/pdf/list');
    return response.data;
};

export const uploadPdf = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/staff/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deletePdf = async (filename: string) => {
    const response = await api.delete(`/staff/delete/${filename}`);
    return response.data;
};

export const renamePdf = async (oldName: string, newName: string) => {
    const response = await api.put('/staff/rename', { oldName, newName });
    return response.data;
};
