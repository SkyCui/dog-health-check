"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, KeyRound, Loader2, Send, Settings2, Square, Trash2, ThumbsUp, ThumbsDown, ClipboardList, ArrowUpRight } from "lucide-react";
import { askOwnModel, completionUrl, type ModelSettings } from "@/lib/byok";
import { planCare, replyText, careCitations, type CareReply } from "@/lib/careAgent";
import { loadMemory, saveMemory, petMemoryKey, type SavedConversation } from "@/lib/careMemory";
import policy from "@/knowledge/consultation/agent-policy.json";
import { parseAssessmentInput } from "@/lib/assessmentProtocol";
import type { AssessmentInput, EvidenceReference } from "@/lib/types";

type Message = SavedConversation & { reply?: CareReply; validation?: string; citations?: EvidenceReference[] };
const blank: ModelSettings = { baseUrl: "", model: "", apiKey: "" };

export default function ConsultationChat() {
  const [assessment, setAssessment] = useState<AssessmentInput | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<ModelSettings>(blank);
  const [configured, setConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [remember, setRemember] = useState(false);
  const [rememberChat, setRememberChat] = useState(false);
  const [consent, setConsent] = useState(false);
  const [shareRecords, setShareRecords] = useState(false);
  const [mode, setMode] = useState<"knowledge" | "model">("knowledge");
  const [items, setItems] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement | null>(null);
  const settingsPanel = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dogHealthAssessment");
      const input = raw ? parseAssessmentInput(JSON.parse(raw)).input ?? null : null;
      setAssessment(input);
      const key = petMemoryKey(input);
      const keep = localStorage.getItem(key + ":remember-chat") === "true"; setRememberChat(keep);
      if (keep) setItems(loadMemory(key).conversation.map(item => ({ ...item, citations: careCitations(item.evidenceIds ?? []) })));
      const saved = localStorage.getItem("dogcareModelPreferences");
      if (saved) { const value = JSON.parse(saved); setSettings({ baseUrl: typeof value.baseUrl === "string" ? value.baseUrl : "", model: typeof value.model === "string" ? value.model : "", apiKey: "" }); setRemember(true); }
      const prompt = new URLSearchParams(window.location.search).get("prompt");
      if (prompt === "review") setQuestion("帮我复盘最近的照护记录");
      else if (prompt) setQuestion(prompt.slice(0, 300));
    } catch { setStorageError("本机资料暂时无法读取；仍可查询知识库。"); }
    setReady(true);
    return () => controller.current?.abort();
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [items, busy]);
  useEffect(() => {
    if (showSettings && window.matchMedia("(max-width: 900px)").matches) settingsPanel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showSettings]);
  useEffect(() => {
    if (!ready) return;
    try {
      const key = petMemoryKey(assessment);
      localStorage.setItem(key + ":remember-chat", String(rememberChat));
      const saved = loadMemory(key);
      saveMemory(key, { ...saved, conversation: rememberChat ? items.slice(-30).map(item => ({ role: item.role, content: item.content, evidenceIds: item.evidenceIds ?? [], ...(item.feedback ? { feedback: item.feedback } : {}) })) : [] });
    } catch { setStorageError("对话保存失败。你仍可继续使用，请检查浏览器存储空间。"); }
  }, [items, rememberChat, ready, assessment]);

  function saveSettings() {
    try {
      completionUrl(settings.baseUrl);
      if (!settings.model.trim() || !settings.apiKey.trim()) throw new Error("请填写模型名称与 API 密钥。");
      if (!consent) throw new Error("请先确认向所选服务商发送问题与测评文字资料。");
      if (remember) localStorage.setItem("dogcareModelPreferences", JSON.stringify({ baseUrl: settings.baseUrl, model: settings.model }));
      else localStorage.removeItem("dogcareModelPreferences");
      setConfigured(true); setShowSettings(false); setMode("model"); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "配置未完成。"); }
  }

  async function submit(text: string) {
    if (busy || !ready || !text.trim()) return;
    const clean = text.trim().slice(0, 1000);
    let records: string[] = [];
    try {
      if (clean.includes("复盘") || (mode === "model" && shareRecords)) {
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 6); cutoff.setHours(0, 0, 0, 0);
        records = loadMemory(petMemoryKey(assessment)).records.filter(record => new Date(record.date + "T00:00:00") >= cutoff).slice(-7).map(record => JSON.stringify(record));
      }
    } catch { setStorageError("本机观察记录无法读取，本次仅使用问题和测评资料。"); }
    const review = clean.includes("复盘");
    const contextHistory = records.length && review ? [...items, { role: "user" as const, content: "最近观察记录：" + records.join("\n") }] : items;
    const plan = planCare(assessment, clean, contextHistory);
    if (mode === "model" && plan.reply.route === "knowledge" && !configured) { setShowSettings(true); setError("填写自己的 API 配置后即可使用模型细化。你也可以切回免费知识库建议。"); return; }
    setBusy(true); setError(""); setQuestion("");
    setItems(current => [...current, { role: "user", content: clean }]);
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 60000);
    try {
      let reply = plan.reply;
      let citations = plan.citations;
      let validation = "local";
      if (review && mode === "knowledge" && reply.route === "knowledge") {
        reply = plan.reply.route === "safety" ? plan.reply : { ...reply, summary: records.length ? "已读取最近 " + records.length + " 天本机观察。记录只能帮助回顾，不用于诊断或证明健康改善。请特别关注反复出现的「与平时不同」，并结合具体情境与兽医讨论。" : "还没有观察记录。先从今天记下进食、精神、便便与平时是否相近，再回来复盘。", followUpQuestion: records.length ? "哪一项变化反复出现？从什么时候开始？" : "今天哪一项最值得记下来？" };
      }
      if (mode === "model" && plan.reply.route === "knowledge") {
        const output = await askOwnModel(settings, assessment, clean, shareRecords ? contextHistory : items, abort.signal, shareRecords ? records : []);
        reply = output.reply; citations = output.evidence.citations; validation = output.validation;
      }
      setItems(current => [...current, { role: "assistant", content: replyText(reply), reply, citations, evidenceIds: citations.map(source => source.id), validation }]);
    } catch (reason) {
      setError(abort.signal.aborted ? "请求已停止，可重新发送。服务商可能已计算请求费用。" : reason instanceof TypeError ? "连接失败，请检查地址、网络和服务商浏览器跨域权限。可切回免费知识库建议继续使用。" : reason instanceof Error ? reason.message : "请求失败，请重试。");
      setQuestion(clean); setItems(current => current.slice(0, -1));
    } finally { clearTimeout(timeout); controller.current = null; setBusy(false); }
  }
  const update = (field: keyof ModelSettings, value: string) => { setSettings(current => ({ ...current, [field]: value })); setConfigured(false); };
  const feedback = (index: number, value: "helpful" | "unhelpful") => setItems(current => current.map((item, i) => i === index ? { ...item, feedback: value } : item));
  return <main className="page-wrap consult-page">
    <header className="consult-page-heading"><div className="page-heading"><p className="eyebrow">有依据，记得住，能跟进</p><h1>AI顾问</h1><p>先用知识库找方向，再结合你家情况聊。当前专注狗狗日常照护，不提供疾病诊断。</p></div><button disabled={busy} onClick={() => { setShowSettings(true); setMode("model"); }} className="consult-connect-button"><KeyRound size={17}/>接入自己的模型 API<ArrowUpRight size={16}/></button></header>
    <div className="consult-layout"><aside className="consult-sidebar">
      <section className="care-profile"><img src={assessment?.dogPhoto || "/images/default-dog-avatar.png"} alt="当前狗狗档案"/><div><h2>{assessment?.dogName || "认识你的毛孩子"}</h2><p>{assessment ? `${assessment.breed} · ${assessment.age}` : "没有档案也可以先提问"}</p><Link href="/assessment">{assessment ? "更新幸福自查" : "建立免费档案"} <ArrowUpRight size={13}/></Link></div></section>
      <Link href="/companion" className="companion-entry"><ClipboardList size={20}/><span>陪伴记录<small>今天观察，过几天再复盘</small></span><ArrowUpRight size={16}/></Link>
      <section className="settings-panel" ref={settingsPanel}><div className="flex items-center justify-between gap-2"><h2 className="font-bold"><KeyRound size={18} className="mr-2 inline"/>接入自己的模型 API</h2><button title="修改模型配置" aria-expanded={showSettings} onClick={() => setShowSettings(!showSettings)} disabled={busy} className="icon-button"><Settings2 size={18}/></button></div><p className="mt-2 break-words text-sm text-cocoa/65">{configured ? settings.model : "接入免费，模型费用由你的账户承担"}</p>
      {showSettings ? <div className="mt-5 space-y-4">
        <label className="field-label">API 基础地址<input type="url" value={settings.baseUrl} disabled={busy} onChange={e => update("baseUrl", e.target.value)} placeholder="https://你的服务商/v1" /></label>
        <label className="field-label">模型名称<input value={settings.model} disabled={busy} onChange={e => update("model", e.target.value)} placeholder="服务商提供的模型 ID" /></label>
        <label className="field-label">API 密钥<input type="password" autoComplete="off" value={settings.apiKey} disabled={busy} onChange={e => update("apiKey", e.target.value)} placeholder="仅当前页面使用" /></label>
        <p className="text-xs leading-5 text-cocoa/60">支持允许浏览器跨域访问的 Chat Completions 接口。密钥只发送给所填服务商，刷新后清除。建议使用低额度专用密钥。</p>
        <label className="check-label"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>记住地址与模型名称，不保存密钥</label>
        <label className="check-label"><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setConfigured(false); }}/>我同意将问题、最近对话及测评文字资料发送至上述服务商；照片不会发送。</label>
        <label className="check-label"><input type="checkbox" checked={shareRecords} onChange={e => setShareRecords(e.target.checked)}/>同时向模型提供最近 7 天的照护记录（可选）</label>
        <button disabled={busy} onClick={saveSettings} className="primary-link w-full justify-center">使用此配置</button>
      </div> : !configured ? <button onClick={() => { setShowSettings(true); setMode("model"); }} className="mt-4 font-bold text-rose">接入 API，启动 AI 助手 →</button> : null}
      {configured ? <button onClick={() => { setSettings(blank); setConfigured(false); setMode("knowledge"); localStorage.removeItem("dogcareModelPreferences"); }} disabled={busy} className="mt-4 inline-flex items-center gap-2 text-sm text-cocoa/60"><Trash2 size={15}/>清除模型配置</button> : null}</section>
      <section className="py-5"><p className="eyebrow">平台模型 · 待更新</p><p className="mt-2 text-sm leading-6 text-cocoa/70">暂时没有密钥？可以先用免费知识库建议。需要平台模型时，私信或进入群聊回复「需要Token」。</p></section>
      <Link href="/knowledge" className="inline-flex items-center gap-2 font-bold text-rose"><BookOpen size={18}/>浏览全部知识与来源</Link>
    </aside><section className="chat-workspace" aria-label="养狗顾问对话">
      <div className="chat-mode" role="group" aria-label="选择回答方式"><button disabled={busy} aria-pressed={mode === "knowledge"} onClick={() => setMode("knowledge")}><BookOpen size={16}/>免费知识库建议</button><button disabled={busy} aria-pressed={mode === "model"} onClick={() => { setMode("model"); if (!configured) setShowSettings(true); }}><KeyRound size={16}/>我的模型细化</button></div>
      <div className="chat-heading"><span className="status-dot"/>{mode === "knowledge" ? "按知识条目回答，无模型费用" : configured ? "已配置 · 发送后连接自己的模型" : "先填写 API 配置，或切回知识库建议"}</div>
      <div className="chat-messages" aria-live="polite">{!ready ? <p>正在读取本机资料…</p> : !items.length ? <div className="chat-empty"><img src="/images/default-dog-avatar.png" alt="白色雪纳瑞"/><h2>今天最想改善哪件小事？</h2><p>{assessment ? `已准备好${assessment.dogName || "毛孩子"}的自查资料。` : "可以直接提问，也可以先建档，让建议更贴近你家情况。"}先从一个具体问题开始。</p><div className="prompt-grid">{policy.starterQuestions.map(text => <button key={text} onClick={() => submit(text)}>{text}</button>)}</div></div> : items.map((item, index) => <article key={index} className={"chat-message " + item.role + (item.reply?.route === "safety" ? " safety-message" : "")}>
        {item.reply ? <><p className="answer-kind">{item.reply.route === "safety" ? "优先处理安全" : item.validation === "references_checked" ? "模型细化 · 来源 ID 已校验" : "知识库建议"}</p><h2 className="mt-2 text-lg font-bold">{item.reply.title}</h2><p className="mt-3 whitespace-pre-wrap break-words leading-7">{item.reply.summary}</p>{item.reply.actions.length ? <ol className="answer-actions">{item.reply.actions.map((action, i) => <li key={i}><span>{i + 1}</span><p>{action.text}</p></li>)}</ol> : null}{item.reply.watchFor.length ? <div className="answer-watch"><h3>什么时候需要停下或求助</h3>{item.reply.watchFor.map(text => <p key={text}>{text}</p>)}</div> : null}<p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-7">{item.reply.followUpQuestion}</p>{item.validation === "fallback" ? <p className="mt-3 text-xs leading-5 text-cocoa/65">模型回复未通过格式或来源检查，已显示原始知识库建议，不展示未经校验内容。</p> : null}</> : <p className="whitespace-pre-wrap break-words leading-7">{item.content}</p>}
        {item.citations?.length ? <details className="mt-4 text-xs"><summary className="cursor-pointer">查看原始来源 · 引用校验不等于临床验证</summary>{item.citations.map(source => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="mt-2 block leading-6 text-rose">{source.organization} · {source.title}</a>)}</details> : null}
        {item.role === "assistant" ? <div className="answer-feedback"><button aria-label="这条建议有帮助" aria-pressed={item.feedback === "helpful"} onClick={() => feedback(index, "helpful")}><ThumbsUp size={15}/>{item.feedback === "helpful" ? "已记为有帮助" : "有帮助"}</button><button aria-label="这条建议没有解决问题" aria-pressed={item.feedback === "unhelpful"} onClick={() => { feedback(index, "unhelpful"); setQuestion("刚才的建议不适合我，具体情况是："); }}><ThumbsDown size={15}/>还没解决</button><Link href="/companion">记下今天的变化</Link></div> : null}
      </article>)}{busy ? <p className="flex items-center gap-2 text-sm text-cocoa/60"><Loader2 size={17} className="animate-spin"/>正在结合资料整理建议…</p> : null}<div ref={end}/></div>
      <form className="chat-composer" onSubmit={e => { e.preventDefault(); submit(question); }}><textarea aria-label="咨询问题" value={question} onChange={e => setQuestion(e.target.value)} maxLength={1000} rows={2} disabled={busy || !ready} placeholder="例如：它不喜欢刷牙，我可以从哪一步开始？"/>{busy ? <button type="button" className="icon-button" title="停止生成" onClick={() => controller.current?.abort()}><Square size={19}/></button> : <button className="icon-button send-button" title="发送问题" disabled={!ready || !question.trim()}><Send size={19}/></button>}</form>
      {error ? <p role="alert" className="px-5 pb-4 text-sm leading-6 text-red-700">{error}</p> : null}
      <div className="chat-memory"><label className="check-label"><input type="checkbox" checked={rememberChat} onChange={e => setRememberChat(e.target.checked)}/>仅在本机保留最近 30 条对话，方便下次继续</label><button title="清空当前对话" disabled={busy} onClick={() => { if (!items.length || confirm("清空当前对话？观察记录会保留。")) setItems([]); }} className="icon-button"><Trash2 size={15}/></button></div>
      {storageError ? <p className="px-5 pb-3 text-xs text-cocoa/60">{storageError}</p> : null}
      <p className="px-5 pb-4 text-xs leading-5 text-cocoa/55">我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。模型可能出错，请结合原始来源核对。</p>
    </section></div>
  </main>;
}
