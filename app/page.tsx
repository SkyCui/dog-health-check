import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, HeartPulse, ClipboardList, ArrowUpRight } from "lucide-react";
import ReturnVisit from "@/components/ReturnVisit";

const paths = [
  { icon: HeartPulse, href: "/assessment", title: "幸福自查", text: "观察身体与精神状态，找到今天的一步行动。" },
  { icon: BookOpen, href: "/knowledge", title: "狗狗幸福知识库", text: "从吃饭、出门到休息，找到有依据的照护建议。" },
  { icon: MessageCircle, href: "/consult", title: "陪伴专家", text: "先获得知识库建议，再用自己的模型继续聊。" },
  { icon: ClipboardList, href: "/companion", title: "陪伴记录", text: "记下今天的观察，下次多懂它一点。" }
];

export default function HomePage() {
  return <main className="home-page">
    <section className="sunny-hero" aria-labelledby="home-title">
      <div className="sunny-hero-content">
        <p className="hero-eyebrow">每一天，都更懂一点。</p>
        <h1 id="home-title">你的毛孩子<br/>幸福吗？</h1>
        <p className="sunny-hero-subtitle">从吃饭、散步到安心休息，<br/>一起读懂毛孩子</p>
        <div className="sunny-hero-actions"><Link className="sunny-primary" href="/assessment">幸福自查 <ArrowRight size={18}/></Link><Link className="sunny-secondary" href="/knowledge">狗狗幸福指南 <ArrowUpRight size={17}/></Link></div>
        <Link className="sunny-expert-link" href="/consult"><MessageCircle size={17}/>直接问AI专家 <ArrowUpRight size={16}/></Link>
      </div>
    </section>
    <div className="home-below">
      <section className="home-entries" aria-label="照护工具">
        <p className="home-entries-caption">照护，从今天的一件小事开始</p>
        <div className="home-entries-grid">{paths.map(item => <Link href={item.href} key={item.href} className="home-entry"><item.icon className="home-entry-icon" size={24}/><div><h2>{item.title}</h2><p>{item.text}</p></div><ArrowUpRight className="home-entry-arrow" size={17}/></Link>)}</div>
      </section>
      <ReturnVisit/>
      <section className="home-message"><div><p className="eyebrow">不急着改变所有事</p><h2>先读懂它，再一起养成好习惯。</h2><p>毛孩子不会说话，Ta的身心健康就靠咱们家长守护了。这个 Agent 也会不断成长，持续陪伴毛孩子们。</p></div><p className="home-boundary">当前仅面向狗狗家长。自查与知识库免费，无需登录。<br/>我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。</p></section>
    </div>
  </main>;
}
