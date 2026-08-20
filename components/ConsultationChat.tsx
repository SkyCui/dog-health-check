"use client";

import type { ConsultationResponse } from "@/lib/consultation";
import type { AssessmentInput } from "@/lib/types";
import { ArrowLeft, BookOpen, Crown, ExternalLink, LockKeyhole, Send, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ASSESSMENT_KEY = "dogHealthAssessment";
const ACCESS_KEY = "dogCareConsultAccessV1";
const FREE_TURNS = 5;

type ChatItem = { id: string; role: "user"; text: string } | { id: string; role: "assistant"; response: ConsultationResponse };
type AccessState = { sessionId: string; turns: number; plus: boolean };

const prompts = [
  "根据测评，帮我安排一周喂养节奏",
  "零食怎么控制更容易坚持？",
  "怎样用吃饭增加嗅闻和快乐？",
  "自制或鲜食适合长期当主食吗？"
];

function loadAccess(): AccessState {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCESS_KEY) || "null") as AccessState | null;
    if (saved && typeof saved.turns === "number") return saved;
  } catch {}
  return { sessionId: crypto.randomUUID(), turns: 0, plus: false };
}

export default function ConsultationChat({ checkoutUrl }: { checkoutUrl: string }) {
  const [assessment, setAssessment] = useState<AssessmentInput | null>(null);
  const [access, setAccess] = useState<AccessState | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ASSESSMENT_KEY);
      if (raw) setAssessment(JSON.parse(raw) as AssessmentInput);
    } catch {
      localStorage.removeItem(ASSESSMENT_KEY);
    }
    setAccess(loadAccess());
  }, []);

  const locked = useMemo(() => Boolean(access && !access.plus && access.turns >= FREE_TURNS), [access]);
  const remaining = access ? Math.max(0, FREE_TURNS - access.turns) : FREE_TURNS;

  async function submit(text: string) {
    const clean = text.trim();
    if (!clean || !assessment || !access || locked || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setItems((current) => [...current, { id: crypto.randomUUID(), role: "user", text: clean }]);
    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment, message: clean })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "咨询暂时不可用");
      setItems((current) => [...current, { id: crypto.randomUUID(), role: "assistant", response: body as ConsultationResponse }]);
      const next = { ...access, turns: access.turns + 1 };
      setAccess(next);
      localStorage.setItem(ACCESS_KEY, JSON.stringify(next));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "咨询暂时不可用，请稍后重试。" );
    } finally {
      setBusy(false);
    }
  }

  if (!assessment || !access) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="sticker-card max-w-md rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-black text-ink">先完成幸福自测</h1>
          <p className="mt-3 leading-7 text-cocoa/70">咨询会结合毛孩子的 10 题观察结果，不能脱离信息直接给计划。</p>
          <Link href="/assessment" className="candy-button mt-5 inline-flex rounded-full px-5 py-3 font-black text-white">去完成自测</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/result" className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black text-cocoa shadow-panel">
            <ArrowLeft size={17} /> 返回档案
          </Link>
          <p className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-cocoa/65 sm:text-sm">首个咨询会话免费 · 还可追问 {remaining} 轮</p>
        </header>

        <section className="candy-card mt-4 overflow-hidden rounded-[1.75rem] sm:mt-6 sm:rounded-[2.2rem]">
          <div className="border-b border-rose/15 bg-white/55 px-4 py-5 sm:px-7">
            <p className="inline-flex items-center gap-2 text-sm font-black text-rose"><Sparkles size={17} /> 身心喂养知识库顾问</p>
            <h1 className="mt-2 text-2xl font-black text-ink sm:text-3xl">为{assessment.dogName?.trim() || "毛孩子"}制定容易坚持的一步</h1>
            <p className="mt-2 text-sm leading-6 text-cocoa/70 sm:text-base">结合刚才的健康与精神观察，只引用知识库中的兽医指南和同行评审依据。</p>
          </div>

          <div className="min-h-[360px] space-y-5 px-4 py-5 sm:min-h-[440px] sm:px-7">
            {items.length === 0 ? (
              <div className="mx-auto max-w-2xl py-4 text-center sm:py-10">
                <BookOpen className="mx-auto text-rose" size={34} />
                <h2 className="mt-3 text-xl font-black text-ink">今天最想先解决哪件事？</h2>
                <p className="mt-2 text-sm leading-6 text-cocoa/65">我会给出短期行动、需要观察的变化和原始出处，不推荐具体品牌。</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {prompts.map((prompt) => <button key={prompt} onClick={() => submit(prompt)} className="rounded-2xl border border-rose/20 bg-white/85 px-4 py-3 text-left text-sm font-bold leading-6 text-cocoa transition hover:border-rose hover:bg-white">{prompt}</button>)}
                </div>
              </div>
            ) : null}

            {items.map((item) => item.role === "user" ? (
              <div key={item.id} className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-sm leading-6 text-white sm:max-w-[72%]">{item.text}</div>
            ) : (
              <article key={item.id} className={`max-w-3xl rounded-2xl border p-4 sm:p-5 ${item.response.mode === "safety" ? "border-red-200 bg-red-50" : "border-rose/15 bg-white/90"}`}>
                <div className="flex items-start gap-3">
                  {item.response.mode === "safety" ? <ShieldAlert className="mt-1 shrink-0 text-red-600" size={21} /> : <Sparkles className="mt-1 shrink-0 text-rose" size={21} />}
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-ink">{item.response.title}</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-cocoa/80 sm:text-base">{item.response.answer}</p>
                  </div>
                </div>
                {item.response.plan.length ? <div className="mt-4 grid gap-2 sm:grid-cols-3">{item.response.plan.map((step) => <div key={step.day} className="rounded-xl bg-roseSoft/65 p-3"><p className="text-xs font-black text-rose">{step.day}</p><p className="mt-1 text-sm leading-6 text-cocoa">{step.action}</p></div>)}</div> : null}
                {item.response.watchFor.length ? <div className="mt-4 rounded-xl bg-goldSoft/65 p-3"><p className="text-xs font-black text-gold">需要留意</p>{item.response.watchFor.map((text) => <p key={text} className="mt-1 text-sm leading-6 text-cocoa/80">{text}</p>)}</div> : null}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-black text-cocoa/55">本次依据</p>
                  <div className="mt-2 flex flex-wrap gap-2">{item.response.citations.map((citation) => <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"><span className="truncate">{citation.level} · {citation.organization}</span><ExternalLink size={12} /></a>)}</div>
                  <p className="mt-3 text-xs leading-5 text-cocoa/55">{item.response.disclaimer}</p>
                </div>
              </article>
            ))}

            {locked ? (
              <section className="mx-auto max-w-2xl rounded-2xl border border-gold/25 bg-goldSoft/55 p-5 text-center sm:p-7">
                <Crown className="mx-auto text-gold" size={34} />
                <h2 className="mt-3 text-2xl font-black text-ink">继续咨询，升级 Plus 永久会员</h2>
                <p className="mt-2 leading-7 text-cocoa/70">¥9.99 一次购买，解锁不限次知识库咨询、个性化身心喂养计划和可核验出处。</p>
                {checkoutUrl ? <a href={checkoutUrl} className="candy-button mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-black text-white"><Crown size={18} /> ¥9.99 永久解锁</a> : <button disabled className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-slate-200 px-6 py-3 font-black text-slate-500"><LockKeyhole size={18} /> 支付接入准备中</button>}
                <p className="mt-3 text-xs leading-5 text-cocoa/55">Plus 提供个性化知识建议，不包含真人兽医或营养师咨询。</p>
              </section>
            ) : null}
          </div>

          <div className="border-t border-rose/15 bg-white/70 p-3 sm:p-5">
            <form onSubmit={(event) => { event.preventDefault(); submit(message); }} className="mx-auto flex max-w-3xl items-end gap-2">
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} disabled={locked || busy} rows={2} maxLength={1000} placeholder={locked ? "升级 Plus 后可以继续咨询" : "描述你最想改善的喂养或身心状态问题…"} className="min-h-[52px] flex-1 resize-none rounded-2xl border border-rose/20 bg-white px-4 py-3 text-sm leading-6 text-ink outline-none disabled:bg-slate-100" />
              <button type="submit" disabled={!message.trim() || locked || busy} title="发送" className="candy-button grid h-12 w-12 shrink-0 place-items-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-45"><Send size={19} /></button>
            </form>
            {error ? <p className="mx-auto mt-2 max-w-3xl text-sm font-bold text-red-600">{error}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
