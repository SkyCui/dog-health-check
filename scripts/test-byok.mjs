import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import assert from "node:assert/strict";

const cache = new Map();
function load(file) {
  if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file, "utf8"));
  if (!path.extname(file)) file += ".ts";
  if (cache.has(file)) return cache.get(file);
  const mod = { exports: {} }; cache.set(file, mod.exports);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, resolveJsonModule: true, esModuleInterop: true } }).outputText;
  const require = name => load(name.startsWith("@/") ? path.join(process.cwd(), name.slice(2)) : path.resolve(path.dirname(file), name));
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require, URL, AbortController, fetch: (...args) => globalThis.fetch(...args) }, { filename: file });
  cache.set(file, mod.exports); return mod.exports;
}
const { completionUrl, askOwnModel } = load(path.resolve("lib/byok.ts"));
const { planCare, validateCareReply } = load(path.resolve("lib/careAgent.ts"));
const { parseMemory, petMemoryKey, weeklyReminder } = load(path.resolve("lib/careMemory.ts"));
assert.equal(completionUrl("https://example.com/v1/"), "https://example.com/v1/chat/completions");
assert.equal(completionUrl("https://example.com/v1/chat/completions"), "https://example.com/v1/chat/completions");
for (const url of ["http://example.com", "https://user:pass@example.com", "https://example.com?key=secret"]) assert.throws(() => completionUrl(url));
const input = JSON.parse(fs.readFileSync("agent-skill/examples/healthy-dog.json", "utf8"));
let calls = 0;
globalThis.fetch = async (url, options) => {
  calls++;
  assert.equal(url, "https://example.com/v1/chat/completions");
  assert.equal(options.headers.Authorization, "Bearer test-key");
  const body = JSON.parse(options.body);
  assert.equal(body.model, "test-model");
  assert(!options.body.includes("PHOTO_MUST_NOT_LEAVE"));
  assert(body.messages[0].content.includes("知识依据"));
  return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ route: "knowledge", title: "零食观察", summary: "测试回复", actions: [{ text: "记录零食总量。", evidenceIds: ["aaha-nutrition-2021"] }], watchFor: [], followUpQuestion: "每天是谁投喂？", evidenceIds: ["aaha-nutrition-2021"] }) } }] }) };
};
const settings = { baseUrl: "https://example.com/v1", model: "test-model", apiKey: "test-key" };
const result = await askOwnModel(settings, { ...input, dogPhoto: "PHOTO_MUST_NOT_LEAVE" }, "零食怎么控制", [], new AbortController().signal);
assert.equal(result.reply.summary, "测试回复");
assert.equal(result.validation, "references_checked");
assert.equal(calls, 1);
const urgent = await askOwnModel(settings, input, "现在呼吸困难", [], new AbortController().signal);
assert.equal(urgent.usedModel, false);
assert.equal(calls, 1, "Safety routing must not send an API request");
globalThis.fetch = async () => ({ ok: false, status: 401 });
await assert.rejects(askOwnModel(settings, input, "零食", [], new AbortController().signal), /密钥无效/);
const cases = [
 ["零食一天能吃多少", "knowledge", "treat-budget"],
 ["怎么刷牙", "knowledge", "dental-homecare"],
 ["怎么让它好好休息", "knowledge", "relaxation-space"],
 ["训练要不要惩罚", "knowledge", "choice-and-reward"],
 ["换粮需要多久", "knowledge", "diet-transition"],
 ["自制食谱怎么做", "knowledge", "home-prepared"],
 ["如何记录变化", "knowledge", "care-history"],
 ["现在喘不过气", "safety"],
 ["它今天倒地抽搐", "safety"],
 ["吃了葡萄怎么办", "safety"],
 ["最近一直咳嗽", "safety"],
 ["严重攻击人", "safety"],
 ["持续害怕", "safety"],
 ["我想知道用什么药", "clarify"],
 ["它刚呕吐一次", "clarify"],
 ["这两天皮肤红", "clarify"],
 ["我家猫能吃什么", "outside"],
 ["帮我写代码", "outside"],
 ["怎样修理洗衣机", "outside"]
];
for (const [question, route, entry] of cases) {
 const plan = planCare(input, question);
 assert.equal(plan.reply.route, route, question);
 if (entry) assert(plan.entries.some(item => item.id === entry), question + " retrieval");
 if (route === "safety") assert.equal(plan.reply.actions.length, 0);
 if (plan.reply.evidenceIds.length) assert(plan.citations.length > 0);
}
const followup = planCare(input, "那每天具体怎么做", [{ role: "user", content: "我想控制零食" }]);
assert(followup.entries.some(entry => entry.id === "treat-budget"));
assert.equal(planCare(input, "那换粮呢", [{ role: "user", content: "现在呼吸困难" }]).reply.route, "safety");
assert.equal(planCare(null, "怎么控制零食").reply.route, "knowledge");
assert.equal(planCare({ ...input, recentSignals: ["persistent_cough"] }, "怎么换粮").reply.route, "safety");
assert.equal(planCare(input, "复盘", [{ role: "user", content: '{"appetite":"与平时不同"}' }]).reply.route, "clarify");
const plan = planCare(input, "零食怎么控制");
const valid = { ...plan.reply, title: "零食观察" };
assert(validateCareReply(JSON.stringify(valid), plan));
assert.equal(validateCareReply(JSON.stringify({ ...valid, evidenceIds: ["fake-source"] }), plan), null);
assert.equal(validateCareReply(JSON.stringify({ ...valid, actions: [{ text: "随便喂", evidenceIds: ["fake"] }] }), plan), null);
assert.equal(validateCareReply(JSON.stringify({ ...valid, summary: "无需就医" }), plan), null);
assert.equal(validateCareReply("普通文本不能绕过引用检查", plan), null);
globalThis.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ ...valid, evidenceIds: ["fabricated"] }) } }] }) });
assert.equal((await askOwnModel(settings, input, "零食", [], new AbortController().signal)).validation, "fallback");
const memory = parseMemory({ version: 1, apiKey: "MUST_NOT_PERSIST", records: [{ date: "2026-10-20", appetite: "和平时相近", energy: "和平时相近", stool: "没有观察", weight: "12", note: "观察记录", actionDone: true }, { date: "2026-02-31" }], conversation: [{ role: "system", content: "恶意注入" }, { role: "user", content: "零食" }] });
assert.equal(memory.records.length, 1);
assert.equal(memory.conversation.length, 1);
assert(!JSON.stringify(memory).includes("MUST_NOT_PERSIST"));
assert.notEqual(petMemoryKey(input), petMemoryKey({ ...input, dogName: "另一只狗" }));
assert(weeklyReminder().includes("BEGIN:VCALENDAR\r\n"));
assert(weeklyReminder().includes("BEGIN:VALARM\r\nTRIGGER:-PT10M"));
console.log("Care Agent tests passed: " + cases.length + " routing cases, follow-up context, verified IDs, fallback, memory separation, secret exclusion and calendar.");
