// app/api/upload/cos/route.ts
import { NextRequest, NextResponse } from "next/server";
import COS from "cos-nodejs-sdk-v5";
import os from "os";
import path from "path";
// 初始化 COS 实例
const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID!,
  SecretKey: process.env.TENCENT_SECRET_KEY!
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "没有找到文件" }, { status: 400 });
    }

    // 检查文件大小（最小应该大于4.5MB）
    const MIN_SIZE = 4.5 * 1024 * 1024;
    if (file.size <= MIN_SIZE) {
      return NextResponse.json(
        { error: "请使用 Vercel Blob 上传小于 4.5MB 的文件" },
        { status: 400 }
      );
    }

    const bucket = process.env.TENCENT_COS_BUCKET!;
    const region = process.env.TENCENT_COS_REGION!;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;
    const key = dateStr + "/" + file.type + "/" + file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用跨平台的临时目录
    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, `${Date.now()}-${file.name}`);
    const fs = await import("fs/promises");

    // 确保临时目录存在
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(tmpFilePath, buffer);

    // 使用高级上传（自动处理分片）
    return new Promise<NextResponse>(resolve => {
      cos.uploadFile(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          FilePath: tmpFilePath,
          SliceSize: 1024 * 1024 * 5, // 超过5MB使用分片上传
          onProgress: progressData => {
            console.log("Upload progress:", progressData);
          }
        },
        async (err, data) => {
          // 清理临时文件
          try {
            await fs.unlink(tmpFilePath);
          } catch (e) {
            console.error("Failed to delete temp file:", e);
          }

          if (err) {
            console.error("COS upload error:", err);
            resolve(NextResponse.json({ error: "上传到 COS 失败" }, { status: 500 }));
          } else {
            const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
            resolve(
              NextResponse.json({
                url,
                key,
                etag: data.ETag,
                data:data
              })
            );
          }
        }
      );
    });
  } catch (error) {
    console.error("COS upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}

// 配置 Next.js 以处理大文件
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb"
    }
  }
};
