# 你的狗狗幸福吗？

一个 Next.js + TypeScript + Tailwind CSS 的循证轻量自查 Beta。用户完成 10 个题组后，获得身体健康、精神福祉和综合幸福观察 Dashboard。

## 产品边界

- 本地结构化知识库与确定性规则，不接数据库或真实 RAG
- Web 与 Agent API 共用 `lib/generateResult.ts`
- 权重属于 `product_heuristic`，不是临床验证公式
- `red_vet` 与 `behavior_support` 由安全信号触发，低分本身不会触发
- 我助力你更好了解毛孩子，但无法替代兽医或行为专业评估

## 启动与验证

```bash
npm install
npm run dev
npm run test:knowledge
npm run test:api
npm run build
```

知识与运行规则位于 `knowledge/`；请求和响应协议位于 `schemas/`；Agent 文件包位于 `agent-skill/`；小红书单文件上传包位于 `red-skill/SKILL.md`。

第一阶段 Red Skill 优先打开可点击 Web 问卷；只有运行环境能够调用评测 API 时，才使用逐题数字问答。第一阶段不包含计次、支付或会员功能。

本地 API 示例：

```bash
curl -X POST http://localhost:3000/api/assess \
  -H 'Content-Type: application/json' \
  --data @agent-skill/examples/healthy-dog.json
```
