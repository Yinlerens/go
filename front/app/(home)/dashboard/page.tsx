"use client";

export default function DashboardPage() {
  return (
    <div>
      <h1>欢迎使用权限管理系统</h1>
      {/* 页面内容 */}
      <button onClick={() => {
        throw new Error("Sentry Test Error");
      }}>
        Test Sentry
      </button>
    </div>
  );
}
