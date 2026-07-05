import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "狗狗 1 分钟健康自测",
  description: "用 6 个轻量问题生成狗狗健康习惯 Dashboard。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
