import { ArrowRight, BarChart3, ClipboardList, HeartPulse } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-leaf text-white">
              <HeartPulse size={23} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">百万是人类的好朋友</p>
              <h1 className="text-xl font-bold text-ink">狗狗 1 分钟健康自测</h1>
            </div>
          </div>
          <Link
            href="/assessment"
            className="hidden items-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf/90 sm:inline-flex"
          >
            开始自测
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </header>

        <section className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="py-4">
            <p className="mb-4 inline-flex rounded-lg bg-mint px-3 py-1.5 text-sm font-semibold text-leaf">
              6 个轻量问题，本地规则生成结果
            </p>
            <h2 className="max-w-3xl text-4xl font-bold leading-tight text-ink sm:text-5xl">
              快速看看狗狗当前最值得关注的一件小事
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              从体况、饮食、运动嗅闻、近期状态和家庭环境出发，生成一个清楚、温和、可执行的健康习惯 Dashboard。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-lg bg-leaf px-5 py-3 text-base font-semibold text-white shadow-panel transition hover:bg-leaf/90"
              >
                开始自测
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600">
                不登录，不上传，不接数据库
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-leaf">Dashboard 预览</p>
                <h3 className="mt-1 text-2xl font-bold text-ink">长寿习惯指数</h3>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-amberSoft text-amber-700">
                <BarChart3 size={26} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-[9rem_1fr]">
              <div className="grid aspect-square place-items-center rounded-full bg-[conic-gradient(#2f7d5c_282deg,#e7ece7_0deg)]">
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-ink">78</div>
                    <div className="text-xs text-slate-500">/ 100</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {["体况", "饮食", "运动嗅闻", "近期状态", "家庭环境"].map((label, index) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="text-slate-500">{[72, 82, 88, 90, 78][index]}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-leaf"
                        style={{ width: `${[72, 82, 88, 90, 78][index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-mint p-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-0.5 text-leaf" size={20} aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-700">
                  结果只保留一个核心风险和一个今日行动，避免把自测变成复杂报告。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
