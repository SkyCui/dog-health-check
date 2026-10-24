import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "你的毛孩子幸福吗？ | dogcare",
  description: "从吃饭、散步到安心休息，一起读懂毛孩子。免费狗狗幸福自查、照护知识库与陪伴记录。"
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
