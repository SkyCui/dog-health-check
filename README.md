# 狗狗 1 分钟健康自测

一个 Next.js + TypeScript + Tailwind CSS Web MVP。用户完成 6 个轻量问题后，生成狗狗健康习惯 Dashboard。

## 功能范围

- 首页产品介绍和开始自测入口
- 6 个问题的本地自测表单
- 本地规则生成结果，无数据库、无登录、无支付
- Dashboard 展示核心结论、长寿习惯指数、五维小指标、优势、核心风险、今日行动、就医提醒和分享文案
- 安全边界优先于普通生活方式建议
- RAG 知识库仅保留 `knowledge/README.md` 占位

## 启动

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 规则层

规则文件位于 `rules/`：

- `scoring-rules.json`
- `dimension-score-rules.json`
- `risk-priority-rules.json`
- `vet-boundary-rules.json`
- `share-permission-rules.json`
- `recommendation-rules.json`

结果生成入口位于 `lib/generateResult.ts`。

## Agent API

外部 Agent 可以调用：

```bash
POST /api/assess
```

本地测试：

```bash
curl -X POST http://localhost:3000/api/assess \
  -H "Content-Type: application/json" \
  --data @agent-skill/examples/healthy-dog.json
```

Agent Skill 文件包位于 `agent-skill/`。Web 页面和 API 复用同一套 `generateResult` 逻辑，Agent 不应自行打分或绕过安全边界。
