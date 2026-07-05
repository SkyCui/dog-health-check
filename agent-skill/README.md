# 狗狗健康长寿体检 Agent Skill

这个文件包用于让外部 Agent 通过 API 调用当前 `dog-health-check` 项目的本地规则能力。

核心原则：

- Web 页面和 Agent API 复用同一套 `generateResult` 逻辑。
- Agent 只负责收集输入和展示结果。
- Agent 不自行打分，不重写建议，不绕过安全边界。
- 触发安全边界时，API 返回 `status=red_vet`、`allowShare=false`、`shareCopy=""`。

## Files

- `agent/system-prompt.md`: Agent 系统提示词
- `agent/conversation-flow.md`: 对话流程
- `agent/response-style.md`: 输出风格
- `tools/assess_dog_health.openapi.yaml`: API 工具定义
- `tools/tool-description.md`: 工具说明
- `schemas/`: 请求和响应 JSON Schema
- `examples/`: 测试样例
- `safety/safety-boundaries.md`: 安全边界
- `docs/agent-integration.md`: 本地测试和部署接入说明
