import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const port = process.env.TEST_PORT || "3100";
const preferred = process.env.TEST_BASE_URL || "http://localhost:3000";
let server;

const healthy = {
  dogName: "百万", age: "3 岁", breed: "柯基", weight: "12kg", size: "medium",
  bodyCondition: "ideal", foodTypes: ["kibble", "canned"], snackLevel: "low",
  movement: { outdoorFrequency: "two_plus", dailyMinutes: "over_30", sniffing: "rich" },
  recentSignals: ["normal"], homeEnvironment: ["none"],
  mentalState: { positiveEngagement: "often", relaxation: "easy", socialConnection: "secure", distressSignals: ["none"] }
};

function variant(changes) {
  return { ...healthy, ...changes, movement: { ...healthy.movement, ...changes.movement }, mentalState: { ...healthy.mentalState, ...changes.mentalState } };
}

const cases = [
  { name: "双高幸福", payload: healthy, status: "excellent", risk: "继续保持", share: true, confidence: "high", coverage: 1, score: 96 },
  { name: "身体好但精神参与低", payload: variant({ mentalState: { positiveEngagement: "rare" } }), status: "good", risk: "积极参与不足", share: true, confidence: "high" },
  { name: "身体风险但精神稳定", payload: variant({ bodyCondition: "obese", snackLevel: "high" }), status: "good", risk: "体重管理", share: true, confidence: "high" },
  { name: "口臭但无急症", payload: variant({ recentSignals: ["bad_breath"] }), status: "excellent", risk: "口腔护理不足", share: true, confidence: "high" },
  { name: "持续咳嗽但没有呼吸困难", payload: variant({ recentSignals: ["persistent_cough"] }), status: "good", risk: "持续咳嗽", share: true, confidence: "high" },
  { name: "持续食欲变化但没有急症限定", payload: variant({ recentSignals: ["appetite_change"] }), status: "good", risk: "食欲持续变化", share: true, confidence: "high" },
  { name: "部分未知仍可评分", payload: variant({ homeEnvironment: ["unknown"], mentalState: { distressSignals: ["unknown"] } }), status: "excellent", risk: "继续保持", share: true, confidence: "medium", coverage: 0.8, score: 96 },
  { name: "持续恐惧", payload: variant({ mentalState: { distressSignals: ["frequent_fear_or_hiding"] } }), status: "behavior_support", risk: "需要行为专业支持", share: false, confidence: "high" },
  { name: "分离痛苦", payload: variant({ mentalState: { distressSignals: ["separation_distress"] } }), status: "behavior_support", risk: "需要行为专业支持", share: false, confidence: "high" },
  { name: "攻击风险", payload: variant({ mentalState: { distressSignals: ["aggression_safety_risk"] } }), status: "behavior_support", risk: "需要行为专业支持", share: false, confidence: "high" },
  { name: "突然行为变化", payload: variant({ mentalState: { distressSignals: ["sudden_behavior_change"] } }), status: "red_vet", risk: "需要咨询兽医的异常信号", share: false, confidence: "high" },
  { name: "自伤", payload: variant({ mentalState: { distressSignals: ["self_injury"] } }), status: "red_vet", risk: "需要咨询兽医的异常信号", share: false, confidence: "high" },
  { name: "呼吸困难", payload: variant({ recentSignals: ["breathing_difficulty"] }), status: "red_vet", risk: "需要咨询兽医的异常信号", share: false, confidence: "high" },
  { name: "晕倒或抽搐", payload: variant({ recentSignals: ["collapse_seizure_or_fainting"] }), status: "red_vet", risk: "需要咨询兽医的异常信号", share: false, confidence: "high" },
  { name: "腹胀伴反复干呕", payload: variant({ recentSignals: ["swollen_abdomen_or_unproductive_retching"] }), status: "red_vet", risk: "需要咨询兽医的异常信号", share: false, confidence: "high" },
  { name: "信息不足", payload: variant({ size: "unknown", bodyCondition: "unknown", movement: { dailyMinutes: "unknown", sniffing: "unknown" }, homeEnvironment: ["unknown"], mentalState: { positiveEngagement: "unknown", relaxation: "unknown", socialConnection: "unknown", distressSignals: ["unknown"] } }), status: "insufficient", risk: "信息不足", share: false, confidence: "insufficient", coverage: 0.26, score: null }
];

