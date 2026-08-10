import AssessmentForm from "@/components/AssessmentForm";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AssessmentPage() {
  return (
    <main className="relative min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute right-8 top-24 text-5xl opacity-60">🦴</div>
      <div className="pointer-events-none absolute left-8 bottom-20 text-5xl opacity-60">🍪</div>
      <div className="relative mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose/20 bg-white/80 px-4 py-2 text-sm font-black text-cocoa shadow-panel transition hover:bg-white"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          返回首页
        </Link>
        <div className="mb-7 candy-card rounded-[2rem] p-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-goldSoft px-4 py-2 text-sm font-black text-gold">
            <Sparkles size={17} aria-hidden="true" />
            狗狗幸福观察
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.03em] text-ink">选最接近日常情况的答案就好</h1>
          <p className="mt-3 max-w-2xl leading-7 text-cocoa/75">
            前六题观察身体健康习惯，后四题请回看最近两周的行为变化。我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。
          </p>
        </div>
        <AssessmentForm />
      </div>
    </main>
  );
}
