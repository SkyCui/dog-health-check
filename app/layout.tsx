import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

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
      <body><SiteNav />{children}<footer className="site-footer"><p>毛孩子不会说话，Ta的身心健康就靠咱们家长守护了。</p><p>免费自查 · 开放知识 · 自带模型</p></footer></body>
    </html>
  );
}
