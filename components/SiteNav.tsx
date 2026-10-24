"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, HeartPulse, MessageCircle } from "lucide-react";

const links = [
  { href: "/assessment", label: "幸福自查", short: "幸福自查", icon: HeartPulse },
  { href: "/knowledge", label: "狗狗幸福知识库", short: "知识库", icon: BookOpen },
  { href: "/consult", label: "AI顾问", short: "AI顾问", icon: MessageCircle },
  { href: "/companion", label: "陪伴记录", short: "陪伴记录", icon: ClipboardList }
];

export default function SiteNav() {
  const pathname = usePathname();
  return <header className="site-nav"><Link href="/" className="brand" aria-label="dogcare 首页"><span className="brand-desktop">你的毛孩子幸福吗？<small>dogcare · 每一天，都更懂一点。</small></span><span className="brand-mobile">dogcare</span></Link><span className="mobile-nav-caption">陪狗狗过好每一天</span><nav aria-label="主要导航">{links.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href || (pathname === "/result" && item.href === "/assessment") ? "page" : undefined}><item.icon size={19} aria-hidden="true"/><span className="nav-long">{item.label}</span><span className="nav-short">{item.short}</span></Link>)}</nav></header>;
}
