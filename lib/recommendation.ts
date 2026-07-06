import recommendationRules from "@/rules/recommendation-rules.json";
import shareRules from "@/rules/share-permission-rules.json";
import type {
  AssessmentInput,
  DimensionScores,
  GeneratedResult,
  StatusKey,
  VetBoundaryResult
} from "./types";

const actionMap = recommendationRules.actions as Record<string, { title: string; body: string }>;

export function getStrengths(input: AssessmentInput, dimensionScores: DimensionScores) {
  const strengths: string[] = [];

  if (input.bodyCondition === "ideal") {
    strengths.push("体况看起来比较接近理想状态，这是很好的长期健康基础。");
  }

  if (
    ["two_to_three", "two_plus"].includes(input.movement.outdoorFrequency) ||
    ["normal", "rich"].includes(input.movement.sniffing)
  ) {
    strengths.push("它有比较稳定的出门节奏，散步和嗅闻能帮助身体活动和情绪放松。");
  }

  if (input.recentSignals.includes("normal") && input.recentSignals.length === 1) {
    strengths.push("最近状态整体稳定，精神、食欲和日常表现都没有明显异常信号。");
  }

  if (dimensionScores.environment >= 88) {
    strengths.push("家庭环境里暂时没有看到明显刺激源，这是舒服生活区的重要基础。");
  }

  if (strengths.length === 0) {
    strengths.push("你已经开始主动观察它的日常变化，这本身就是很好的健康管理习惯。");
  }

  return strengths.slice(0, 2);
}

export function getTodayAction(coreRiskTitle: string, score: number) {
  if (score >= 95 && coreRiskTitle === "继续保持") {
    return actionMap["继续保持"];
  }

  return actionMap[coreRiskTitle] ?? actionMap["继续保持"];
}

export function getAllowShare(status: StatusKey, vetBoundary: VetBoundaryResult) {
  if (vetBoundary.triggered) {
    return false;
  }

  return (shareRules.allowWhenStatus as StatusKey[]).includes(status);
}

export function getShareCopy(result: Omit<GeneratedResult, "shareCopy" | "dashboardReport" | "shareGuide">, input: AssessmentInput) {
  if (!result.allowShare) {
    return "";
  }

  const name = input.dogName?.trim() || "我家狗狗";

  return [
    `给${name}做了一个 1 分钟健康自测。`,
    "",
    `结果是：狗狗长寿习惯指数 ${result.longevityScore} 分。`,
    `目前状态：${result.statusText}。`,
    `最值得关注的是：${result.coreRisk.title}。`,
    "",
    "今天先从一件小事开始：",
    result.todayAction.body,
    "",
    "小狗不会说话，",
    "但我们可以多懂它一点。",
    "",
    "#狗狗健康 #科学养狗 #狗狗长寿习惯指数"
  ].join("\n");
}
