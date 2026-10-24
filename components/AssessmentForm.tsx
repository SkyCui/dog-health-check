"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
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
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSizeWeightReview, parseWeightKg, parseAssessmentInput } from "@/lib/assessmentProtocol";
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
const DRAFT_KEY = "dogcareAssessmentDraft";
const AssessmentStepContext = createContext(1);
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

const recentObservationOptions: { value: RecentSignal; label: string }[] = [
  { value: "unstable_poop", label: "便便持续或反复不稳定" },
  { value: "bad_breath", label: "口臭" },
  { value: "paw_licking_or_scratching", label: "持续舔爪 / 抓痒" },
  { value: "persistent_cough", label: "持续或反复咳嗽" },
  { value: "drinking_or_urination_change", label: "饮水或排尿明显变化" },
  { value: "unexplained_weight_change", label: "无明显原因的体重变化" },
  { value: "appetite_change", label: "持续或明显食欲变化" }
];

const recentUrgentOptions: { value: RecentSignal; label: string }[] = [
  { value: "low_energy", label: "突然精神很差或反应迟钝" },
  { value: "vomiting", label: "短时间内反复呕吐" },
  { value: "diarrhea", label: "严重或带血腹泻" },
  { value: "pain", label: "明显或剧烈疼痛" },
  { value: "mobility_issue", label: "突然站不稳或无法行走" },
  { value: "breathing_difficulty", label: "安静时呼吸费力或张口呼吸" },
  { value: "collapse_seizure_or_fainting", label: "晕倒、抽搐或意识异常" },
  { value: "swollen_abdomen_or_unproductive_retching", label: "腹部突然胀大并反复干呕" }
];