function equal(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function reachable(url) {
  try { return (await fetch(url)).status < 500; } catch { return false; }
}

async function getBaseUrl() {
  if (await reachable(preferred)) return preferred;
  const url = `http://localhost:${port}`;
  server = spawn("npm", ["run", "dev", "--", "-p", port], { cwd: process.cwd(), stdio: "ignore" });
  for (let i = 0; i < 60; i += 1) {
    if (await reachable(url)) return url;
    await wait(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function request(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/assess`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  return { code: response.status, body: await response.json() };
}

try {
  const baseUrl = await getBaseUrl();
  for (const item of cases) {
    const { code, body } = await request(baseUrl, item.payload);
    equal(code, 200, `${item.name} HTTP`);
    equal(body.status, item.status, `${item.name} status`);
    equal(body.coreRisk?.title, item.risk, `${item.name} coreRisk`);
    equal(body.allowShare, item.share, `${item.name} allowShare`);
    equal(body.assessmentConfidence, item.confidence, `${item.name} assessmentConfidence`);
    if (typeof body.answeredCoverage !== "number" || body.answeredCoverage < 0 || body.answeredCoverage > 1) throw new Error(`${item.name}: invalid answeredCoverage`);
    if (item.coverage !== undefined) equal(body.answeredCoverage, item.coverage, `${item.name} answeredCoverage`);
    if ("score" in item) equal(body.happinessScore, item.score, `${item.name} happinessScore`);
    if (!body.knowledgeVersion || !Array.isArray(body.evidenceRefs) || body.evidenceRefs.length === 0) throw new Error(`${item.name}: missing evidence metadata`);
    if (item.status === "red_vet" || item.status === "behavior_support") {
      equal(body.shareCopy, "", `${item.name} shareCopy`);
      if (!body.todayAction?.body?.includes("不输出普通")) throw new Error(`${item.name}: ordinary lifestyle advice was not suppressed`);
      equal(body.shareGuide.actions.every((action) => action.enabled === false), true, `${item.name} share actions`);
    }
    if (item.status === "insufficient") {
      equal(body.happinessScore, null, `${item.name} happinessScore`);
      equal(body.shareCopy, "", `${item.name} shareCopy`);
      equal(body.healthDimensionScores.body, null, `${item.name} body score`);
      equal(body.mentalDimensionScores.positiveEngagement, null, `${item.name} engagement score`);
      equal(body.shareGuide.actions.every((action) => action.enabled === false), true, `${item.name} share actions`);
    }
    if (item.name === "部分未知仍可评分") {
      equal(body.healthDimensionScores.environment, null, `${item.name} environment score`);
      equal(body.mentalDimensionScores.distress, null, `${item.name} distress score`);
    }
    console.log(`✓ ${item.name}`);
  }

  const invalid = variant({ mentalState: { distressSignals: ["none", "frequent_fear_or_hiding"] } });
  const invalidResponse = await request(baseUrl, invalid);
  equal(invalidResponse.code, 400, "非法组合 HTTP");
  console.log("✓ 非法组合");

  const invalidRecent = variant({ recentSignals: ["normal", "persistent_cough"] });
  const invalidRecentResponse = await request(baseUrl, invalidRecent);
  equal(invalidRecentResponse.code, 400, "健康信号非法组合 HTTP");
  console.log("✓ 健康信号非法组合");
} finally {
  if (server) server.kill("SIGTERM");
}
