# 你的狗狗幸福吗？Agent Skill

This package lets an external Agent collect the ten-question evidence-informed Beta self-check and request cited post-assessment feeding and wellbeing guidance from the same local knowledge base as the Web app.

Phase-one UX:

- Prefer the clickable assessment: https://dog-health-check.vercel.app/assessment
- Fall back to one numbered question group per turn only when the API action is available.
- Preserve progress and support back, resume, and exit commands.
- Offer the post-assessment consultation at https://dogcare.cc/consult. The first five-turn session is free; the product then presents a ¥9.99 Plus lifetime plan.
- Treat unknown observations as missing data. Present coverage and confidence, and suppress the total score and sharing when status is `insufficient`.

- `SKILL.md`: operating contract
- `agent/`: collection and response instructions
- `tools/assess_dog_health.openapi.yaml`: self-contained GPT Action definition
- `schemas/`: request and response contracts
- `examples/`: valid request examples
- `safety/`: mandatory routing rules
- `docs/agent-integration.md`: local and deployed integration

The OpenAPI file is fully self-contained and exposes both `/api/assess` and `/api/consult`. Replace its Vercel server URL only when deploying under another domain.
