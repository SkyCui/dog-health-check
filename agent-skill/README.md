# 你的狗狗幸福吗？Agent Skill

This package lets an external Agent collect the ten-question evidence-informed Beta self-check and call the same rules engine as the Web app.

- `SKILL.md`: operating contract
- `agent/`: collection and response instructions
- `tools/assess_dog_health.openapi.yaml`: self-contained GPT Action definition
- `schemas/`: request and response contracts
- `examples/`: valid request examples
- `safety/`: mandatory routing rules
- `docs/agent-integration.md`: local and deployed integration

The OpenAPI file is fully self-contained. Replace its Vercel server URL only when deploying under another domain.
