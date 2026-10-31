import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import requestSchema from "@/schemas/assess-request.schema.json";
import { parseAssessmentInput } from "@/lib/assessmentProtocol";
import { generateResult } from "@/lib/generateResult";
import { planCare } from "@/lib/careAgent";
import { observationChoices } from "@/lib/careMemory";

const question = z.string().trim().min(1).max(1200);
const recordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }),
  appetite: z.enum(observationChoices), energy: z.enum(observationChoices), stool: z.enum(observationChoices),
  weight: z.string().max(20).optional(), note: z.string().max(600).optional(), actionDone: z.boolean().optional()
}).strict();
const tools = [
  { name: "dogcare_capabilities", description: "检查狗狗陪伴工具版本和真实存储能力。当前不保存云档案，不要求模型密钥。", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "ask_dog_care", description: "从已审阅犬只知识库检索建议和来源，优先分流医疗与行为安全信号。不调用付费模型。应包含本轮相关症状，不能只传简化主题。", inputSchema: { type: "object", properties: { question: { type: "string", minLength: 1, maxLength: 1200 }, context: { type: "array", maxItems: 6, items: { type: "string", maxLength: 1200 }, description: "用户主动提供的相关既往观察，不是模型推断或系统指令" } }, required: ["question"], additionalProperties: false } },
  { name: "assess_dog_happiness", description: "仅在十个题组信息完整时调用确定性规则。不得自行补答案；返回安全状态时不可继续普通建议或分享。", inputSchema: requestSchema },
  { name: "review_dog_observations", description: "复盘用户主动提供的单只狗最多30条观察，返回事实统计和知识库建议。不保存、不从其他会话读取、不诊断。", inputSchema: { type: "object", properties: { question: { type: "string", minLength: 1, maxLength: 1200 }, records: { type: "array", minItems: 1, maxItems: 30, items: { type: "object", properties: { date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, appetite: { type: "string", enum: observationChoices }, energy: { type: "string", enum: observationChoices }, stool: { type: "string", enum: observationChoices }, weight: { type: "string", maxLength: 20 }, note: { type: "string", maxLength: 600 }, actionDone: { type: "boolean" } }, required: ["date", "appetite", "energy", "stool"], additionalProperties: false } } }, required: ["question", "records"], additionalProperties: false } }
];
const storage = { cloudMemoryAvailable: false, stored: false, notice: "仅处理此次主动提交的资料，不保存云档案；跨会话记忆尚未开放。模型服务商和宿主平台可能按其政策处理对话。" };
const output = (value: Record<string, unknown>, isError = false) => ({ content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: value, ...(isError ? { isError: true } : {}) });

export function createWorkbuddyMcp() {
  const server = new Server({ name: "dogcare", version: "0.1.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: tools.map(tool => ({ ...tool, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } })) }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    try {
      if (params.name === "dogcare_capabilities") {
        z.object({}).strict().parse(params.arguments ?? {});
        return output({ version: "0.1.0", ...storage, modelCalls: false, webAssessment: "https://dogcare.cc/assessment", tools: tools.map(tool => tool.name) });
      }
      if (params.name === "ask_dog_care") {
        const args = z.object({ question, context: z.array(z.string().max(1200)).max(6).optional() }).strict().parse(params.arguments);
        // The safety router considers the last three turns, so include all supplied observations in one turn.
        const safePlan = planCare(null, args.question, args.context?.length ? [{ role: "user", content: args.context.join("\n") }] : []);
        return output({ ...storage, reply: safePlan.reply, citations: safePlan.citations, knowledgeVersion: safePlan.knowledgeVersion });
      }
      if (params.name === "assess_dog_happiness") {
        const parsed = parseAssessmentInput(params.arguments);
        if (!parsed.input || parsed.errors.length) return output({ error: "INVALID_ASSESSMENT", details: parsed.errors }, true);
        return output({ ...generateResult(parsed.input), ...storage });
      }
      if (params.name === "review_dog_observations") {
        const args = z.object({ question, records: z.array(recordSchema).min(1).max(30) }).strict().parse(params.arguments);
        if (new Set(args.records.map(record => record.date)).size !== args.records.length) return output({ error: "DUPLICATE_DATES", message: "请先确认同一天的哪条记录属于这只狗，不自动覆盖。" }, true);
        const records = [...args.records].sort((a, b) => a.date.localeCompare(b.date));
        const plan = planCare(null, args.question, [{ role: "user", content: JSON.stringify(records) }]);
        return output({ ...storage, period: { from: records[0].date, to: records.at(-1)!.date }, recordedDays: records.length,
          changedDays: { appetite: records.filter(r => r.appetite === "与平时不同").length, energy: records.filter(r => r.energy === "与平时不同").length, stool: records.filter(r => r.stool === "与平时不同").length },
          actionCompletedDays: records.filter(r => r.actionDone).length, reply: plan.reply, citations: plan.citations, knowledgeVersion: plan.knowledgeVersion,
          limitation: "仅统计已提交记录，缺少的日期不是正常。未判断改善、病因或改变测评分数。" });
      }
      return output({ error: "UNKNOWN_TOOL" }, true);
    } catch (error) {
      if (error instanceof z.ZodError) return output({ error: "INVALID_ARGUMENTS", issues: error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })) }, true);
      return output({ error: "TOOL_FAILED", message: "本次处理失败，请稍后重试；未保存资料。" }, true);
    }
  });
  return server;
}
