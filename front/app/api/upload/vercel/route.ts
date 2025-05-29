// app/api/upload/vercel-blob/route.ts
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

interface ApiResponse<T = any> {
  data?: T;
  message: any;
  code: number;
}
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "没有找到文件" }, { status: 400 });
    }

    const MAX_SIZE = 4.5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "文件大小超过 4.5MB 限制" }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    const blob = await put(`${dateStr}/${file.type}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true
    });

    return NextResponse.json<ApiResponse>({
      code: 200,
      message: "上传成功",
      data: {
        url: blob.url,
        downloadUrl: blob.downloadUrl
      }
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse>({ message: error.message, code: 500, data: null });
  }
}
