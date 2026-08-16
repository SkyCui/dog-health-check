"use client";

import {
  Activity,
  Apple,
  Bone,
  ClipboardCheck,
  Camera,
  Brain,
  MoonStar,
  Users,
  Home,
  PawPrint,
  ShieldAlert,
  Trash2,
  Upload
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type {
  AssessmentInput,
  BodyCondition,
  FoodType,
  HomeEnvironment,
  DistressSignal,
  RecentSignal,
  Size,
  SnackLevel
} from "@/lib/types";

const STORAGE_KEY = "dogHealthAssessment";
const DEFAULT_DOG_PHOTO = "/images/default-dog-avatar.png";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function prepareDogPhoto(file: File) {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    throw new Error("请选择 JPG、PNG 或 WebP 图片。");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("照片不能超过 8MB，请换一张更小的图片。");
  }

  const source = await (async () => {
    if (typeof createImageBitmap === "function") return createImageBitmap(file);
    const url = URL.createObjectURL(file);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("照片无法读取，请换一张再试。"));
        image.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  })();
  const maxSide = 1200;
  const sourceWidth = "naturalWidth" in source ? source.naturalWidth : source.width;
  const sourceHeight = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    if ("close" in source) source.close();
    throw new Error("当前浏览器无法处理照片，请换个浏览器再试。");
  }
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  return canvas.toDataURL("image/jpeg", 0.84);
}

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
  { value: "obese", label: "明显胖", helper: "肚子圆，走路容易喘" }
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

