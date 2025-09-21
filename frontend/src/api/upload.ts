import { apiClient } from './client';

export interface UploadFileResponse {
  message: string;
  data: {
    url: string;
    key: string;
    fileName: string;
  };
}

export interface PresignedUrlResponse {
  message: string;
  data: {
    uploadUrl: string;
    key: string;
    publicUrl: string;
  };
}

export const uploadApi = {
  // Upload file directly to backend (which uploads to S3)
  async uploadFile(file: File, folder: string = 'lessons', customFileName?: string): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (customFileName) {
      formData.append('customFileName', customFileName);
    }

    const res = await apiClient.post('/api/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Get presigned URL for direct upload to S3
  async getPresignedUrl(fileName: string, contentType: string, folder: string = 'lessons'): Promise<PresignedUrlResponse> {
    const res = await apiClient.post('/api/upload/presigned-url', {
      fileName,
      contentType,
      folder,
    });
    return res.data;
  },

  // Upload file directly to S3 using presigned URL
  async uploadToS3(file: File, presignedUrl: string): Promise<void> {
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  },

  // Delete file from S3
  async deleteFile(key: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/upload/file/${encodeURIComponent(key)}`);
    return res.data;
  },

  // Get signed URL for file access
  async getSignedUrl(key: string): Promise<{ message: string; data: { signedUrl: string } }> {
    const res = await apiClient.get(`/api/upload/signed-url/${encodeURIComponent(key)}`);
    return res.data;
  },
};
