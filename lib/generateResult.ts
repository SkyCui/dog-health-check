import { getAllowShare, getShareCopy, getStrengths, getTodayAction } from "./recommendation";
import { getCoreRisk } from "./riskPriority";
import { getDimensionScores, getLongevityScore, getStatus, getStatusText } from "./scoring";
import { checkVetBoundary } from "./vetBoundary";
import type { AssessmentInput, GeneratedResult } from "./types";

export function generateResult(input: AssessmentInput): GeneratedResult {
  const vetBoundary = checkVetBoundary(input);
  const dimensionScores = getDimensionScores(input);
  const longevityScore = getLongevityScore(dimensionScores);
  const status = getStatus(longevityScore, vetBoundary.triggered);
  const statusText = getStatusText(status);
  const coreRisk = getCoreRisk(input, dimensionScores, vetBoundary);
  const todayAction = getTodayAction(coreRisk.title, longevityScore);
  const allowShare = getAllowShare(status, vetBoundary);

  const partialResult = {
    status,
    statusText,
    coreConclusion: vetBoundary.triggered
      ? "这次结果更适合先确认健康风险，不建议继续做普通生活方式分析。"
      : `它整体状态${longevityScore >= 85 ? "比较友好" : "还可以"}，目前最值得先关注的是：${coreRisk.title}。`,
    longevityScore,
    dimensionScores,
    strengths: vetBoundary.triggered ? ["你及时注意到这些变化很重要，先确认健康风险会更稳妥。"] : getStrengths(input, dimensionScores),
    coreRisk,
    todayAction,
    vetReminder: vetBoundary.reminder,
    allowShare
  };

  return {
    ...partialResult,
    shareCopy: getShareCopy(partialResult, input)
  };
}
