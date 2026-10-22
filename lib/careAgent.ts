import guidance from "@/knowledge/consultation/guidance.json";
import careSources from "@/knowledge/consultation/sources.json";
import assessmentSources from "@/knowledge/sources.json";
import safety from "@/knowledge/consultation/safety-rules.json";
import policy from "@/knowledge/consultation/agent-policy.json";
import { generateResult } from "./generateResult";
import type { AssessmentInput, EvidenceReference } from "./types";

export type CareRoute = "knowledge" | "safety" | "clarify" | "outside";
export type CareAction = { text: string; evidenceIds: string[] };
export type CareReply = {
  route: CareRoute;
  title: string;
  summary: string;
  actions: CareAction[];
  watchFor: string[];
  followUpQuestion: string;
  evidenceIds: string[];
};
export type CarePlan = { reply: CareReply; citations: EvidenceReference[]; entries: typeof guidance.entries; knowledgeVersion: string };
export type CareTurn = { role: "user" | "assistant"; content: string };
const sources = new Map([...assessmentSources.sources, ...careSources.sources].map(source => [source.id, source]));
export const careSource = (id: string) => sources.get(id);
const contains = (text: string, terms: readonly string[]) => terms.some(term => text.toLowerCase().includes(term.toLowerCase()));

export function careCitations(ids: string[]): EvidenceReference[] {
  return [...new Set(ids)].flatMap(id => { const source = sources.get(id); return source ? [{ id, title: source.title, organization: source.organization, url: source.url, level: source.level as EvidenceReference["level"] }] : []; });
}

