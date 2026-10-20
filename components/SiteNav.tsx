import Link from "next/link";
import { HeartPulse } from "lucide-react";

export default function SiteNav() {
  return <header className="site-nav"><Link href="/" className="brand"><HeartPulse size={25} /><span>你的狗狗幸福吗？<small>百万是人类的好朋友</small></span></Link><nav aria-label="主要导航"><Link href="/assessment">幸福自查</Link><Link href="/knowledge">知识库</Link><Link href="/consult">AI 顾问</Link></nav></header>;
}
