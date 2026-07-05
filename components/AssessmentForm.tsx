"use client";

import {
  Activity,
  Apple,
  Bone,
  ClipboardCheck,
  Home,
  PawPrint,
  ShieldAlert
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  AssessmentInput,
  BodyCondition,
  FoodType,
  HomeEnvironment,
  RecentSignal,
  Size,
  SnackLevel
} from "@/lib/types";

const STORAGE_KEY = "dogHealthAssessment";

const sizeOptions: { value: Size; label: string }[] = [
  { value: "small", label: "小型犬" },
  { value: "medium", label: "中型犬" },
  { value: "large", label: "大型犬" },
  { value: "unknown", label: "不确定" }
];

const bodyOptions: { value: BodyCondition; label: string; helper: string }[] = [
  { value: "thin", label: "偏瘦", helper: "肋骨明显，腰很细" },
  { value: "ideal", label: "刚刚好", helper: "能摸到肋骨，有腰线" },
  { value: "slightly_fat", label: "有点胖", helper: "肋骨不太好摸" },
  { value: "obese", label: "明显胖", helper: "肚子圆，走路容易喘" },
  { value: "unknown", label: "不确定", helper: "凭第一感觉也可以" }
];

const foodOptions: { value: FoodType; label: string }[] = [
  { value: "kibble", label: "狗粮" },
  { value: "canned", label: "罐头" },
  { value: "freeze_dried", label: "冻干" },
  { value: "fresh", label: "鲜食" },
  { value: "homemade", label: "自制" },
  { value: "mixed", label: "混合喂养" }
];

const snackOptions: { value: SnackLevel; label: string }[] = [
  { value: "low", label: "零食少" },
  { value: "medium", label: "中等" },
  { value: "high", label: "偏多" }
];

const movementOptions: {
  id: string;
  label: string;
  helper: string;
  movement: AssessmentInput["movement"];
}[] = [
  {
    id: "rare",
    label: "很少出门",
    helper: "主要在家活动",
    movement: { outdoorFrequency: "rare", dailyMinutes: "under_10", sniffing: "none" }
  },
  {
    id: "once_toilet_only",
    label: "每天 1 次",
    helper: "主要下楼上厕所",
    movement: { outdoorFrequency: "once_toilet_only", dailyMinutes: "under_10", sniffing: "little" }
  },
  {
    id: "one_to_two",
    label: "每天 1～2 次",
    helper: "累计 10～20 分钟",
    movement: { outdoorFrequency: "one_to_two", dailyMinutes: "10_20", sniffing: "normal" }
  },
  {
    id: "two_to_three",
    label: "每天 2～3 次",
    helper: "累计 30 分钟左右",
    movement: { outdoorFrequency: "two_to_three", dailyMinutes: "around_30", sniffing: "normal" }
  },
  {
    id: "two_plus_rich",
    label: "出门且能慢慢闻",
    helper: "有比较多嗅闻和探索",
    movement: { outdoorFrequency: "two_plus", dailyMinutes: "over_30", sniffing: "rich" }
  }
];

const recentOptions: { value: RecentSignal; label: string; urgent?: boolean }[] = [
  { value: "unstable_poop", label: "便便不稳定" },
  { value: "bad_breath", label: "口臭" },
  { value: "paw_licking_or_scratching", label: "舔爪 / 抓痒" },
  { value: "low_energy", label: "精神明显变差", urgent: true },
  { value: "appetite_change", label: "食欲明显变化", urgent: true },
  { value: "vomiting", label: "呕吐", urgent: true },
  { value: "diarrhea", label: "腹泻", urgent: true },
  { value: "pain", label: "明显疼痛", urgent: true },
  { value: "mobility_issue", label: "行动异常", urgent: true },
  { value: "normal", label: "最近都正常" }
];

const environmentOptions: { value: HomeEnvironment; label: string }[] = [
  { value: "aromatherapy", label: "香薰" },
  { value: "strong_cleaner", label: "刺激性清洁剂" },
  { value: "secondhand_smoke", label: "二手烟" },
  { value: "plastic_bowl", label: "塑料饭盆" },
  { value: "pesticide", label: "杀虫剂 / 草坪药剂" },
  { value: "none", label: "都没有" },
  { value: "unknown", label: "不确定" }
];

