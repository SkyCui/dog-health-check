import AssessmentForm from "@/components/AssessmentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AssessmentPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          返回首页
        </Link>
        <div className="mb-7">
          <p className="text-sm font-semibold text-leaf">狗狗 1 分钟健康自测</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">选最接近日常情况的答案就好</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            这不是医疗诊断，也不预测寿命。它只是帮你快速看见当前生活习惯里最值得先关注的一件事。
          </p>
        </div>
        <AssessmentForm />
      </div>
    </main>
  );
}
