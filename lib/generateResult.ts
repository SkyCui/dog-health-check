import sourcesFile from "@/knowledge/sources.json";
import content from "@/knowledge/rules/content-rules.json";
import { getAllowShare, getShareCopy, getStrengths, getTodayAction } from "./recommendation";
import { getCoreRisk } from "./riskPriority";
import { getHappinessScore, getHealthDimensionScores, getHealthScore, getMentalDimensionScores, getMentalWellbeingScore, getStatus, getStatusText } from "./scoring";
import { checkSafetyBoundary } from "./vetBoundary";
import type { AssessmentInput, EvidenceReference, GeneratedResult, HealthDimensionKey, MentalDimensionKey, ShareGuide } from "./types";

const healthLabels: Record<HealthDimensionKey, string> = { body: "体况", diet: "饮食", movement: "运动嗅闻", recent: "近期健康", environment: "家庭环境" };
const mentalLabels: Record<MentalDimensionKey, string> = { positiveEngagement: "积极参与", relaxation: "放松恢复", socialConnection: "社交安全", distress: "压力信号" };

function createShareGuide(allowShare: boolean): ShareGuide {
  const actions = [
    ["copy_text", "复制分享文案", "复制循证轻量自查结果。"], ["download_image", "生成/保存分享图", "生成幸福观察卡。"],
    ["wechat_moments", "分享到朋友圈", "保存图片后打开微信发布。"], ["xiaohongshu", "分享到小红书", "保存图片后打开小红书发布。"],
    ["weibo", "分享到微博", "保存图片后打开微博发布。"]
  ] as const;
  return {
    primaryCta: allowShare ? "生成幸福观察分享图" : "暂不分享，先获得专业支持",
    safetyNote: allowShare ? "只分享轻量观察结果，不包含诊断判断。" : "检测到需要优先确认的健康或行为信号。",
    actions: actions.map(([id, label, description]) => ({ id, label, description, enabled: allowShare }))
  };
}

export function generateResult(input: AssessmentInput): GeneratedResult {
  const safety = checkSafetyBoundary(input);
  const healthDimensionScores = getHealthDimensionScores(input);
  const mentalDimensionScores = getMentalDimensionScores(input);
  const healthScore = getHealthScore(healthDimensionScores);
  const mentalWellbeingScore = getMentalWellbeingScore(mentalDimensionScores);
  const happinessScore = getHappinessScore(healthScore, mentalWellbeingScore);
  const status = getStatus(happinessScore, safety.statusOverride);
  const statusText = getStatusText(status);
  const coreRisk = getCoreRisk(input, healthDimensionScores, mentalDimensionScores, safety);
  const allowShare = getAllowShare(status);
  const base = {
    status, statusText,
    coreConclusion: safety.statusOverride
      ? content.coreConclusions[status as "red_vet" | "behavior_support"]
      : content.coreConclusions.normalTemplate.replace("{riskTitle}", coreRisk.title),
    happinessScore, healthScore, mentalWellbeingScore, healthDimensionScores, mentalDimensionScores,
    strengths: safety.statusOverride ? [content.coreConclusions.safetyStrength] : getStrengths(input, healthDimensionScores, mentalDimensionScores),
    coreRisk, todayAction: getTodayAction(coreRisk.title), supportRoute: safety.supportRoute,
    supportReminder: safety.reminder, allowShare,
    knowledgeVersion: sourcesFile.knowledgeVersion,
    evidenceRefs: sourcesFile.sources.map(({ id, title, organization, level, url }) => ({ id, title, organization, level, url } as EvidenceReference))
  };
  const dashboardReport = {
    title: "你的狗狗幸福吗？Dashboard", subtitle: "身体健康与精神福利双支柱观察", scoreLabel: `${happinessScore}/100 幸福观察指数`,
    sections: [
      { id: "core_conclusion", title: "核心结论", body: base.coreConclusion },
      { id: "pillar_scores", title: "双支柱", items: [`身体健康：${healthScore}/100`, `精神状态：${mentalWellbeingScore}/100`] },
      { id: "health_dimensions", title: "健康五维", items: (Object.keys(healthLabels) as HealthDimensionKey[]).map((key) => `${healthLabels[key]}：${healthDimensionScores[key]}/100`) },
      { id: "mental_dimensions", title: "精神四维", items: (Object.keys(mentalLabels) as MentalDimensionKey[]).map((key) => `${mentalLabels[key]}：${mentalDimensionScores[key]}/100`) },
      { id: "core_risk", title: `最值得关注：${coreRisk.title}`, body: coreRisk.reason },
      { id: "today_action", title: base.todayAction.title, body: base.todayAction.body },
      { id: "support_reminder", title: "专业支持提醒", body: base.supportReminder }
    ]
  };
  const resultWithoutShare = { ...base, dashboardReport, shareGuide: createShareGuide(allowShare) };
  return { ...resultWithoutShare, shareCopy: getShareCopy(resultWithoutShare, input) };
}
