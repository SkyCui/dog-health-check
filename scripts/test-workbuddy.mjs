import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL(process.env.MCP_TEST_URL || "http://localhost:3443/api/mcp");
const client = new Client({ name: "dogcare-regression", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(url);
let checks = 0;
try {
  await client.connect(transport);
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 4); checks++;
  const call = async (name, args = {}) => {
    const response = await client.callTool({ name, arguments: args });
    return { response, data: response.structuredContent ?? JSON.parse(response.content[0].text) };
  };
  const capabilities = await call("dogcare_capabilities");
  assert.equal(capabilities.data.cloudMemoryAvailable, false);
  assert.equal(capabilities.data.stored, false); checks++;
  const knowledge = await call("ask_dog_care", { question: "零食怎么控制更容易坚持？" });
  assert.equal(knowledge.data.reply.route, "knowledge");
  assert(knowledge.data.citations.length > 0); assert(knowledge.data.knowledgeVersion); checks++;
  const urgent = await call("ask_dog_care", { question: "狗狗现在呼吸困难" });
  assert.equal(urgent.data.reply.route, "safety"); assert.deepEqual(urgent.data.reply.actions, []); checks++;
  const retainedSafety = await call("ask_dog_care", { question: "今天吃什么", context: ["狗狗呼吸困难", "一", "二", "三", "四", "五"] });
  assert.equal(retainedSafety.data.reply.route, "safety"); checks++;
  const fixture = name => JSON.parse(readFileSync(`agent-skill/examples/${name}.json`, "utf8"));
  const health = await call("assess_dog_happiness", fixture("healthy-dog"));
  assert.equal(health.response.isError, undefined); assert.equal(health.data.allowShare, true); checks++;
  const vet = await call("assess_dog_happiness", fixture("vet-boundary-dog"));
  assert.equal(vet.data.status, "red_vet"); assert.equal(vet.data.allowShare, false); assert.equal(vet.data.shareCopy, ""); checks++;
  const invalid = await call("assess_dog_happiness", {});
  assert.equal(invalid.response.isError, true); checks++;
  const record = { date: "2026-10-30", appetite: "和平时相近", energy: "和平时相近", stool: "和平时相近", note: "休息区安排", actionDone: true };
  const review = await call("review_dog_observations", { question: "看看休息情况", records: [record] });
  assert.equal(review.data.recordedDays, 1); assert.equal(review.data.actionCompletedDays, 1); assert.equal(review.data.stored, false); checks++;
  const badDate = await call("review_dog_observations", { question: "复盘", records: [{ ...record, date: "2026-02-30" }] });
  assert.equal(badDate.response.isError, true); checks++;
  const duplicate = await call("review_dog_observations", { question: "复盘", records: [record, record] });
  assert.equal(duplicate.response.isError, true); checks++;
  const safetyReview = await call("review_dog_observations", { question: "复盘", records: [{ ...record, note: "现在呼吸困难" }] });
  assert.equal(safetyReview.data.reply.route, "safety"); assert.deepEqual(safetyReview.data.reply.actions, []); checks++;
  const changedReview = await call("review_dog_observations", { question: "零食怎么控制", records: [{ ...record, stool: "与平时不同" }] });
  assert.equal(changedReview.data.reply.route, "clarify"); checks++;
  const invalidChoice = await call("review_dog_observations", { question: "复盘", records: [{ ...record, energy: "瞎猜正常" }] });
  assert.equal(invalidChoice.response.isError, true); checks++;
  const origin = await fetch(url, { method: "POST", headers: { Origin: "https://evil.invalid", "Content-Type": "application/json" }, body: "{}" });
  assert.equal(origin.status, 403); checks++;
  const oversized = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ junk: "x".repeat(70000) }) });
  assert.equal(oversized.status, 413); checks++;
  const zipResponse = await fetch(new URL("/downloads/dogcare-workbuddy.zip", url));
  assert.equal(zipResponse.status, 200); assert((await zipResponse.arrayBuffer()).byteLength > 0); checks++;
  console.log(`WorkBuddy MCP: ${checks} checks passed (real SDK handshake/tool calls; not a WorkBuddy client acceptance test).`);
} finally {
  await client.close();
}