export function planCare(input: AssessmentInput | null, question: string, history: CareTurn[] = []): CarePlan {
  const result = input ? generateResult(input) : null;
  // Prior user observations remain relevant during a follow-up in the same conversation.
  const observations = [...history.filter(turn => turn.role === "user").slice(-3).map(turn => turn.content), question].join("。");
  const urgent = contains(observations, safety.urgentKeywords) || result?.status === "red_vet";
  const medical = contains(observations, safety.medicalReviewKeywords) || Boolean(input?.recentSignals.some(signal => safety.medicalReviewRecentSignals.includes(signal)));
  const behavior = contains(observations, safety.behaviorSupportKeywords) || result?.status === "behavior_support";
  const pack = (reply: CareReply, entries: typeof guidance.entries = []): CarePlan => ({ reply, entries, citations: careCitations(reply.evidenceIds), knowledgeVersion: guidance.knowledgeVersion });
  if (urgent || medical || behavior) {
    return pack({ route: "safety", title: urgent ? "优先联系兽医急诊" : behavior ? "先管理风险并寻求行为专业支持" : "先联系兽医确认持续变化", summary: urgent ? "描述中有需要优先确认的危险信号。请尽快联系附近兽医急诊，不等待模型回答或打卡，不自行喂药、催吐或换粮处理。" : behavior ? "先避免强迫、惩罚和再次暴露于触发场景；有伤害风险时做好安全隔离，并联系兽医行为科或有资质的行为专业人士。" : "这些健康变化需要先确认原因。请联系兽医，整理起始时间、频率和伴随变化；暂不提供换粮、减餐或药物方案。", actions: [], watchFor: urgent ? ["记录可以稍后补充，不能因此推迟急诊。"] : ["若出现呼吸困难、倒地抽搐或明显疼痛，请及时急诊。"], followUpQuestion: "需要整理就诊前的观察资料时，可以到「陪伴记录」导出已有记录。", evidenceIds: safety.evidenceRefs });
  }
  if (contains(question, policy.outsideKeywords)) return pack({ route: "outside", title: "当前专注犬只日常照护", summary: "目前知识库面向狗狗，暂未覆盖其他物种或这个话题。不会把犬只建议套用到其他宠物。", actions: [], watchFor: [], followUpQuestion: "你想了解狗狗的饮食、口腔照护、休息还是互动？", evidenceIds: [] });
  if (contains(question, policy.restrictedKeywords)) return pack({ route: "clarify", title: "这个问题需要专业评估", summary: "知识库不提供疾病诊断、药物或补充剂剂量、疫苗与驱虫的个体处方。可以帮你整理资料，交给兽医评估。", actions: [], watchFor: ["不要自行停用、替换或调整兽医开具的方案。"], followUpQuestion: policy.clarifyQuestions[0], evidenceIds: policy.evidenceRefs });
  if (contains(question, policy.symptomKeywords)) return pack({ route: "clarify", title: "先把变化说清楚", summary: "仅凭这句话不能判断原因。请补充以下信息；如果正在加重，请直接联系兽医。", actions: [], watchFor: ["呼吸费力、倒地抽搐、严重疼痛、反复干呕等信号请及时急诊。"], followUpQuestion: policy.clarifyQuestions.join("\n"), evidenceIds: policy.evidenceRefs });
  if (observations.includes(':"与平时不同"')) return pack({ route: "clarify", title: "先了解记录中的变化", summary: "最近记录中有与平时不同的观察，不能直接当作正常或用通用计划覆盖。请说明发生时间、频率和具体表现，持续或加重时联系兽医。", actions: [], watchFor: ["急症不等待随访或打卡，请及时就医。"], followUpQuestion: policy.clarifyQuestions[0], evidenceIds: policy.evidenceRefs });
  const followup = contains(question, policy.followupKeywords) || question.trim().length < 8;
  const search = followup ? [...history.filter(turn => turn.role === "user").slice(-2).map(turn => turn.content), question].join(" ") : question;
  const ranked = guidance.entries.map(entry => ({ entry, score: (question.trim() === entry.title ? 1000 : 0) + entry.keywords.reduce((sum, keyword) => sum + (search.toLowerCase().includes(keyword.toLowerCase()) ? keyword.length : 0), 0) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  const entries = ranked.slice(0, 3).map(item => item.entry);
  if (!entries.length) return pack({ route: "outside", title: "暂时没有足够的知识依据", summary: "当前知识库未匹配到可支持这个问题的条目。请换成具体的日常照护问题，或向兽医咨询；我不会用无关喂养建议填补答案。", actions: [], watchFor: [], followUpQuestion: "可以问：零食怎么控制、怎样刷牙、怎样安排休息区？", evidenceIds: [] });
  const primary = entries[0];
  return pack({ route: "knowledge", title: primary.title, summary: primary.summary, actions: primary.actions.slice(0, 3).map(text => ({ text, evidenceIds: primary.evidenceRefs })), watchFor: [...new Set(entries.flatMap(entry => entry.watchFor))].slice(0, 3), followUpQuestion: "你目前怎样做？最难坚持的是哪一步？", evidenceIds: [...new Set(entries.flatMap(entry => entry.evidenceRefs))] }, entries);
}

export function validateCareReply(raw: string, plan: CarePlan): CareReply | null {
  try {
    const parsed = JSON.parse(raw.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, ""));
    const allowed = new Set(plan.citations.map(source => source.id));
    const validIds = (ids: unknown): ids is string[] => Array.isArray(ids) && ids.length > 0 && ids.every(id => typeof id === "string" && allowed.has(id));
    if (parsed.route !== "knowledge" || typeof parsed.title !== "string" || typeof parsed.summary !== "string" || !parsed.summary.trim() || parsed.summary.length > 1800 || !Array.isArray(parsed.actions) || parsed.actions.length < 1 || parsed.actions.length > 3 || !validIds(parsed.evidenceIds)) return null;
    if (!parsed.actions.every((action: CareAction) => action && typeof action.text === "string" && action.text.length > 0 && action.text.length < 500 && validIds(action.evidenceIds))) return null;
    if (!Array.isArray(parsed.watchFor) || parsed.watchFor.length > 3 || !parsed.watchFor.every((item: unknown) => typeof item === "string" && item.length < 500) || typeof parsed.followUpQuestion !== "string" || parsed.followUpQuestion.length > 500 || parsed.title.length > 80) return null;
    if (contains(JSON.stringify(parsed), policy.modelOutputRedFlags)) return null;
    return { ...parsed, watchFor: [...new Set([...plan.reply.watchFor, ...parsed.watchFor])].slice(0, 5) };
  } catch { return null; }
}

export function replyText(reply: CareReply) {
  return [reply.title, reply.summary, ...reply.actions.map((action, i) => `${i + 1}. ${action.text}`), ...reply.watchFor, reply.followUpQuestion].filter(Boolean).join("\n\n");
}
