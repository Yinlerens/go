export interface UploadResponse {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  downloadUrl: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadType = "client" | "server";

export interface BaseUploadProps {
  type: UploadType;
  accept?: string;
  maxSize?: number; // bytes
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: UploadResponse | UploadResponse[]) => void;
  onError?: (error: Error) => void;
  onRemove?: (file: File | UploadResponse) => void;
}

export interface ClientUploadProps extends BaseUploadProps {
  type: "client";
  // 客户端上传需要指定上传路径
  pathname?: string;
}

export interface ServerUploadProps extends BaseUploadProps {
  type: "server";
  // 服务端上传的API端点
  uploadEndpoint?: string;
  // 额外的表单数据
  formData?: Record<string, string>;
}

export type UploadProps = ClientUploadProps | ServerUploadProps;
