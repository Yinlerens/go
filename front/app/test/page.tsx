// app/page.tsx
"use client";

import React, { useState } from "react";
import { Card, Space, Typography, Alert, List } from "antd";
import UniversalUpload from "@/components/Upload";
import type { RcFile } from "antd/es/upload";

const { Title, Text } = Typography;

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; url: string; size: number }>
  >([]);

  const handleUploadSuccess = (url: string, file: RcFile) => {
    console.log("Upload success:", url);
    setUploadedFiles(prev => [
      ...prev,
      {
        name: file.name,
        url,
        size: file.size
      }
    ]);
  };

  const handleUploadError = (error: Error, file: RcFile) => {
    console.error("Upload error:", error, file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>

        <Card title="文件上传">
          <UniversalUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            accept="image/*,application/pdf,.doc,.docx"
            maxSize={50} // 最大50MB
            multiple={true}
          />
        </Card>

        {uploadedFiles.length > 0 && (
          <Card title="已上传文件">
            <List
              dataSource={uploadedFiles}
              renderItem={item => (
                <List.Item>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>{item.name}</Text>
                    <Text type="secondary">
                      大小：{formatFileSize(item.size)} |
                      {item.size <= 4.5 * 1024 * 1024 ? " Vercel Blob" : " 腾讯云 COS"}
                    </Text>
                    <Text copyable={{ text: item.url }} style={{ wordBreak: "break-all" }}>
                      {item.url}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    </div>
  );
}
