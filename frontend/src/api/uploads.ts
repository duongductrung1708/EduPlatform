import { apiClient } from './client';

export interface UploadResult {
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export const uploadsApi = {
  async uploadFile(file: File, folder?: string): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    const res = await apiClient.post('/api/uploads/file', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  async deleteStoredFile(storedFilename: string): Promise<void> {
    await apiClient.delete(`/api/uploads/file/${encodeURIComponent(storedFilename)}`);
  },
};