const engagementOptions: { value: AssessmentInput["mentalState"]["positiveEngagement"]; label: string }[] = [
  { value: "often", label: "经常会主动邀请玩耍、期待散步或吃饭，并愿意闻嗅探索" },
  { value: "sometimes", label: "有时愿意参与，但兴趣或持续时间比平时少" },
  { value: "rare", label: "多数时候不太参与，或很快退出原本喜欢的活动" },
  { value: "unknown", label: "不确定或近期没有机会观察" }
];
const relaxationOptions: { value: AssessmentInput["mentalState"]["relaxation"]; label: string }[] = [
  { value: "easy", label: "能自行安静休息，睡眠姿势放松，普通刺激后能较快恢复" },
  { value: "sometimes_difficult", label: "偶尔需要较长时间才能平静或入睡" },
  { value: "often_difficult", label: "经常保持警觉、踱步、喘气、反复叫或难以安睡" },
  { value: "unknown", label: "不确定或近期没有机会观察" }
];
const socialOptions: { value: AssessmentInput["mentalState"]["socialConnection"]; label: string }[] = [
  { value: "secure", label: "会以自己喜欢的方式接近互动，也能自由离开、休息或独处" },
  { value: "variable", label: "有时愿意互动，有时明显回避或显得不自在" },
  { value: "withdrawn", label: "经常躲避、僵住、退缩，或无法安心离开、表现出异常黏附" },
  { value: "unknown", label: "不确定或不适合用社交行为判断" }
];
const distressOptions: { value: DistressSignal; label: string; urgent?: boolean }[] = [
  { value: "frequent_fear_or_hiding", label: "经常害怕、躲藏、僵住或试图逃离" },
  { value: "separation_distress", label: "独处时持续叫、破坏、喘气、流口水或无法平静" },
  { value: "persistent_pacing_or_vocalizing", label: "无明显原因持续踱步或反复叫" },
  { value: "repetitive_behavior", label: "反复转圈、追尾、舔咬或其他仪式化行为" },
  { value: "sudden_behavior_change", label: "性情、活动或互动方式突然与平时明显不同", urgent: true },
  { value: "aggression_safety_risk", label: "对人或动物出现具有现实伤害风险的攻击行为" },
  { value: "self_injury", label: "舔咬、撞击或其他行为已经造成自身受伤", urgent: true },
  { value: "none", label: "最近都没有" },
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
      className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:border-rose ${
        selected ? selectedClass : "border-rose/15 bg-white/90 text-cocoa"
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
    <section className="sticker-card rounded-[2rem] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-roseSoft text-rose shadow-sm">{icon}</div>
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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [input, setInput] = useState<AssessmentInput>({
    dogName: "",
    dogPhoto: "",
    age: "",
    breed: "",
    weight: "",
    size: "unknown",
    bodyCondition: "ideal",
    foodTypes: ["kibble"],
    snackLevel: "medium",
    movement: { outdoorFrequency: "two_to_three", dailyMinutes: "around_30", sniffing: "normal" },
    recentSignals: ["normal"],
    homeEnvironment: ["unknown"],
    mentalState: { positiveEngagement: "often", relaxation: "easy", socialConnection: "secure", distressSignals: ["none"] }
  });

  const canSubmit = useMemo(() => {
    return input.age.trim() && input.breed.trim() && input.foodTypes.length > 0;
  }, [input]);

  function submitAssessment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitError("");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
      router.push("/result");
    } catch {
      setSubmitError("浏览器存储空间不足。请移除照片或换一张更小的照片后再生成。");
    }
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const dogPhoto = await prepareDogPhoto(file);
      setInput((current) => ({ ...current, dogPhoto }));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "照片处理失败，请换一张再试。");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <form onSubmit={submitAssessment} className="space-y-5">
      <QuestionShell step="问题 1 / 10" title="基础信息" icon={<PawPrint size={20} aria-hidden="true" />}>
        <div className="mb-5 grid gap-4 rounded-[1.6rem] bg-gradient-to-br from-roseSoft to-goldSoft/70 p-4 sm:grid-cols-[9rem_1fr] sm:items-center">
          <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-panel">
            {input.dogPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={input.dogPhoto} alt="狗狗照片预览" className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={DEFAULT_DOG_PHOTO}
                alt="白色雪纳瑞默认头像"
                className="h-full w-full object-cover"
              />
            )}
            <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-goldSoft text-base">✨</span>
          </div>
          <div>
            <div className="flex items-center gap-2 font-black text-ink">
              <Camera size={20} className="text-rose" aria-hidden="true" />
              上传宝贝照片（可选）
            </div>
            <p className="mt-1 text-sm leading-6 text-cocoa/70">会放进结果分享卡，仅保存在当前浏览器。支持 JPG、PNG、WebP，最大 8MB。</p>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-rose shadow-sm ring-1 ring-rose/20 disabled:opacity-60"
              >
                <Upload size={16} aria-hidden="true" />
                {photoBusy ? "正在处理…" : input.dogPhoto ? "更换照片" : "选择照片"}
              </button>
              {input.dogPhoto ? (
                <button
                  type="button"
                  onClick={() => { setInput({ ...input, dogPhoto: "" }); setPhotoError(""); }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-cocoa/70 hover:bg-white/70"
                >
                  <Trash2 size={16} aria-hidden="true" /> 移除
                </button>
              ) : null}
            </div>
            {photoError ? <p role="alert" className="mt-2 text-sm font-bold text-red-600">{photoError}</p> : null}
          </div>
        </div>
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

      <QuestionShell step="问题 2 / 10" title="它现在的身材更像哪一种？" icon={<Bone size={20} aria-hidden="true" />}>
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
        <details className="mt-4 rounded-2xl bg-white/75 px-4 py-3 text-sm text-cocoa/75">
          <summary className="cursor-pointer font-bold text-rose">看不准？查看体况判断提示</summary>
          <p className="mt-2 leading-6">从上方看腰部是否收窄，从侧面看腹线是否上提，再轻摸肋骨。能摸到肋骨但不明显外露、腰线清楚，通常更接近“刚刚好”；不要只凭体重或毛量判断。</p>
        </details>
      </QuestionShell>

      <QuestionShell step="问题 3 / 10" title="日常饮食和零食情况" icon={<Apple size={20} aria-hidden="true" />}>
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

      <QuestionShell step="问题 4 / 10" title="运动与嗅闻" icon={<Activity size={20} aria-hidden="true" />}>
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

      <QuestionShell step="问题 5 / 10" title="最近一个月有没有这些信号？" icon={<ShieldAlert size={20} aria-hidden="true" />}>
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

      <QuestionShell step="问题 6 / 10" title="家庭环境里常接触这些吗？" icon={<Home size={20} aria-hidden="true" />}>
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

      <div className="rounded-[2rem] border border-rose/20 bg-white/70 px-5 py-4 text-sm leading-6 text-cocoa/75">
        下面四题请观察最近两周，并与它平时的状态相比。安静、独处或不爱社交本身不代表不幸福。
      </div>

      <QuestionShell step="问题 7 / 10" title="最近两周，它还会主动投入自己喜欢的活动吗？" icon={<Brain size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-2">
          {engagementOptions.map((option) => (
            <OptionButton key={option.value} selected={input.mentalState.positiveEngagement === option.value} onClick={() => setInput({ ...input, mentalState: { ...input.mentalState, positiveEngagement: option.value } })}>
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 8 / 10" title="日常活动或普通刺激结束后，它通常能放松下来吗？" icon={<MoonStar size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-2">
          {relaxationOptions.map((option) => (
            <OptionButton key={option.value} selected={input.mentalState.relaxation === option.value} onClick={() => setInput({ ...input, mentalState: { ...input.mentalState, relaxation: option.value } })}>
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 9 / 10" title="和熟悉的人或动物相处时，它是否能按自己的意愿互动或离开？" icon={<Users size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-2">
          {socialOptions.map((option) => (
            <OptionButton key={option.value} selected={input.mentalState.socialConnection === option.value} onClick={() => setInput({ ...input, mentalState: { ...input.mentalState, socialConnection: option.value } })}>
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <QuestionShell step="问题 10 / 10" title="最近两周，它是否经常出现以下行为？可多选" icon={<ShieldAlert size={20} aria-hidden="true" />}>
        <div className="grid gap-3 md:grid-cols-3">
          {distressOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.mentalState.distressSignals.includes(option.value)}
              tone={option.urgent ? "alert" : "default"}
              onClick={() => setInput({
                ...input,
                mentalState: {
                  ...input.mentalState,
                  distressSignals: toggleValue(input.mentalState.distressSignals, option.value, ["none", "unknown"])
                }
              })}
            >
              {option.label}
            </OptionButton>
          ))}
        </div>
      </QuestionShell>

      <div className="sticky bottom-4 z-10 flex justify-end">
        {submitError ? <p role="alert" className="mr-3 self-center rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700">{submitError}</p> : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="candy-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-black text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:grayscale"
        >
          <ClipboardCheck size={20} aria-hidden="true" />
          生成狗狗幸福卡
        </button>
      </div>
    </form>
  );
}
