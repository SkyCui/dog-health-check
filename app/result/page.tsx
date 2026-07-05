"use client";

import DashboardCard from "@/components/DashboardCard";
import DimensionBars from "@/components/DimensionBars";
import ScoreRing from "@/components/ScoreRing";
import ShareCopyCard from "@/components/ShareCopyCard";
import TodayActionCard from "@/components/TodayActionCard";
import VetReminderCard from "@/components/VetReminderCard";
import { generateResult } from "@/lib/generateResult";
import type { AssessmentInput, GeneratedResult } from "@/lib/types";
import { ArrowLeft, ClipboardList, HeartPulse, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "dogHealthAssessment";

export default function ResultPage() {
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const rawInput = localStorage.getItem(STORAGE_KEY);
    if (!rawInput) {
      setLoaded(true);
      return;
    }

    try {
      const input = JSON.parse(rawInput) as AssessmentInput;
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
        <p className="text-slate-600">正在生成健康习惯 Dashboard...</p>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-panel">
          <h1 className="text-2xl font-bold text-ink">还没有自测结果</h1>
          <p className="mt-3 leading-7 text-slate-600">先完成 6 个轻量问题，就能生成 Dashboard。</p>
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

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            返回自测
          </Link>
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-500">本地规则生成，不替代兽医诊断</p>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-leaf">
                <HeartPulse size={18} aria-hidden="true" />
                狗狗 1 分钟健康自测看板
              </p>
              <h1 className="mt-3 text-3xl font-bold text-ink">{result.statusText}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{result.coreConclusion}</p>
            </div>
            <ScoreRing score={result.longevityScore} />
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <DashboardCard title="五维小指标" eyebrow="狗狗长寿习惯指数">
            <DimensionBars scores={result.dimensionScores} />
            <p className="mt-4 text-sm leading-6 text-slate-500">
              这些分数代表生活习惯友好程度，不是疾病评分、寿命预测或医疗诊断。
            </p>
          </DashboardCard>

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

        <div className="mt-5">
          <VetReminderCard reminder={result.vetReminder} urgent={urgent} />
        </div>

        <div className="mt-5">
          <ShareCopyCard allowShare={result.allowShare} shareCopy={result.shareCopy} result={result} />
        </div>
      </div>
    </main>
  );
}
