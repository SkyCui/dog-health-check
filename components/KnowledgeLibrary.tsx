"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import guidance from "@/knowledge/consultation/guidance.json";
import sources from "@/knowledge/consultation/sources.json";

export default function KnowledgeLibrary() {
  const [query, setQuery] = useState("");
  const entries = guidance.entries.filter(entry => `${entry.title} ${entry.summary} ${entry.keywords.join(" ")}`.includes(query.trim()));
  return <main className="page-wrap"><div className="page-heading"><p className="eyebrow">免费开放 · 有据可查</p><h1>把养狗的疑问，一点点弄明白</h1><p>从日常喂养开始，找到可以实践的建议。每篇都附原始依据与适用边界。</p></div><label className="search-field"><Search size={20}/><input aria-label="搜索知识库" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索零食、体重、换粮、自制饮食…" /></label><p className="mt-4 text-sm text-cocoa/60">找到 {entries.length} 个主题</p><div className="knowledge-grid">{entries.map(entry => <article key={entry.id} className="knowledge-entry"><h2>{entry.title}</h2><p className="mt-3 leading-7 text-cocoa/80">{entry.summary}</p><h3 className="mt-5 font-bold">可以从这里开始</h3><ul className="mt-3 space-y-3">{entry.actions.map(action => <li key={action} className="flex gap-3 leading-6"><span className="text-rose">•</span>{action}</li>)}</ul><div className="knowledge-note">{entry.watchFor.map(note => <p key={note}>{note}</p>)}</div><details className="mt-4 text-sm"><summary className="cursor-pointer font-bold text-cocoa/65">查看原始依据与限制</summary>{entry.evidenceRefs.map(id => { const source = sources.sources.find(item => item.id === id); return source ? <div key={id} className="mt-3"><a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-rose">{source.organization} · {source.title} <ArrowUpRight className="inline" size={14}/></a><p className="mt-1 leading-6 text-cocoa/65">{source.limitations}</p></div> : null; })}</details></article>)}</div>{!entries.length ? <p className="py-12 text-center text-cocoa/60">暂时没有匹配的主题，试试更简短的关键词。</p> : null}<section className="section-band knowledge-assistant-cta" aria-labelledby="knowledge-assistant-title">
      <div className="knowledge-assistant-copy">
        <p className="eyebrow">让知识更贴近你家毛孩子</p>
        <h2 id="knowledge-assistant-title">接入自己的模型 API，启动 AI 助手</h2>
        <p className="mt-3 text-sm leading-7 text-cocoa/70">结合幸福自查与知识库，继续提问，获得适合你家狗狗的日常照护建议。</p>
        <p className="mt-2 text-xs leading-6 text-cocoa/60">接入功能免费，模型调用费用由你的服务商账户承担。</p>
      </div>
      <Link href="/consult" className="primary-link knowledge-assistant-button">接入模型 API，启动助手 <ArrowUpRight size={18} aria-hidden="true"/></Link>
    </section></main>;
}
