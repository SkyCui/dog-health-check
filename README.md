# 你的狗狗幸福吗？

一个 Next.js + TypeScript + Tailwind CSS 的循证轻量自查与身心喂养咨询 Beta。用户完成 10 个题组后，获得幸福观察 Dashboard，并可进入带出处的个性化知识库咨询。

## 产品边界

- 本地结构化知识库与确定性规则，不接数据库或真实 RAG
- Web 与 Agent API 共用 `lib/generateResult.ts`
- 咨询使用本地确定性检索，不需要 OpenAI API Key，不从模型记忆生成医学或营养结论
- 首个咨询会话免费（最多 5 轮），之后展示 ¥9.99 Plus 永久会员
- Plus 仅提供个性化知识建议和计划，不包含真人兽医或营养师咨询
- 权重属于 `product_heuristic`，不是临床验证公式
- `unknown` 作为缺失观察处理，不加分也不扣分；API 返回覆盖率与可信度
- 加权覆盖率低于 70% 时返回 `status=insufficient`，不生成总分或分享内容
- `red_vet` 与 `behavior_support` 由安全信号触发，低分本身不会触发
- 分享幸福卡会在浏览器本地生成指向 `https://dogcare.cc/` 的参与二维码
- 我助力你更好了解毛孩子，但无法替代兽医或行为专业评估

## 启动与验证

```bash
npm install
npm run dev
npm run test:knowledge
npm run test:api
npm run test:consult
npm run build
```

知识与运行规则位于 `knowledge/`；请求和响应协议位于 `schemas/`；Agent 文件包位于 `agent-skill/`；小红书单文件上传包位于 `red-skill/SKILL.md`。

Red Skill 优先打开可点击 Web 问卷；只有运行环境能够调用 API 时，才使用逐题问答或知识库咨询。支付尚未接入时，`NEXT_PUBLIC_PLUS_CHECKOUT_URL` 留空，页面会显示“支付接入准备中”。正式收费前必须补齐登录、服务端权益、订单和已签名支付回调。

本地 API 示例：

```bash
curl -X POST http://localhost:3000/api/assess \
  -H 'Content-Type: application/json' \
  --data @agent-skill/examples/healthy-dog.json
```

咨询 API 示例：

```bash
curl -X POST http://localhost:3000/api/consult \
  -H 'Content-Type: application/json' \
  --data '{"assessment": {"dogName":"百万","age":"3 岁","breed":"柯基","weight":"12kg","size":"medium","bodyCondition":"ideal","foodTypes":["kibble"],"snackLevel":"low","movement":{"outdoorFrequency":"two_plus","dailyMinutes":"over_30","sniffing":"rich"},"recentSignals":["normal"],"homeEnvironment":["none"],"mentalState":{"positiveEngagement":"often","relaxation":"easy","socialConnection":"secure","distressSignals":["none"]}},"message":"帮我做一周日常喂养计划"}'
```
