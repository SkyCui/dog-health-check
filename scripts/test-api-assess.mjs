import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const DEFAULT_BASE_URL = "http://localhost:3000";
const TEST_PORT = process.env.TEST_PORT || "3100";
const TEST_BASE_URL = process.env.TEST_BASE_URL || DEFAULT_BASE_URL;

let serverProcess = null;

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(text, expected, message) {
  if (!String(text).includes(expected)) {
    throw new Error(`${message}\nExpected text to include: ${expected}\nActual: ${text}`);
  }
}

function assertNotEqual(actual, unexpected, message) {
  if (actual === unexpected) {
    throw new Error(`${message}\nUnexpected: ${JSON.stringify(unexpected)}`);
  }
}

function assertArray(value, message) {
  if (!Array.isArray(value)) {
    throw new Error(`${message}\nExpected an array.\nActual: ${JSON.stringify(value)}`);
  }
}

function assertObject(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${message}\nExpected an object.\nActual: ${JSON.stringify(value)}`);
  }
}

function assertDashboardAndShareGuide(body, caseName) {
  assertObject(body.dashboardReport, `${caseName}: dashboardReport should exist`);
  assertIncludes(body.dashboardReport.title, "Dashboard", `${caseName}: dashboardReport title should mention Dashboard`);
  assertIncludes(body.dashboardReport.scoreLabel, "/100", `${caseName}: dashboardReport scoreLabel should include /100`);
  assertArray(body.dashboardReport.sections, `${caseName}: dashboardReport.sections should be an array`);

  const requiredSectionIds = [
    "core_conclusion",
    "dimension_scores",
    "strengths",
    "core_risk",
    "today_action",
    "vet_reminder"
  ];
  const sectionIds = body.dashboardReport.sections.map((section) => section.id);
  for (const sectionId of requiredSectionIds) {
    if (!sectionIds.includes(sectionId)) {
      throw new Error(`${caseName}: dashboardReport missing section ${sectionId}`);
    }
  }

  assertObject(body.shareGuide, `${caseName}: shareGuide should exist`);
  assertIncludes(body.shareGuide.primaryCta, body.allowShare ? "分享" : "暂不分享", `${caseName}: shareGuide primary CTA mismatch`);
  assertArray(body.shareGuide.actions, `${caseName}: shareGuide.actions should be an array`);

  const actionIds = body.shareGuide.actions.map((action) => action.id);
  for (const actionId of ["copy_text", "download_image", "wechat_moments", "xiaohongshu", "weibo"]) {
    if (!actionIds.includes(actionId)) {
      throw new Error(`${caseName}: shareGuide missing action ${actionId}`);
    }
  }

  for (const action of body.shareGuide.actions) {
    assertEqual(action.enabled, body.allowShare, `${caseName}: shareGuide action enabled should follow allowShare`);
  }
}

async function canReach(url) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(baseUrl) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (await canReach(baseUrl)) {
      return;
    }
    await wait(500);
  }

  throw new Error(`Timed out waiting for test server at ${baseUrl}`);
}

async function ensureServer() {
  if (await canReach(TEST_BASE_URL)) {
    return TEST_BASE_URL;
  }

  const baseUrl = `http://localhost:${TEST_PORT}`;
  serverProcess = spawn("npm", ["run", "dev", "--", "-p", TEST_PORT], {
    cwd: process.cwd(),
    detached: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  serverProcess.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  serverProcess.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));

  await waitForServer(baseUrl);
  return baseUrl;
}

async function assess(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json();
  return { statusCode: response.status, body };
}

