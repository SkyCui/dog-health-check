"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, ClipboardList, Footprints, Heart, House, Search, Sprout, Utensils } from "lucide-react";
import guidance from "@/knowledge/consultation/guidance.json";
import guide from "@/knowledge/consultation/book-guide.json";
import { careSource } from "@/lib/careAgent";

const icons = { Utensils, Footprints, Heart, House, ClipboardList, Sprout };

export default function KnowledgeLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const normalized = query.trim().toLowerCase();
  const matched = guidance.entries.filter(entry => `${entry.title} ${entry.summary} ${entry.keywords.join(" ")}`.toLowerCase().includes(normalized));
  const entries = matched.filter(entry => category === "all" || entry.category === category);
  const groups = guide.categories.filter(group => entries.some(entry => entry.category === group.id));

  return <main className="page-wrap">
    <header className="page-heading knowledge-heading">
      <div><p className="eyebrow">免费照护知识库</p><h1>从狗狗的一天，找到照护的答案</h1><p>吃饭、出门、玩耍、休息。选一件眼下关心的小事，找到今天能做的一步。</p></div>
    </header>
    <label className="search-field"><Search size={20} aria-hidden="true"/><input aria-label="搜索知识库" value={query} onChange={event => setQuery(event.target.value)} placeholder="试试：选粮、散步、刷牙、补充剂…" />{query ? <button type="button" onClick={() => setQuery("")} className="text-sm whitespace-nowrap">清除</button> : null}</label>
    <nav className="knowledge-categories" aria-label="照护场景">
      <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>全部 <span>{matched.length}</span></button>
      {guide.categories.map(group => { const Icon = icons[group.icon as keyof typeof icons]; return <button type="button" key={group.id} aria-pressed={category === group.id} onClick={() => setCategory(group.id)}><Icon size={17} aria-hidden="true"/>{group.title}<span>{matched.filter(entry => entry.category === group.id).length}</span></button>; })}
    </nav>
    <p className="text-sm text-cocoa/60 mt-5" role="status">{entries.length ? `找到 ${entries.length} 篇照护指南` : "这个场景下暂时没有匹配内容"}</p>
    {groups.map(group => <section key={group.id} className="knowledge-routine" aria-labelledby={`routine-${group.id}`}>
      <div className="knowledge-routine-heading"><p className="eyebrow">{group.title}</p><h2 id={`routine-${group.id}`}>{group.question}</h2><p>{group.description}</p></div>
      <div className="knowledge-grid">{entries.filter(entry => entry.category === group.id).map(entry => <article key={entry.id} id={entry.id} className="knowledge-entry">
        <h3>{entry.title}</h3><p className="mt-3 leading-7 text-cocoa/80">{entry.summary}</p>
        <details className="knowledge-action-details"><summary>今天可以怎么做</summary><ol className="mt-4 space-y-3 list-decimal pl-5">{entry.actions.map(action => <li key={action} className="pl-1 leading-7">{action}</li>)}</ol><div className="knowledge-note">{entry.watchFor.map(note => <p key={note}>{note}</p>)}</div></details>
        <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-cocoa/65">依据、书中线索与适用边界</summary>
          <div className="knowledge-book-note"><p className="font-bold">《永远的爱犬》阅读线索</p><p className="mt-2 leading-6">第 {entry.bookChapters.join("、")} 章 · PDF 文件页 {entry.bookPages.join("、")}</p><p className="mt-2 leading-6">{entry.bookNote}</p><p className="mt-2 text-xs leading-5">书籍为科普阅读材料，不是独立临床验证依据。以下来源支持本条行动或风险提醒，并非为全书观点背书。</p></div>
          {entry.evidenceRefs.map(id => { const source = careSource(id); return source ? <div key={id} className="mt-4"><a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-rose">{source.level} · {source.organization} · {source.title} <ArrowUpRight className="inline" size={14}/></a><p className="mt-1 leading-6 text-cocoa/65">{source.limitations}</p></div> : null; })}
        </details>
        <Link href={"/consult?prompt=" + encodeURIComponent(entry.title)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-rose">结合我家情况问一问 <ArrowUpRight size={15}/></Link>
      </article>)}</div>
    </section>)}
    {!entries.length ? <div className="py-12 text-center"><p className="text-cocoa/60">试试更短的关键词，或查看全部场景。</p><button type="button" className="mt-4 font-bold text-rose" onClick={() => { setCategory("all"); setQuery(""); }}>查看全部内容</button></div> : null}
    <section className="knowledge-reading" aria-labelledby="reading-title"><BookOpen size={22} aria-hidden="true"/><div><h2 id="reading-title">从一本书出发，不把每个观点都当成处方</h2><p className="mt-3 leading-7">按《永远的爱犬》全书 10 章的议题梳理，以家长的生活场景重新组织。书中观点与可执行建议分开呈现，有争议或尚未核实的做法不直接推荐。</p><details className="mt-4"><summary className="cursor-pointer font-bold">查看全书导览与保留意见</summary><p className="mt-4 text-sm leading-7">{guide.book.authors.join("、")} 著 · {guide.book.translator} 译 · {guide.book.publisher} · {guide.book.edition}。{guide.book.limitations}</p><ol className="knowledge-chapter-list">{guide.chapters.map(chapter => <li key={chapter.number}><h3>第 {chapter.number} 章 · {chapter.title}</h3><p>{chapter.takeaway}</p><p className="text-cocoa/60">保留意见：{chapter.boundary}</p></li>)}</ol><p className="text-sm leading-7">附录：{guide.appendix.coverage}{guide.appendix.boundary}</p><p className="mt-4 text-sm leading-7">本页为原创整理，不提供原书下载，不用于预测寿命。幸福自查评分没有因这次书籍整理而改变。</p></details></div></section>
    <section className="section-band knowledge-assistant-cta" aria-labelledby="knowledge-assistant-title"><div className="knowledge-assistant-copy"><p className="eyebrow">让知识更贴近你家毛孩子</p><h2 id="knowledge-assistant-title">接入自己的模型 API，启动 AI 助手</h2><p className="mt-3 text-sm leading-7 text-cocoa/70">带着你家的饮食、活动与照护记录，围绕知识库中的建议继续聊。</p><p className="mt-2 text-xs leading-6 text-cocoa/60">接入功能免费，模型调用费用由你的服务商账户承担。我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。</p></div><Link href="/consult" className="primary-link knowledge-assistant-button">接入模型 API，启动助手 <ArrowUpRight size={18} aria-hidden="true"/></Link></section>
  </main>;
}
