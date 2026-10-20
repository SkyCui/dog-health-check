"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, KeyRound, Loader2, Send, Settings2, Square, Trash2 } from "lucide-react";
import { askOwnModel, completionUrl, type ModelSettings, type ModelTurn } from "@/lib/byok";
import { parseAssessmentInput } from "@/lib/assessmentProtocol";
import type { AssessmentInput, EvidenceReference } from "@/lib/types";

type Message = ModelTurn & { citations?: EvidenceReference[] };
const blank: ModelSettings = { baseUrl: "", model: "", apiKey: "" };

export default function ConsultationChat() {
  const [assessment, setAssessment] = useState<AssessmentInput | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<ModelSettings>(blank);
  const [configured, setConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [remember, setRemember] = useState(false);
  const [consent, setConsent] = useState(false);
  const [items, setItems] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dogHealthAssessment");
      if (raw) setAssessment(parseAssessmentInput(JSON.parse(raw)).input ?? null);
      const saved = localStorage.getItem("dogcareModelPreferences");
      if (saved) { const value = JSON.parse(saved); setSettings({ baseUrl: typeof value.baseUrl === "string" ? value.baseUrl : "", model: typeof value.model === "string" ? value.model : "", apiKey: "" }); setRemember(true); }
    } catch { /* Invalid local drafts can be replaced by a new assessment. */ }
    setReady(true);
    return () => controller.current?.abort();
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [items, busy]);

  function saveSettings() {
    try {
      completionUrl(settings.baseUrl);
      if (!settings.model.trim() || !settings.apiKey.trim()) throw new Error("请填写模型名称与 API 密钥。");
      if (!consent) throw new Error("请先确认向所选服务商发送问题与测评文字资料。");
      if (remember) localStorage.setItem("dogcareModelPreferences", JSON.stringify({ baseUrl: settings.baseUrl, model: settings.model }));
      else localStorage.removeItem("dogcareModelPreferences");
      setConfigured(true); setShowSettings(false); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "配置未完成。"); }
  }

  function clearSettings() {
    controller.current?.abort(); setSettings(blank); setConfigured(false); setConsent(false); setShowSettings(true); setItems([]); localStorage.removeItem("dogcareModelPreferences");
  }

  async function submit(text: string) {
    if (!assessment || busy || !text.trim()) return;
    if (!configured) { setShowSettings(true); setError("先接入自己的模型，再开始对话。也可以直接浏览免费知识库。"); return; }
    const clean = text.trim().slice(0, 1000);
    setBusy(true); setError(""); setQuestion("");
    setItems(current => [...current, { role: "user", content: clean }]);
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 60000);
    try {
      const result = await askOwnModel(settings, assessment, clean, items, abort.signal);
      setItems(current => [...current, { role: "assistant", content: result.text, citations: result.evidence.citations }]);
    } catch (reason) {
      setError(abort.signal.aborted ? "请求已停止，可重新发送。服务商可能已计算请求费用。" : reason instanceof TypeError ? "连接失败：请检查网络、API 地址及服务商的浏览器跨域权限。本版本不经过平台转发。" : reason instanceof Error ? reason.message : "请求失败，请重试。");
      setQuestion(clean); setItems(current => current.slice(0, -1));
    } finally { clearTimeout(timeout); controller.current = null; setBusy(false); }
  }

  const update = (field: keyof ModelSettings, value: string) => { setSettings(current => ({ ...current, [field]: value })); setConfigured(false); };
  return <main className="page-wrap">
    <div className="page-heading"><p className="eyebrow">你选模型，我们提供知识依据</p><h1>更懂你家毛孩子的养狗顾问</h1><p>免费接入自己的模型 API，结合幸福自查聊聊下一步。模型费用由你的服务商账户承担。</p></div>
    <div className="consult-layout"><aside className="consult-sidebar">
      <section className="settings-panel"><div className="flex items-center justify-between gap-2"><h2 className="font-bold"><KeyRound size={18} className="mr-2 inline"/>我的模型</h2><button title="修改模型配置" onClick={() => setShowSettings(!showSettings)} disabled={busy} className="icon-button"><Settings2 size={18}/></button></div><p className="mt-2 break-words text-sm text-cocoa/65">{configured ? settings.model : "尚未连接"}</p>
      {showSettings ? <div className="mt-5 space-y-4">
        <label className="field-label">API 基础地址<input type="url" value={settings.baseUrl} disabled={busy} onChange={e => update("baseUrl", e.target.value)} placeholder="https://你的服务商/v1" /></label>
        <label className="field-label">模型名称<input value={settings.model} disabled={busy} onChange={e => update("model", e.target.value)} placeholder="服务商提供的模型 ID" /></label>
        <label className="field-label">API 密钥<input type="password" autoComplete="off" value={settings.apiKey} disabled={busy} onChange={e => update("apiKey", e.target.value)} placeholder="仅当前页面使用" /></label>
        <p className="text-xs leading-5 text-cocoa/60">支持允许浏览器跨域访问的 Chat Completions 兼容接口。密钥只发送给所填服务商，不在本工具保存。请使用低额度、可撤销的专用密钥。</p>
        <label className="check-label"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>记住地址与模型名称，不保存密钥</label>
        <label className="check-label"><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setConfigured(false); }}/>我同意将问题、最近对话及测评文字资料发送至上述服务商；照片不会发送。</label>
        <button disabled={busy} onClick={saveSettings} className="primary-link w-full justify-center">使用此配置</button>
      </div> : null}
      <button onClick={clearSettings} disabled={busy} className="mt-4 inline-flex items-center gap-2 text-sm text-cocoa/60"><Trash2 size={15}/>清除配置与对话</button></section>
      <section className="py-6"><p className="eyebrow">平台模型 · 待更新</p><h2 className="mt-2 font-bold">暂时没有 API 密钥？</h2><p className="mt-2 text-sm leading-6 text-cocoa/70">可以私信或进入群聊，回复「需要Token」，了解后续接入方式。平台付费服务暂未开放。</p></section>
      <Link href="/knowledge" className="inline-flex items-center gap-2 font-bold text-rose"><BookOpen size={18}/>先逛免费知识库</Link>
    </aside><section className="chat-workspace" aria-label="养狗顾问对话">
      <div className="chat-heading"><span className="status-dot"/>{configured ? "已配置 · 发送后连接模型" : "接入模型后开始对话"}</div>
      <div className="chat-messages" aria-live="polite">{!ready ? <p>正在读取本机资料…</p> : !assessment ? <div className="chat-empty"><h2>先认识一下你的狗狗</h2><p>完成自查后，顾问就能结合它的身体习惯与近期行为回答。</p><Link className="primary-link" href="/assessment">免费完成幸福自查</Link></div> : !items.length ? <div className="chat-empty"><img src="/images/default-dog-avatar.png" alt="白色雪纳瑞"/><h2>今天最想改善哪件小事？</h2><p>已准备好{assessment.dogName || "毛孩子"}的测评资料。先配置模型，再选一个问题聊聊。</p><div className="prompt-grid">{["零食怎么控制更容易坚持？", "帮我安排一周喂养节奏", "怎样增加嗅闻和快乐？", "自制鲜食要注意什么？"].map(text => <button key={text} onClick={() => submit(text)}>{text}</button>)}</div></div> : items.map((item, index) => <article key={index} className={"chat-message " + item.role}><p className="whitespace-pre-wrap break-words leading-7">{item.content}</p>{item.citations ? <details className="mt-4 text-xs"><summary className="cursor-pointer">本次知识依据 · 模型生成内容请结合原文核对</summary>{item.citations.map(source => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="mt-2 block text-rose">{source.organization} · {source.title}</a>)}</details> : null}</article>)}{busy ? <p className="flex items-center gap-2 text-sm text-cocoa/60"><Loader2 size={17} className="animate-spin"/>模型正在整理建议…</p> : null}<div ref={end}/></div>
      <form className="chat-composer" onSubmit={e => { e.preventDefault(); submit(question); }}><textarea aria-label="咨询问题" value={question} onChange={e => setQuestion(e.target.value)} maxLength={1000} rows={2} disabled={busy || !assessment} placeholder="描述你最想改善的一件事…"/>{busy ? <button type="button" className="icon-button" title="停止生成" onClick={() => controller.current?.abort()}><Square size={19}/></button> : <button className="icon-button send-button" title="发送问题" disabled={!assessment || !question.trim()}><Send size={19}/></button>}</form>
      {error ? <p role="alert" className="px-5 pb-4 text-sm leading-6 text-red-700">{error}</p> : null}
      <p className="px-5 pb-4 text-xs leading-5 text-cocoa/55">我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。</p>
    </section></div>
  </main>;
}