const cases = [
  {
    name: "高分健康狗狗",
    payload: {
      dogName: "百万",
      age: "3 岁",
      breed: "柯基",
      weight: "12kg",
      size: "medium",
      bodyCondition: "ideal",
      foodTypes: ["kibble", "canned"],
      snackLevel: "low",
      movement: {
        outdoorFrequency: "two_plus",
        dailyMinutes: "over_30",
        sniffing: "rich"
      },
      recentSignals: ["normal"],
      homeEnvironment: ["none"]
    },
    expected: {
      status: "excellent",
      coreRisk: "继续保持",
      allowShare: true
    }
  },
  {
    name: "偏胖 + 零食多",
    payload: {
      dogName: "奶茶",
      age: "5 岁",
      breed: "比熊",
      weight: "偏重",
      size: "small",
      bodyCondition: "slightly_fat",
      foodTypes: ["kibble"],
      snackLevel: "high",
      movement: {
        outdoorFrequency: "one_to_two",
        dailyMinutes: "around_30",
        sniffing: "normal"
      },
      recentSignals: ["normal"],
      homeEnvironment: ["none"]
    },
    expected: {
      status: "watch",
      coreRisk: "体重管理",
      allowShare: true
    }
  },
  {
    name: "出门少 + 缺少嗅闻",
    payload: {
      dogName: "豆豆",
      age: "2 岁",
      breed: "泰迪",
      weight: "6kg",
      size: "small",
      bodyCondition: "ideal",
      foodTypes: ["kibble"],
      snackLevel: "high",
      movement: {
        outdoorFrequency: "rare",
        dailyMinutes: "under_10",
        sniffing: "none"
      },
      recentSignals: ["normal"],
      homeEnvironment: ["unknown"]
    },
    expected: {
      status: "watch",
      coreRisk: "运动与嗅闻不足",
      allowShare: true
    }
  },
  {
    name: "口臭但无急症",
    payload: {
      dogName: "可可",
      age: "4 岁",
      breed: "边牧",
      weight: "18kg",
      size: "medium",
      bodyCondition: "ideal",
      foodTypes: ["kibble", "canned"],
      snackLevel: "low",
      movement: {
        outdoorFrequency: "two_plus",
        dailyMinutes: "over_30",
        sniffing: "rich"
      },
      recentSignals: ["bad_breath"],
      homeEnvironment: ["none"]
    },
    expected: {
      status: "good",
      coreRisk: "口腔护理不足",
      allowShare: true
    }
  },
  {
    name: "精神变差触发安全边界",
    payload: {
      dogName: "小白",
      age: "8 岁",
      breed: "串串",
      weight: "",
      size: "medium",
      bodyCondition: "unknown",
      foodTypes: ["kibble"],
      snackLevel: "medium",
      movement: {
        outdoorFrequency: "one_to_two",
        dailyMinutes: "10_20",
        sniffing: "normal"
      },
      recentSignals: ["low_energy"],
      homeEnvironment: ["unknown"]
    },
    expected: {
      status: "red_vet",
      coreRisk: "需要咨询兽医的异常信号",
      allowShare: false,
      shareCopy: "",
      todayActionTitle: "先联系兽医"
    }
  }
];

async function run() {
  const baseUrl = await ensureServer();
  console.log(`Testing /api/assess at ${baseUrl}`);

  for (const testCase of cases) {
    const { statusCode, body } = await assess(baseUrl, testCase.payload);

    assertEqual(statusCode, 200, `${testCase.name}: API should return 200`);
    assertEqual(body.status, testCase.expected.status, `${testCase.name}: status mismatch`);
    assertEqual(body.coreRisk?.title, testCase.expected.coreRisk, `${testCase.name}: coreRisk mismatch`);
    assertEqual(body.allowShare, testCase.expected.allowShare, `${testCase.name}: allowShare mismatch`);
    assertDashboardAndShareGuide(body, testCase.name);

    if (testCase.expected.status === "red_vet") {
      assertEqual(body.shareCopy, "", `${testCase.name}: shareCopy should be empty`);
      assertEqual(body.todayAction?.title, testCase.expected.todayActionTitle, `${testCase.name}: vet action title mismatch`);
      assertNotEqual(
        body.todayAction?.title,
        "今天先做这一件事",
        `${testCase.name}: should not output ordinary lifestyle action title`
      );
      assertIncludes(
        body.todayAction?.body,
        "不输出普通生活方式建议",
        `${testCase.name}: should explicitly avoid ordinary lifestyle advice`
      );
    }

    console.log(`✓ ${testCase.name}`);
  }
}

run()
  .catch((error) => {
    console.error(`\nAPI assessment tests failed:\n${error.stack || error.message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    if (serverProcess?.pid) {
      try {
        process.kill(-serverProcess.pid, "SIGTERM");
      } catch {
        serverProcess.kill("SIGTERM");
      }
    }
  });
