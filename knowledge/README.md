# 你的狗狗幸福吗？知识库

当前版本：`dog-happiness-kb-2.2.0-beta`

本目录是 Web、API 和 Agent Skill 的唯一评测依据。运行时代码只执行这里的结构化问卷和规则，不联网检索，也不允许 Agent 自行补充分数。

- `sources.json`：来源权威度、验证信息、适用范围和限制。
- `questionnaire.json`：10 个正式题组、字段、选项和证据引用。
- `evidence-map.json`：问题、风险与建议的证据映射。
- `rules/assessment-rules.json`：健康、精神、幸福指数、安全和分享规则。
- `methodology.md`：方法、可保证范围和验证计划。
- `consultation/`：身心喂养咨询的来源、主题条目、安全规则和方法边界，是 `/api/consult` 的唯一建议依据。

所有数字分值、50/50 权重与可信度阈值均为可复现的产品启发式规则，不是论文结论或临床诊断阈值。`unknown` 是缺失观察，不映射为分数；覆盖率不足时不生成幸福观察总分。
