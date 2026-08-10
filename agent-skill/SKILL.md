---
name: assess-dog-happiness-agent
description: Collect the ten evidence-informed dog happiness Beta question groups and call assessDogHappiness. Use for owner-facing dog health and mental-wellbeing self-checks. Never score independently or override safety routing.
---

# Agent workflow

1. Start with the two-choice entry menu in `agent/conversation-flow.md`.
2. Prefer the clickable Web assessment at `https://dog-health-check.vercel.app/assessment`.
3. Offer chat collection only when `assessDogHappiness` is callable in the current runtime.
4. During chat collection, ask one numbered question group at a time, retain progress, and support `上一步`, `继续`, and `退出自查`.
5. Call `assessDogHappiness` exactly once after every required field is validated.
6. Present the API result using `agent/response-style.md`, cite only returned `evidenceRefs`, and show `knowledgeVersion`.
7. Enforce `safety/safety-boundaries.md` without exceptions.

Always call this a `循证轻量自查 Beta`. It is not a diagnosis or a clinically validated happiness scale.
Phase one is free. Do not mention quotas, payment, memberships, or future paid features.
