// components/UniversalUpload.tsx
import React, { useState } from "react";
import { Upload, message, UploadProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile, RcFile } from "antd/es/upload";

const { Dragger } = Upload;

interface UniversalUploadProps {
  onUploadSuccess?: (url: string, file: RcFile) => void;
  onUploadError?: (error: Error, file: RcFile) => void;
  accept?: string;
  maxSize?: number; // 最大文件大小（MB）
  beforeUpload?: (file: RcFile) => boolean | Promise<boolean>;
  disabled?: boolean;
  multiple?: boolean;
}

const UniversalUpload: React.FC<UniversalUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  accept,
  maxSize,
  beforeUpload,
  disabled = false,
  multiple = false
}) => {
  const [uploading, setUploading] = useState(false);

  // 4.5MB 阈值（字节）
  const BLOB_SIZE_LIMIT = 4.5 * 1024 * 1024;

  const handleUpload = async (file: RcFile): Promise<boolean> => {
    // 自定义的 beforeUpload 检查
    if (beforeUpload) {
      const result = await beforeUpload(file);
      if (!result) return false;
    }

    // 文件大小检查
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      message.error(`文件大小不能超过 ${maxSize}MB`);
      return false;
    }

    setUploading(true);

    try {
      let uploadUrl: string;

      if (file.size <= BLOB_SIZE_LIMIT) {
        // 使用 Vercel Blob 上传
        uploadUrl = await uploadToVercelBlob(file);
      } else {
        // 使用腾讯云 COS 上传
        uploadUrl = await uploadToTencentCOS(file);
      }

      message.success(`上传成功: ${file.name}`);
      onUploadSuccess?.(uploadUrl, file);
    } catch (error) {
      const err = error as Error;
      message.error(`上传失败: ${err.message}`);
      onUploadError?.(err, file);
    } finally {
      setUploading(false);
    }

    return false; // 阻止默认上传行为
  };

  // Vercel Blob 上传
  const uploadToVercelBlob = async (file: RcFile): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/vercel", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "上传失败");
    }

    const data = await response.json();
    return data.url;
  };

  // 腾讯云 COS 上传（服务端代理方案，更安全）
  const uploadToTencentCOS = async (file: RcFile): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload/cos", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "上传失败");
    }

    const data = await response.json();
    return data.url;
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple,
    accept,
    showUploadList: false,
    beforeUpload: handleUpload,
    disabled: disabled || uploading
  };

  return (
    <Dragger {...uploadProps}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
      <p className="ant-upload-hint">
        {multiple ? "支持多文件上传" : "支持单文件上传"}
        {maxSize && `，单个文件最大 ${maxSize}MB`}
      </p>
      {uploading && <p style={{ color: "#1890ff" }}>上传中...</p>}
    </Dragger>
  );
};

export default UniversalUpload;
