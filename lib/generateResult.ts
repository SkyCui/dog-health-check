import { getAllowShare, getShareCopy, getStrengths, getTodayAction } from "./recommendation";
import { getCoreRisk } from "./riskPriority";
import { getDimensionScores, getLongevityScore, getStatus, getStatusText } from "./scoring";
import { checkVetBoundary } from "./vetBoundary";
import type { AssessmentInput, DimensionKey, GeneratedResult, ShareGuide } from "./types";

const dimensionLabels: Record<DimensionKey, string> = {
  body: "体况",
  diet: "饮食",
  movement: "运动嗅闻",
  recent: "近期状态",
  environment: "家庭环境"
};

function createDashboardReport(result: Omit<GeneratedResult, "dashboardReport" | "shareGuide" | "shareCopy">) {
  return {
    title: "狗狗健康习惯 Dashboard",
    subtitle: result.status === "red_vet" ? "先确认健康风险，再看生活方式" : "一页看懂当前长寿习惯指数和优先行动",
    scoreLabel: `${result.longevityScore}/100 长寿习惯指数`,
    sections: [
      {
        id: "core_conclusion",
        title: "核心结论",
        body: result.coreConclusion
      },
      {
        id: "dimension_scores",
        title: "五维小指标",
        items: (Object.keys(dimensionLabels) as DimensionKey[]).map(
          (key) => `${dimensionLabels[key]}：${result.dimensionScores[key]}/100`
        )
      },
      {
        id: "strengths",
        title: "做得好的地方",
        items: result.strengths
      },
      {
        id: "core_risk",
        title: `最值得关注：${result.coreRisk.title}`,
        body: result.coreRisk.reason
      },
      {
        id: "today_action",
        title: result.todayAction.title,
        body: result.todayAction.body
      },
      {
        id: "vet_reminder",
        title: "就医提醒",
        body: result.vetReminder
      }
    ]
  };
}

function createShareGuide(allowShare: boolean): ShareGuide {
  const actions = [
    {
      id: "copy_text" as const,
      label: "复制分享文案",
      description: "先复制安全版文案，适合发朋友圈、小红书、微博。",
      enabled: allowShare
    },
    {
      id: "download_image" as const,
      label: "生成/保存分享图",
      description: "把 Dashboard 生成竖版分享图，再上传到社媒。",
      enabled: allowShare
    },
    {
      id: "wechat_moments" as const,
      label: "分享到朋友圈",
      description: "复制文案 + 保存分享图后，打开微信发布。",
      enabled: allowShare
    },
    {
      id: "xiaohongshu" as const,
      label: "分享到小红书",
      description: "复制文案 + 保存分享图后，打开小红书发布。",
      enabled: allowShare
    },
    {
      id: "weibo" as const,
      label: "分享到微博",
      description: "复制文案 + 保存分享图后，打开微博发布。",
      enabled: allowShare
    }
  ];

  return {
    primaryCta: allowShare ? "一键生成分享图并复制文案" : "暂不分享，先确认健康风险",
    safetyNote: allowShare
      ? "分享内容不包含具体体重、异常细节或诊断判断；只分享生活习惯结果。"
      : "检测到需要优先确认的健康信号，不建议生成社媒内容。",
    actions
  };
}

export function generateResult(input: AssessmentInput): GeneratedResult {
  const vetBoundary = checkVetBoundary(input);
  const dimensionScores = getDimensionScores(input);
  const longevityScore = getLongevityScore(dimensionScores);
  const status = getStatus(longevityScore, vetBoundary.triggered);
  const statusText = getStatusText(status);
  const coreRisk = getCoreRisk(input, dimensionScores, vetBoundary);
  const todayAction = getTodayAction(coreRisk.title, longevityScore);
  const allowShare = getAllowShare(status, vetBoundary);

  const baseResult = {
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
    ...baseResult,
    shareCopy: getShareCopy(baseResult, input),
    dashboardReport: createDashboardReport(baseResult),
    shareGuide: createShareGuide(allowShare)
  };
}
