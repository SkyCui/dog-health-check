import riskRules from "@/rules/risk-priority-rules.json";
import type { AssessmentInput, DimensionKey, DimensionScores, VetBoundaryResult } from "./types";

const riskReasons: Record<string, string> = {
  "体重管理": "体况是长期健康习惯里很重要的一环。当前选择提示它可能需要更稳定的体重管理，先从容易执行的小调整开始更合适。",
  "饮食单一或零食偏多": "零食和加餐容易在不知不觉中增加热量，也会让主食节奏变得不稳定，先做轻量记录和减量会更容易坚持。",
  "运动与嗅闻不足": "出门、活动和嗅闻不只是消耗体力，也有助于释放压力。当前最适合先补上一段低门槛的高质量散步。",
  "口腔护理不足": "口臭常常提示口腔护理值得关注。这里不做诊断，但可以先从建立温和的清洁习惯开始。",
  "肠道状态不稳定": "便便不稳定时，先保持饮食稳定、减少新食物刺激，更有助于观察变化。",
  "皮肤 / 舔爪 / 抓痒信号": "舔爪或抓痒可能和皮肤、环境或压力有关。先做低成本清洁和观察，持续加重时再咨询兽医。",
  "家庭环境暴露": "家里的气味、清洁剂、烟雾或杀虫剂可能给狗狗带来额外刺激。先减少常接触区域的暴露最容易开始。",
  "需要咨询兽医的异常信号": "它出现了超出日常习惯自测范围的信号，优先确认健康风险会更稳妥。"
};

export function getCoreRisk(
  input: AssessmentInput,
  dimensionScores: DimensionScores,
  vetBoundary: VetBoundaryResult
) {
  if (vetBoundary.triggered) {
    return {
      title: "需要咨询兽医的异常信号",
      reason: `你选择了 ${vetBoundary.reason}。这类变化不适合只用生活方式建议处理，建议先联系兽医确认。`
    };
  }

  const explicitRisk = riskRules.priority.find((rule) => {
    const when = "when" in rule ? rule.when : undefined;
    if (!when) {
      return false;
    }

    return when.some((value) => {
      return (
        input.recentSignals.includes(value as never) ||
        input.bodyCondition === value ||
        input.movement.outdoorFrequency === value ||
        input.movement.dailyMinutes === value ||
        input.movement.sniffing === value ||
        input.snackLevel === value
      );
    });
  });

  if (explicitRisk) {
    return {
      title: explicitRisk.title,
      reason: riskReasons[explicitRisk.title]
    };
  }

  const lowestDimension = (Object.entries(dimensionScores) as [DimensionKey, number][]).sort(
    (a, b) => a[1] - b[1]
  )[0][0];

  const dimensionRisk = riskRules.priority.find((rule) => rule.dimension === lowestDimension);
  const title = dimensionRisk?.title ?? "继续保持";

  if (dimensionScores[lowestDimension] >= 88) {
    return {
      title: "继续保持",
      reason: "它目前没有明显短板，最有价值的是继续保持稳定、温和、可持续的日常节奏。"
    };
  }

  return {
    title,
    reason: riskReasons[title] ?? "这个方向目前分数相对更低，适合作为第一优先级。"
  };
}
