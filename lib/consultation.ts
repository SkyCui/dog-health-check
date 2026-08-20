import consultationSourcesFile from "@/knowledge/consultation/sources.json";
import guidanceFile from "@/knowledge/consultation/guidance.json";
import safetyRules from "@/knowledge/consultation/safety-rules.json";
import assessmentSourcesFile from "@/knowledge/sources.json";
import { generateResult } from "./generateResult";
import type { AssessmentInput, EvidenceReference, GeneratedResult, SupportRoute } from "./types";

export type ConsultationTopic =
  | "daily_feeding" | "weight_management" | "treats" | "diet_transition"
  | "home_prepared" | "raw_food" | "feeding_enrichment" | "life_stage";

export type ConsultationPlanStep = { day: string; action: string };
export type ConsultationResponse = {
  mode: "guidance" | "safety";
  topic: ConsultationTopic | "safety";
  title: string;
  answer: string;
  plan: ConsultationPlanStep[];
  watchFor: string[];
  citations: EvidenceReference[];
  followUpPrompts: string[];
  safetyRoute: SupportRoute;
  knowledgeVersion: string;
  disclaimer: string;
};

type GuidanceEntry = (typeof guidanceFile.entries)[number];

const allSources = [...assessmentSourcesFile.sources, ...consultationSourcesFile.sources];
const sourceById = new Map(allSources.map((source) => [source.id, source]));
const disclaimer = "我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。";

function citationsFor(ids: readonly string[]): EvidenceReference[] {
  return ids.flatMap((id) => {
    const source = sourceById.get(id);
    return source ? [{ id: source.id, title: source.title, organization: source.organization, level: source.level as EvidenceReference["level"], url: source.url }] : [];
  });
}

function textHasAny(text: string, words: readonly string[]) {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function safetyResponse(result: GeneratedResult, message: string): ConsultationResponse | null {
  let safetyRoute: SupportRoute = "none";
  let title = "";
  let answer = "";

  if (result.status === "red_vet" || textHasAny(message, safetyRules.urgentKeywords)) {
    safetyRoute = "vet";
    title = "先确认健康安全，再谈喂养调整";
    answer = "当前信息包含需要优先由兽医确认的信号。本次不输出普通喂养、换粮或丰富化计划，也不要用食物变化代替检查。若正在出现呼吸困难、倒地、抽搐、腹胀伴反复干呕、剧烈疼痛或疑似中毒，请尽快联系附近兽医急诊。";
  } else if (textHasAny(message, safetyRules.medicalReviewKeywords)) {
    safetyRoute = "vet";
    title = "持续变化需要先联系兽医";
    answer = "你描述的是需要先确认原因的持续健康变化。本次不提供减餐、换粮或补充剂方案；请记录出现时间、频率、饮水、进食、排便和精神变化，并联系兽医评估。";
  } else if (result.status === "behavior_support" || textHasAny(message, safetyRules.behaviorSupportKeywords)) {
    safetyRoute = "veterinary_behavior";
    title = "先降低压力与风险，再调整互动";
    answer = "当前信息包含持续压力或现实安全风险。本次不输出普通喂养或训练计划。请先避免强迫、惩罚和直接暴露于触发场景，做好人与动物的安全隔离，并联系兽医行为科或采用奖励式方法的有资质行为专业人士。";
  }

  if (safetyRoute === "none") return null;
  return {
    mode: "safety", topic: "safety", title, answer, plan: [], watchFor: [result.supportReminder || "若信号加重或出现新的异常，请尽快联系兽医。"],
    citations: citationsFor(safetyRules.evidenceRefs), followUpPrompts: [], safetyRoute,
    knowledgeVersion: consultationSourcesFile.knowledgeVersion, disclaimer
  };
}

function contextualDefault(input: AssessmentInput): ConsultationTopic {
  if (input.bodyCondition === "slightly_fat" || input.bodyCondition === "obese") return "weight_management";
  if (input.snackLevel === "high") return "treats";
  if (input.foodTypes.includes("homemade") || input.foodTypes.includes("fresh")) return "home_prepared";
  if (input.movement.sniffing === "none" || input.movement.sniffing === "little" || input.mentalState.positiveEngagement === "rare") return "feeding_enrichment";
  return "daily_feeding";
}

function selectEntry(input: AssessmentInput, message: string): GuidanceEntry {
  const matches = guidanceFile.entries.map((entry) => ({
    entry,
    score: entry.keywords.reduce((total, keyword) => total + (message.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0), 0)
  }));
  const specificMatch = matches
    .filter(({ entry, score }) => entry.topic !== "daily_feeding" && score > 0)
    .sort((left, right) => right.score - left.score)[0];
  if (specificMatch) return specificMatch.entry;
  const dailyMatch = matches.find(({ entry, score }) => entry.topic === "daily_feeding" && score > 0);
  if (dailyMatch) return dailyMatch.entry;
  const topic = contextualDefault(input);
  return guidanceFile.entries.find((entry) => entry.topic === topic) ?? guidanceFile.entries[0];
}

function buildPlan(actions: readonly string[]): ConsultationPlanStep[] {
  const labels = ["今天", "第 2-3 天", "第 4-7 天"];
  return actions.slice(0, 3).map((action, index) => ({ day: labels[index], action }));
}

export function generateConsultation(input: AssessmentInput, message: string): ConsultationResponse {
  const result = generateResult(input);
  const safety = safetyResponse(result, message);
  if (safety) return safety;

  const entry = selectEntry(input, message);
  const dog = input.dogName?.trim() || "你家狗狗";
  const context = result.coreRisk.title === "继续保持"
    ? `${dog}目前的自测没有突出高优先级风险，适合先把稳定习惯做得更可记录。`
    : `结合自测中“${result.coreRisk.title}”这一优先关注点，先从最容易执行且不突然改变主食的步骤开始。`;

  return {
    mode: "guidance",
    topic: entry.topic as ConsultationTopic,
    title: entry.title,
    answer: `${context}${entry.summary}`,
    plan: buildPlan(entry.actions),
    watchFor: entry.watchFor,
    citations: citationsFor(entry.evidenceRefs),
    followUpPrompts: ["帮我把这份计划变成每日打卡清单", "结合零食情况再细化一步", "哪些变化出现时应该停止计划"],
    safetyRoute: "none",
    knowledgeVersion: consultationSourcesFile.knowledgeVersion,
    disclaimer
  };
}