const recentNormalOption: { value: RecentSignal; label: string } = { value: "normal", label: "最近都正常" };

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
  tone = "default",
  disabled = false
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "alert";
  disabled?: boolean;
}) {
  const selectedClass = tone === "alert" ? "border-coral bg-red-50 text-ink" : "border-leaf bg-mint text-ink";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`assessment-option min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-medium transition hover:border-rose ${
        selected ? selectedClass : "border-rose/15 bg-white/90 text-cocoa"
      } disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0`}
    >
      <span>{children}</span><span className={`option-indicator ${selected ? "selected" : ""}`} aria-hidden="true" />
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
  const activeStep = useContext(AssessmentStepContext);
  const number = Number(step.match(/\d+/)?.[0]);
  return (
    <section hidden={number !== activeStep} className="assessment-question" aria-labelledby={`question-${number}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-roseSoft text-rose shadow-sm">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-leaf">{step}</p>
          <h2 id={`question-${number}`} tabIndex={-1} className="text-lg font-semibold text-ink">{title}</h2>
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
  const [step, setStep] = useState(1);
  const [draftReady, setDraftReady] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        const parsed = parseAssessmentInput({ ...saved.input, age: saved.input?.age || "未填写", breed: saved.input?.breed || "未填写" });
        if (parsed.input && typeof saved.input.age === "string" && typeof saved.input.breed === "string") {
          setInput({ ...parsed.input, age: saved.input.age, breed: saved.input.breed, dogPhoto: typeof saved.input.dogPhoto === "string" && saved.input.dogPhoto.startsWith("data:image/") ? saved.input.dogPhoto : "" });
          setStep(Number.isInteger(saved.step) && saved.step >= 1 && saved.step <= 10 ? saved.step : 1);
          setDraftNotice("已恢复上次填写的进度，仅保存在此浏览器。");
        }
      }
    } catch { setDraftNotice("暂时无法恢复进度，可重新填写。"); }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ input, step })); }
    catch { setDraftNotice("草稿保存失败，请检查浏览器空间；可移除照片后重试。"); }
  }, [input, step, draftReady]);

  useEffect(() => {
    if (!draftReady) return;
    document.getElementById(`question-${step}`)?.focus({ preventScroll: true });
  }, [step, draftReady]);

  function changeStep(next: number) {
    setSubmitError("");
    if (next > step) {
      if (step === 1 && (!input.age.trim() || !input.breed.trim())) { setSubmitError("请填写年龄和品种，混血犬可填写串串。"); return; }
      if (step === 1 && input.weight?.trim() && parseWeightKg(input.weight) === null) { setSubmitError("请填写大于0的体重，单位为kg；也可以留空。"); return; }
      if (step === 3 && !input.foodTypes.length) { setSubmitError("请至少选择一种食物。"); return; }
      if ((step === 5 && !input.recentSignals.length) || (step === 6 && !input.homeEnvironment.length) || (step === 10 && !input.mentalState.distressSignals.length)) { setSubmitError("请至少选择一个最接近实际情况的答案。"); return; }
    }
    setStep(Math.max(1, Math.min(10, next)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canSubmit = useMemo(() => {
    return input.age.trim() && input.breed.trim() && input.foodTypes.length > 0;
  }, [input]);
  const sizeWeightReview = useMemo(() => {
    const weightKg = input.weight?.trim() ? parseWeightKg(input.weight) : null;
    return weightKg === null ? null : getSizeWeightReview(weightKg, input.size);
  }, [input.size, input.weight]);

  function submitAssessment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 10) { changeStep(step + 1); return; }
    if (!canSubmit) return;

    setSubmitError("");
    const parsed = parseAssessmentInput(input);
    if (!parsed.input) { setSubmitError("请检查答案是否完整：" + parsed.errors.join("；")); return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed.input, dogPhoto: input.dogPhoto }));
      localStorage.removeItem(DRAFT_KEY);
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
    <AssessmentStepContext.Provider value={step}><form noValidate onSubmit={submitAssessment} className="assessment-form">
      <div className="assessment-progress"><div><span>{step <= 6 ? "身体与日常习惯" : "最近两周的精神状态"}</span><span>{String(step).padStart(2, "0")} / 10</span></div><div role="progressbar" aria-label="自查进度" aria-valuenow={step} aria-valuemin={1} aria-valuemax={10}><span style={{ width: `${step * 10}%` }}/></div></div>
      {draftNotice ? <p className="draft-notice" role="status">{draftNotice}</p> : null}
      <QuestionShell step="问题 1 / 10" title="基础信息" icon={<PawPrint size={20} aria-hidden="true" />}>
        <p className="mb-5 text-sm leading-7 text-cocoa/70">先认识一下你家狗狗。前六题看身体与习惯，后四题看最近两周的行为变化。不替代专业评估。</p>
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
            <span className="mb-2 block text-sm font-medium text-slate-700">体重，可选（kg）</span>
            <input
              value={input.weight}
              onChange={(event) => setInput({ ...input, weight: event.target.value })}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              inputMode="decimal"
              placeholder="例如 6.5"
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
        <p className="mt-3 text-xs leading-5 text-cocoa/55">体型是家长对成年体格的描述，不由当前体重自动决定，也不参与评分。胖瘦请根据下一题的肋骨、腰线和腹线上提判断。</p>
        {sizeWeightReview ? <div role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-gold/30 bg-goldSoft/75 px-3 py-2 text-sm font-bold leading-6 text-cocoa"><ShieldAlert className="mt-0.5 shrink-0 text-gold" size={17} aria-hidden="true" /><span>{sizeWeightReview}</span></div> : null}
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

      <QuestionShell step="问题 5 / 10" title="最近有没有这些健康信号？" icon={<ShieldAlert size={20} aria-hidden="true" />}>
        <p className="mb-3 text-sm font-semibold text-cocoa/70">最近一个月持续或反复出现</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recentObservationOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.recentSignals.includes(option.value)}
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
        <p className="mb-3 mt-5 text-sm font-semibold text-rose">现在或近期出现的危险信号</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recentUrgentOptions.map((option) => (
            <OptionButton
              key={option.value}
              selected={input.recentSignals.includes(option.value)}
              tone="alert"
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
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4">
          <OptionButton
            selected={input.recentSignals.includes(recentNormalOption.value)}
            onClick={() => setInput({ ...input, recentSignals: [recentNormalOption.value] })}
          >
            {recentNormalOption.label}
          </OptionButton>
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

      <div hidden={step < 7} className="mental-observation-note">
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

      {(step === 5 && input.recentSignals.some(signal => recentUrgentOptions.some(option => option.value === signal))) || (step === 10 && input.mentalState.distressSignals.some(signal => signal === "self_injury" || signal === "sudden_behavior_change")) ? <p className="assessment-safety" role="alert">你选择了需要优先确认的危险信号。如果正在发生，请立即联系兽医，不必等待完成自查。</p> : null}
      <div className="assessment-controls">
        {submitError ? <p role="alert" className="mr-3 self-center rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700">{submitError}</p> : null}
        <div className="assessment-control-row"><button type="button" onClick={() => changeStep(step - 1)} disabled={step === 1} className="assessment-back"><ArrowLeft size={17}/>上一步</button>
        <button
          key={step === 10 ? "generate-result" : "continue-assessment"}
          type={step === 10 ? "submit" : "button"}
          onClick={step < 10 ? () => changeStep(step + 1) : undefined}
          disabled={photoBusy || (step === 10 && !canSubmit)}
          className="sunny-primary"
        >
          {step === 10 ? <><ClipboardCheck size={20} aria-hidden="true"/>生成狗狗幸福卡</> : <>下一步<ArrowRight size={18}/></>}
        </button></div><p>填写进度仅保存在此浏览器 · 不上传照片</p>
      </div>
    </form></AssessmentStepContext.Provider>
  );
}
