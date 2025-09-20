import { apiClient } from './client';

export interface UploadResult {
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export const uploadsApi = {
  async uploadFile(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post('/api/uploads/file', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};


