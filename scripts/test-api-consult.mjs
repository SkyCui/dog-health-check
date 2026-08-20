import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const port = process.env.TEST_PORT || "3411";
const externalBase = process.env.TEST_BASE_URL;
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
  { name: "健康犬日常计划", assessment: healthy, message: "帮我做一周日常喂养计划", mode: "guidance", topic: "daily_feeding", route: "none", hasPlan: true },
  { name: "偏胖体重管理", assessment: variant({ bodyCondition: "obese", snackLevel: "high" }), message: "它有点胖，怎么管理体重", mode: "guidance", topic: "weight_management", route: "none", hasPlan: true },
  { name: "零食预算", assessment: variant({ snackLevel: "high" }), message: "零食和磨牙棒应该怎么控制", mode: "guidance", topic: "treats", route: "none", hasPlan: true },
  { name: "评测医疗边界", assessment: variant({ recentSignals: ["breathing_difficulty"] }), message: "该怎么换粮", mode: "safety", topic: "safety", route: "vet", hasPlan: false },
  { name: "评测行为边界", assessment: variant({ mentalState: { distressSignals: ["separation_distress"] } }), message: "怎样用零食训练", mode: "safety", topic: "safety", route: "veterinary_behavior", hasPlan: false },
  { name: "咨询文字触发急症", assessment: healthy, message: "它现在呼吸困难，我该喂什么", mode: "safety", topic: "safety", route: "vet", hasPlan: false }
];

function equal(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function reachable(base) {
  try { return (await fetch(base)).status < 500; } catch { return false; }
}

async function baseUrl() {
  if (externalBase) return externalBase;
  const base = `http://localhost:${port}`;
  server = spawn("npm", ["run", "dev", "--", "-p", port], { cwd: process.cwd(), stdio: "ignore" });
  for (let count = 0; count < 80; count += 1) {
    if (await reachable(base)) return base;
    await wait(500);
  }
  throw new Error(`Timed out waiting for ${base}`);
}

try {
  const base = await baseUrl();
  for (const item of cases) {
    const response = await fetch(`${base}/api/consult`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment: item.assessment, message: item.message })
    });
    const body = await response.json();
    equal(response.status, 200, `${item.name} HTTP`);
    equal(body.mode, item.mode, `${item.name} mode`);
    equal(body.topic, item.topic, `${item.name} topic`);
    equal(body.safetyRoute, item.route, `${item.name} safetyRoute`);
    equal(body.plan.length > 0, item.hasPlan, `${item.name} plan`);
    if (!Array.isArray(body.citations) || !body.citations.length || body.citations.some((source) => !source.url)) throw new Error(`${item.name}: missing citations`);
    if (!body.knowledgeVersion || !body.disclaimer.includes("无法替代兽医")) throw new Error(`${item.name}: missing product boundary`);
    console.log(`✓ ${item.name}`);
  }

  const invalid = await fetch(`${base}/api/consult`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessment: healthy, message: "" }) });
  equal(invalid.status, 400, "空问题 HTTP");
  console.log("✓ 空问题校验");
} finally {
  server?.kill("SIGTERM");
}
