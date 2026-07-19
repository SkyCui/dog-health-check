import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "你的狗狗幸福吗？",
  description: "从身体健康与精神状态出发的循证轻量自查 Beta。"
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
