import { apiClient, requestWithFallback } from '@/services/httpClient';

export interface UploadResult {
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface UploadProgressItem {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

function clampPercent(loaded: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
}

export const uploadService = {
  async uploadEvidenceFiles(
    files: File[],
    onProgress?: (item: UploadProgressItem) => void
  ) {
    const uploads: UploadResult[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      const result = await requestWithFallback<{ url: string }>([
        () =>
          apiClient.post('/upload/evidence', formData, {
            onUploadProgress: (event) => {
              onProgress?.({
                fileName: file.name,
                loaded: event.loaded,
                total: event.total ?? file.size,
                percent: clampPercent(event.loaded, event.total ?? file.size)
              });
            }
          }),
        () =>
          apiClient.post('/complaints/upload', formData, {
            onUploadProgress: (event) => {
              onProgress?.({
                fileName: file.name,
                loaded: event.loaded,
                total: event.total ?? file.size,
                percent: clampPercent(event.loaded, event.total ?? file.size)
              });
            }
          }),
        () =>
          apiClient.post('/evidence/upload', formData, {
            onUploadProgress: (event) => {
              onProgress?.({
                fileName: file.name,
                loaded: event.loaded,
                total: event.total ?? file.size,
                percent: clampPercent(event.loaded, event.total ?? file.size)
              });
            }
          })
      ]);

      uploads.push({
        url: result.url,
        name: file.name,
        mimeType: file.type,
        size: file.size
      });
    }

    return uploads;
  }
};
