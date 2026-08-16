import content from "@/knowledge/rules/content-rules.json";
import rules from "@/knowledge/rules/assessment-rules.json";
import type { AssessmentInput, GeneratedResult, HealthDimensionScores, MentalDimensionScores, StatusKey } from "./types";

const actions = content.actions as Record<string, { title: string; body: string }>;
const strengthCopy = content.strengths;

export function getStrengths(input: AssessmentInput, health: HealthDimensionScores, mental: MentalDimensionScores) {
  const values: string[] = [];
  if (input.bodyCondition === "ideal") values.push(strengthCopy.idealBody);
  if (["two_to_three", "two_plus"].includes(input.movement.outdoorFrequency) || ["normal", "rich"].includes(input.movement.sniffing)) values.push(strengthCopy.movement);
  if (input.recentSignals.length === 1 && input.recentSignals[0] === "normal") values.push(strengthCopy.recentNormal);
  if (health.environment !== null && health.environment >= 88) values.push(strengthCopy.environment);
  if (mental.positiveEngagement !== null && mental.positiveEngagement >= 90) values.push(strengthCopy.engagement);
  if (mental.relaxation !== null && mental.relaxation >= 90) values.push(strengthCopy.relaxation);
  if (mental.socialConnection !== null && mental.socialConnection >= 90) values.push(strengthCopy.social);
  if (!values.length) values.push(strengthCopy.fallback);
  return values.slice(0, 2);
}

export const getTodayAction = (riskTitle: string) => actions[riskTitle] ?? actions["继续保持"];
export const getAllowShare = (status: StatusKey) => (rules.share.allowStatuses as StatusKey[]).includes(status);

export function getShareCopy(result: Omit<GeneratedResult, "shareCopy" | "dashboardReport" | "shareGuide">, input: AssessmentInput) {
  if (!result.allowShare) return "";
  const name = input.dogName?.trim() || "我家狗狗";
  return [
    content.shareCopy.introTemplate.replace("{name}", name), "",
    `幸福观察指数：${result.happinessScore} 分。`,
    `身体健康：${result.healthScore} 分；精神状态：${result.mentalWellbeingScore} 分。`,
    `目前最值得关注的是：${result.coreRisk.title}。`, "",
    "今天先从一件小事开始：", result.todayAction.body, "",
    content.shareCopy.closing, content.shareCopy.entryCta, "",
    content.shareCopy.disclaimer, content.shareCopy.hashtags
  ].join("\n");
}
