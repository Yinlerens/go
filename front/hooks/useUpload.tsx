import { useState, useCallback } from "react";
import { upload } from "@vercel/blob/client";
import { UploadType, UploadResponse, UploadProgress } from "../types/upload";

export interface UseUploadOptions {
  type: UploadType;
  pathname?: string;
  uploadEndpoint?: string;
  formData?: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: UploadResponse | UploadResponse[]) => void;
  onError?: (error: Error) => void;
}

export const useUpload = (options: UseUploadOptions) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const handleProgress = useCallback(
    (loaded: number, total: number) => {
      const percentage = Math.round((loaded / total) * 100);
      const progressData = { loaded, total, percentage };
      setProgress(progressData);
      options.onProgress?.(progressData);
    },
    [options.onProgress]
  );

  const uploadClient = useCallback(
    async (files: File | File[]) => {
      const fileList = Array.isArray(files) ? files : [files];

      try {
        setUploading(true);
        const results: UploadResponse[] = [];

        for (const file of fileList) {
          // 构建完整的路径名
          const fullPathname = options.pathname
            ? `${options.pathname.replace(/\/$/, "")}/${file.name}`
            : file.name;

          const blob = await upload(fullPathname, file, {
            access: "public",
            handleUploadUrl: "/api/upload/token", // 需要创建这个API路由
            onUploadProgress: progressEvent => {
              // progressEvent 有 loaded,total , percentage 属性
              handleProgress(progressEvent.loaded, progressEvent.total);
            }
          });

          results.push({
            url: blob.url,
            pathname: blob.pathname,
            contentType: blob.contentType,
            contentDisposition: blob.contentDisposition,
            downloadUrl: blob.downloadUrl
          });
        }

        const response = Array.isArray(files) ? results : results[0];
        options.onSuccess?.(response);
        return response;
      } catch (error) {
        const uploadError = error instanceof Error ? error : new Error("Upload failed");
        options.onError?.(uploadError);
        throw uploadError;
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [options.pathname, options.onSuccess, options.onError, handleProgress]
  );

  const uploadServer = useCallback(
    async (files: File | File[]) => {
      const fileList = Array.isArray(files) ? files : [files];

      try {
        setUploading(true);
        const formData = new FormData();

        fileList.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });

        // 添加额外的表单数据
        if (options.formData) {
          Object.entries(options.formData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        const response = await fetch(options.uploadEndpoint || "/api/upload", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        options.onSuccess?.(result);
        return result;
      } catch (error) {
        const uploadError = error instanceof Error ? error : new Error("Upload failed");
        options.onError?.(uploadError);
        throw uploadError;
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [options.uploadEndpoint, options.formData, options.onSuccess, options.onError]
  );

  const uploadFile = useCallback(
    async (files: File | File[]) => {
      if (options.type === "client") {
        return uploadClient(files);
      } else {
        return uploadServer(files);
      }
    },
    [options.type, uploadClient, uploadServer]
  );

  return {
    uploadFile,
    uploading,
    progress
  };
};