function toggleValue<T extends string>(current: T[], value: T, exclusiveValues: T[] = []) {
  if (exclusiveValues.includes(value)) {
    return [value];
  }

  const withoutExclusive = current.filter((item) => !exclusiveValues.includes(item));
  return withoutExclusive.includes(value)
    ? withoutExclusive.filter((item) => item !== value)
    : [...withoutExclusive, value];
}

function isMovementSelected(current: AssessmentInput["movement"], target: AssessmentInput["movement"]) {
  return (
    current.outdoorFrequency === target.outdoorFrequency &&
    current.dailyMinutes === target.dailyMinutes &&
    current.sniffing === target.sniffing
  );
}

function OptionButton({
  selected,
  children,
  onClick,
  tone = "default"
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "alert";
}) {
  const selectedClass = tone === "alert" ? "border-coral bg-red-50 text-ink" : "border-leaf bg-mint text-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm transition hover:border-leaf ${
        selected ? selectedClass : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function QuestionShell({
  step,
  title,
  children,
  icon
}: {
  step: string;
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-mint text-leaf">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-leaf">{step}</p>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AssessmentForm() {
  const router = useRouter();
  const [input, setInput] = useState<AssessmentInput>({
    dogName: "",
    age: "",
    breed: "",
    weight: "",
    size: "unknown",
    bodyCondition: "ideal",
    foodTypes: ["kibble"],
    snackLevel: "medium",
    movement: { outdoorFrequency: "two_to_three", dailyMinutes: "around_30", sniffing: "normal" },
    recentSignals: ["normal"],
    homeEnvironment: ["unknown"]
  });

  const canSubmit = useMemo(() => {
    return input.age.trim() && input.breed.trim() && input.foodTypes.length > 0;
  }, [input]);

  function submitAssessment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    router.push("/result");
  }

  return (
    <form onSubmit={submitAssessment} className="space-y-5">
      <QuestionShell step="问题 1 / 6" title="基础信息" icon={<PawPrint size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-4">
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">昵称，可选</span>
            <input
              value={input.dogName}
              onChange={(event) => setInput({ ...input, dogName: event.target.value })}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              placeholder="比如百万"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">年龄</span>
            <input
              required
              value={input.age}
              onChange={(event) => setInput({ ...input, age: event.target.value })}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              placeholder="3 岁"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">品种</span>
            <input
              required
              value={input.breed}
              onChange={(event) => setInput({ ...input, breed: event.target.value })}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              placeholder="柯基 / 串串"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-slate-700">体重，可选</span>
            <input
              value={input.weight}
              onChange={(event) => setInput({ ...input, weight: event.target.value })}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              placeholder="10kg"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {sizeOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.size === option.value}
              onClick={() => setInput({ ...input, size: option.value })}
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 2 / 6" title="它现在的身材更像哪一种？" icon={<Bone size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-5">
          {bodyOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.bodyCondition === option.value}
              onClick={() => setInput({ ...input, bodyCondition: option.value })}
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{option.helper}</span>
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 3 / 6" title="日常饮食和零食情况" icon={<Apple size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-6">
          {foodOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.foodTypes.includes(option.value)}
              onClick={() => setInput({ ...input, foodTypes: toggleValue(input.foodTypes, option.value) })}
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {snackOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.snackLevel === option.value}
              onClick={() => setInput({ ...input, snackLevel: option.value })}
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 4 / 6" title="运动与嗅闻" icon={<Activity size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-5">
          {movementOptions.map((option) => (
            <OptionButton
              key={option.id}
              selected={isMovementSelected(input.movement, option.movement)}
              onClick={() => setInput({ ...input, movement: option.movement })}
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{option.helper}</span>
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 5 / 6" title="最近一个月有没有这些信号？" icon={<ShieldAlert size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-5">
          {recentOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.recentSignals.includes(option.value)}
              tone={option.urgent ? "alert" : "default"}
              onClick={() =>
                setInput({
                  ...input,
                  recentSignals: toggleValue(input.recentSignals, option.value, ["normal"])
                })
              }
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 6 / 6" title="家庭环境里常接触这些吗？" icon={<Home size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-7">
          {environmentOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.homeEnvironment.includes(option.value)}
              onClick={() =>
                setInput({
                  ...input,
                  homeEnvironment: toggleValue(input.homeEnvironment, option.value, ["none", "unknown"])
                })
              }
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-lg bg-leaf px-6 py-3 text-base font-semibold text-white shadow-panel transition hover:bg-leaf/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <ClipboardCheck size={20} aria-hidden="true" />
          生成健康习惯 Dashboard
        </button>
      </div>
    </form>
  );
}
