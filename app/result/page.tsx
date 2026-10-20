"use client";

import DashboardCard from "@/components/DashboardCard";
import DimensionBars from "@/components/DimensionBars";
import MentalDimensionBars from "@/components/MentalDimensionBars";
import ScoreRing from "@/components/ScoreRing";
import ShareCopyCard from "@/components/ShareCopyCard";
import TodayActionCard from "@/components/TodayActionCard";
import VetReminderCard from "@/components/VetReminderCard";
import { generateResult } from "@/lib/generateResult";
import type { AssessmentInput, GeneratedResult } from "@/lib/types";
import { ArrowLeft, BookOpen, ClipboardList, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dogHealthAssessment";

export default function ResultPage() {
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [assessment, setAssessment] = useState<AssessmentInput | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const rawInput = localStorage.getItem(STORAGE_KEY);
    if (!rawInput) {
      setLoaded(true);
      return;
    }

    try {
      const input = JSON.parse(rawInput) as AssessmentInput;
      setAssessment(input);
      setResult(generateResult(input));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <p className="text-slate-600">正在整理毛孩子的幸福档案…</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-panel">
          <h1 className="text-2xl font-bold text-ink">还没有自测结果</h1>
          <p className="mt-3 leading-7 text-slate-600">先完成 10 个轻量题组，就能生成幸福档案。</p>
          <Link
            href="/assessment"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-leaf px-5 py-3 font-semibold text-white transition hover:bg-leaf/90"
          >
            <ClipboardList size={19} aria-hidden="true" />
            去自测
          </Link>
        </section>
      </main>
    );
  }

  const urgent = result.status === "red_vet";
  const needsSupport = result.supportRoute !== "none";
  const confidenceLabel = result.assessmentConfidence === "high" ? "高可信" : result.assessmentConfidence === "medium" ? "中可信" : "信息不足";
  const formatPillarScore = (score: number | null) => score === null ? "未生成" : `${score} 分`;

  return (
    <main className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <span className="pointer-events-none absolute right-6 top-28 text-5xl opacity-50" aria-hidden="true">🦴</span>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-full border border-rose/20 bg-white/80 px-4 py-2 text-sm font-black text-cocoa shadow-panel transition hover:bg-white"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            返回自测
          </Link>
          <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-cocoa/70 shadow-panel">我助力你更好了解毛孩子，但无法替代兽医或行为专业评估</p>
        </div>

        <section className="candy-card paw-bg rounded-[2.2rem] p-5 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-rose">
                <Sparkles size={18} aria-hidden="true" />
                {assessment?.dogName?.trim() ? `${assessment.dogName.trim()}的幸福小档案` : "狗狗幸福小档案"}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-ink">{result.statusText}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-cocoa/75">{result.coreConclusion}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ScoreRing score={result.happinessScore} />
              <p className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-cocoa/70">
                覆盖率 {Math.round(result.answeredCoverage * 100)}% · {confidenceLabel}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <DashboardCard title="健康五维" eyebrow={`身体健康习惯 ${formatPillarScore(result.healthScore)}`}>
            <DimensionBars scores={result.healthDimensionScores} />
            <p className="mt-4 text-sm leading-6 text-slate-500">
              健康维度来自生活习惯观察，不是疾病评分、寿命预测或医疗诊断。
            </p>
          </DashboardCard>

          <DashboardCard title="精神四维" eyebrow={`精神福祉 ${formatPillarScore(result.mentalWellbeingScore)}`}>
            <MentalDimensionBars scores={result.mentalDimensionScores} />
            <p className="mt-4 text-sm leading-6 text-slate-500">请结合最近两周与它自身平时状态的变化理解，不以活泼或服从程度判断幸福。</p>
          </DashboardCard>
        </div>

        <div className="mt-5">
          <DashboardCard title="做得好的地方" eyebrow="先肯定已经在发生的好事">
            <div className="space-y-3">
              {result.strengths.map((strength) => (
                <div key={strength} className="flex gap-3 rounded-lg bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 shrink-0 text-leaf" size={19} aria-hidden="true" />
                  <p className="leading-6 text-slate-700">{strength}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1fr]">
          <DashboardCard title="最值得关注的风险" eyebrow="只看一个优先级">
            <p className="text-2xl font-bold text-ink">{result.coreRisk.title}</p>
            <p className="mt-3 leading-7 text-slate-700">{result.coreRisk.reason}</p>
          </DashboardCard>
          <TodayActionCard title={result.todayAction.title} body={result.todayAction.body} />
        </div>

        {needsSupport ? <div className="mt-5"><VetReminderCard reminder={result.supportReminder} urgent={urgent} title={urgent ? "就医提醒" : "行为专业支持提醒"} /></div> : null}

        <section className="section-band">
          <div><p className="eyebrow">把了解变成陪伴</p><h2 className="mt-2">{needsSupport ? "先按提醒寻求专业支持" : "今天先做一件事，明天再多懂它一点"}</h2><p className="mt-3 max-w-2xl leading-7 text-cocoa/70">{needsSupport ? "当前信号需要专业评估，请优先联系兽医或行为专业人士。" : "免费知识库帮你理解日常照护；接入自己的模型，可以结合这份档案继续聊。"}</p></div>
          <div className="flex shrink-0 flex-col gap-3"><Link href="/knowledge" className="primary-link"><BookOpen size={18}/>浏览免费知识库</Link>{!needsSupport ? <Link href="/consult" className="inline-flex items-center justify-center gap-2 px-4 py-3 font-bold text-rose"><KeyRound size={18}/>免费接入自己的模型</Link> : null}</div>
        </section>

        <div className="mt-5">
          <ShareCopyCard allowShare={result.allowShare} shareCopy={result.shareCopy} result={result} assessment={assessment} />
        </div>
      </div>
    </main>
  );
}
