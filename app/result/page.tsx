"use client";

import DashboardCard from "@/components/DashboardCard";
import DimensionBars from "@/components/DimensionBars";
import MentalDimensionBars from "@/components/MentalDimensionBars";
import ScoreRing from "@/components/ScoreRing";
import ShareCopyCard from "@/components/ShareCopyCard";
import VetReminderCard from "@/components/VetReminderCard";
import { generateResult } from "@/lib/generateResult";
import type { AssessmentInput, GeneratedResult } from "@/lib/types";
import { ArrowLeft, ArrowRight, BookOpen, ClipboardList, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [assessment, setAssessment] = useState<AssessmentInput | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dogHealthAssessment");
      if (raw) { const input = JSON.parse(raw) as AssessmentInput; setAssessment(input); setResult(generateResult(input)); }
    } catch { /* Invalid or unavailable local data can be replaced by a new assessment. */ }
    setLoaded(true);
  }, []);
  if (!loaded) return <main className="page-wrap py-20"><p role="status">正在整理毛孩子的幸福档案…</p></main>;
  if (!result) return <main className="page-wrap py-20"><div className="page-heading"><p className="eyebrow">从了解开始</p><h1>还没有自测结果</h1><p>完成10个轻量题组，生成幸福观察卡和今天的一步行动。</p></div><Link href="/assessment" className="primary-link"><ClipboardList size={18}/>幸福自查</Link></main>;

  const urgent = result.status === "red_vet";
  const needsSupport = result.supportRoute !== "none";
  const confidenceLabel = result.assessmentConfidence === "high" ? "高可信" : result.assessmentConfidence === "medium" ? "中可信" : "信息不足";
  const score = (value: number | null) => value === null ? "未生成" : String(value);
  const age = assessment?.age?.trim() || "";
  const displayAge = /^\d+(\.\d+)?$/.test(age) ? age + "岁" : age;
  return <main className="page-wrap result-page">
    <Link href="/assessment" className="mb-5 inline-flex items-center gap-2 text-sm text-cocoa"><ArrowLeft size={16}/>返回自测</Link>
    <section className="result-hero" aria-labelledby="result-title">
      <div className="result-profile"><img src={assessment?.dogPhoto || "/images/default-dog-avatar.png"} alt="当前狗狗头像"/><div><p>{assessment?.dogName?.trim() || "毛孩子"}的幸福观察卡</p><small>{assessment?.breed} {displayAge ? "· " + displayAge : ""}</small></div></div>
      <div className="result-headline"><div><h1 id="result-title">{result.statusText}</h1><p className="conclusion">{result.coreConclusion}</p><p className="result-coverage">观察覆盖率 {Math.round(result.answeredCoverage * 100)}% · {confidenceLabel} · 自查仍处于 Beta，不是医疗诊断</p></div><div className="result-score-layout"><ScoreRing score={result.happinessScore}/><div className="result-pillars"><div><span>健康习惯</span><b>{score(result.healthScore)}</b></div><div><span>精神状态</span><b>{score(result.mentalWellbeingScore)}</b></div></div></div></div>
    </section>
    {needsSupport ? <div className="mt-6"><VetReminderCard reminder={result.supportReminder} urgent={urgent} title={urgent ? "优先联系兽医" : "优先寻求行为专业支持"}/></div> : <section className="result-action"><p className="eyebrow">今天先做这一件事</p><h2 className="mt-2">{result.todayAction.title}</h2><p>{result.todayAction.body}</p><Link href="/companion">记到今天的陪伴记录 <ArrowRight size={16}/></Link></section>}
    <section className="result-detail"><p className="eyebrow">只看一个优先关注点</p><h2 className="mt-2 text-xl font-bold">{result.coreRisk.title}</h2><p className="mt-3 leading-7 text-cocoa">{result.coreRisk.reason}</p></section>
    <section className="result-detail"><h2 className="text-lg font-bold">做得好的地方</h2><div className="result-strengths">{result.strengths.map(strength => <div key={strength}><ShieldCheck size={19}/><p>{strength}</p></div>)}</div></section>
    <details className="result-detail" open><summary>身体与精神，分别看看</summary><div className="result-dimensions"><DashboardCard title="健康五维" eyebrow={"身体健康习惯 " + score(result.healthScore)}><DimensionBars scores={result.healthDimensionScores}/><p className="mt-4 text-xs leading-6 text-cocoa/70">观察习惯，不是疾病评分或寿命预测。</p></DashboardCard><DashboardCard title="精神四维" eyebrow={"精神福祉 " + score(result.mentalWellbeingScore)}><MentalDimensionBars scores={result.mentalDimensionScores}/><p className="mt-4 text-xs leading-6 text-cocoa/70">回看最近两周，与它自身平时的状态相比，不以活泼或服从判断幸福。</p></DashboardCard></div></details>
    <section className="section-band"><div><p className="eyebrow">了解之后，继续陪伴</p><h2 className="mt-2">{needsSupport ? "先按提醒获得专业支持" : "把今天的一步，变成日常的好习惯"}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-cocoa/75">{needsSupport ? "当前信号需要专业评估。知识库和记录仅作资料整理，不能替代就医或行为干预。" : "从狗狗幸福指南找方向，用自己的模型继续聊，再把观察记下来。"}</p></div><div className="flex shrink-0 flex-col gap-3"><Link href="/knowledge" className="primary-link"><BookOpen size={18}/>狗狗幸福指南</Link>{!needsSupport ? <Link href="/consult" className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose"><KeyRound size={18}/>接入模型 API，启动助手</Link> : null}</div></section>
    <ShareCopyCard allowShare={result.allowShare} shareCopy={result.shareCopy} result={result} assessment={assessment}/>
    <section className="section-band"><div><p className="eyebrow">明天再多懂它一点</p><h2 className="mt-2">把今天记下来。</h2><p className="mt-3 text-sm leading-7 text-cocoa/70">仅保存在本机，可导出备份，并主动添加复盘提醒。</p></div><Link href="/companion" className="primary-link"><ClipboardList size={18}/>陪伴记录</Link></section>
    <p className="mt-8 text-xs leading-6 text-cocoa/65">我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。</p>
  </main>;
}
