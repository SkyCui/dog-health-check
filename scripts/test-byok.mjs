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
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, resolveJsonModule: true, esModuleInterop: true } }).outputText;
  const require = name => load(name.startsWith("@/") ? path.join(process.cwd(), name.slice(2)) : path.resolve(path.dirname(file), name));
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require, URL, AbortController, fetch: (...args) => globalThis.fetch(...args) }, { filename: file });
  cache.set(file, mod.exports); return mod.exports;
}
const { completionUrl, askOwnModel } = load(path.resolve("lib/byok.ts"));
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
  return { ok: true, json: async () => ({ choices: [{ message: { content: "测试回复" } }] }) };
};
const settings = { baseUrl: "https://example.com/v1", model: "test-model", apiKey: "test-key" };
const result = await askOwnModel(settings, { ...input, dogPhoto: "PHOTO_MUST_NOT_LEAVE" }, "零食怎么控制", [], new AbortController().signal);
assert.equal(result.text, "测试回复");
assert.equal(calls, 1);
const urgent = await askOwnModel(settings, input, "现在呼吸困难", [], new AbortController().signal);
assert.equal(urgent.usedModel, false);
assert.equal(calls, 1, "Safety routing must not send an API request");
globalThis.fetch = async () => ({ ok: false, status: 401 });
await assert.rejects(askOwnModel(settings, input, "零食", [], new AbortController().signal), /密钥无效/);
console.log("BYOK tests passed: URL validation, evidence context, photo exclusion, safety bypass and API errors.");
