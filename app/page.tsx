import Link from "next/link";
import { ArrowRight, BookOpen, KeyRound, HeartPulse } from "lucide-react";

export default function HomePage() {
  return <main className="page-wrap">
    <section className="home-intro"><div><p className="eyebrow">免费身心观察 · 给每一位狗狗家长</p><h1>你的狗狗幸福吗？</h1><p>从身体习惯到最近两周的行为变化，陪你发现毛孩子做得好的地方，也找到今天值得做的一件小事。</p><Link className="primary-link" href="/assessment">开始免费幸福自查 <ArrowRight size={19}/></Link><p className="home-caption">10 个轻量题组 · 无需登录 · 照片仅保存在本机</p></div><img src="/images/default-dog-avatar.png" alt="白色雪纳瑞陪你观察狗狗的身心状态" /></section>
    <section className="home-paths" aria-label="选择你的下一步">
      {[{ icon: HeartPulse, href: "/assessment", title: "了解它的身心状态", text: "完成幸福自查，生成专属观察档案与今日行动。", action: "去自查" }, { icon: BookOpen, href: "/knowledge", title: "养狗疑问，有据可查", text: "免费查看饮食、体重与日常照护建议，追溯原始依据。", action: "浏览知识库" }, { icon: KeyRound, href: "/consult", title: "用自己的模型，继续聊", text: "免费接入自己的 API，让顾问结合测评与知识条目回答。", action: "接入模型" }].map(item => <Link href={item.href} key={item.href} className="home-path"><item.icon size={24}/><h2>{item.title}</h2><p>{item.text}</p><span>{item.action} <ArrowRight size={16}/></span></Link>)}
    </section>
    <section className="section-band"><div><p className="eyebrow">不急着改变所有事</p><h2 className="mt-2">先读懂它，再一起养成好习惯</h2><p className="mt-3 max-w-2xl leading-7 text-cocoa/70">毛孩子不会说话，Ta的身心健康就靠咱们家长守护了。这个 Agent 也会不断成长，持续陪伴毛孩子们。</p></div><p className="max-w-sm text-sm leading-7 text-cocoa/60">我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。自查采用可追溯的产品规则，目前仍处于 Beta 阶段。</p></section>
  </main>;
}
