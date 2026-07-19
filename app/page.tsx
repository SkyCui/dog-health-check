import PuppyIllustration from "@/components/PuppyIllustration";
import { ArrowRight, Camera, Gift, HeartPulse, PawPrint, Sparkles } from "lucide-react";
import Link from "next/link";

const highlights = [
  { icon: Camera, title: "观察身体", text: "从体况、饮食、活动和近期状态了解健康习惯。" },
  { icon: Gift, title: "理解心情", text: "关注参与、放松、选择感和持续压力行为。" },
  { icon: Sparkles, title: "只做一件事", text: "结合身心双指标，先做最值得做的小行动。" }
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-8 top-28 text-5xl opacity-70">🦴</div>
      <div className="pointer-events-none absolute right-10 top-36 text-5xl opacity-70">🍪</div>
      <div className="pointer-events-none absolute bottom-16 left-12 text-5xl opacity-60">🧸</div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rose to-gold text-2xl text-white shadow-candy">
              🐶
            </div>
            <div>
              <p className="text-sm font-bold text-rose">百万是人类的好朋友</p>
              <h1 className="text-xl font-black text-ink">你的狗狗幸福吗？</h1>
            </div>
          </div>
          <Link
            href="/assessment"
            className="hidden items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition hover:scale-[1.02] sm:inline-flex candy-button"
          >
            开始生成
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </header>

        <section className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="py-4">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-gold shadow-panel ring-1 ring-gold/20">
              <Sparkles size={17} aria-hidden="true" />
              身体健康 + 精神状态双支柱
            </p>
            <h2 className="max-w-3xl text-5xl font-black leading-tight tracking-[-0.04em] text-ink sm:text-6xl">
              你的狗狗幸福吗？
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cocoa/80">
              完成 10 个轻量题组，从身体健康习惯和最近两周的行为变化，生成一份可追溯依据的幸福观察卡。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 rounded-full px-6 py-4 text-base font-black text-white transition hover:scale-[1.02] candy-button"
              >
                开始幸福自查
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <span className="inline-flex items-center rounded-full border border-rose/20 bg-white/75 px-5 py-4 text-sm font-bold text-cocoa shadow-panel">
                循证轻量自查 Beta · 不替代专业评估
              </span>
            </div>
          </div>

          <div className="candy-card paw-bg rounded-[2.4rem] p-5">
            <div className="rounded-[2rem] bg-white/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-rose">分享卡预览</p>
                  <h3 className="mt-1 text-3xl font-black text-ink">百万的幸福小档案</h3>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-goldSoft text-3xl shadow-panel">
                  💌
                </div>
              </div>
              <PuppyIllustration className="mt-4" />
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl bg-white p-4 shadow-panel ring-1 ring-rose/10">
                      <Icon className="text-rose" size={22} aria-hidden="true" />
                      <p className="mt-2 font-black text-ink">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-cocoa/70">{item.text}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-3xl bg-roseSoft p-4 text-sm font-bold leading-6 text-cocoa">
                <PawPrint className="mr-2 inline text-rose" size={18} aria-hidden="true" />
                结果只保留一个核心关注点和一个今日行动，避免把自测变成压力报告。
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["📷", "照片卡片", "上传自家宠物照片，自动放进圆角头像框，搭配贴纸装饰。"],
            ["🎀", "可爱问卷", "每题像小贴纸选择，不再是冷冰冰的表单。"],
            ["🍪", "分享闭环", "结果页强化保存图片、复制文案、邀请朋友也测一张。"]
          ].map(([emoji, title, text]) => (
            <div key={title} className="sticker-card rounded-[2rem] p-5">
              <div className="text-3xl">{emoji}</div>
              <h3 className="mt-3 text-xl font-black text-ink">{title}</h3>
              <p className="mt-2 leading-7 text-cocoa/75">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
