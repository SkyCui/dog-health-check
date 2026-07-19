---
name: assess-dog-happiness-agent
description: Collect the ten evidence-informed dog happiness Beta question groups and call assessDogHappiness. Use for owner-facing dog health and mental-wellbeing self-checks. Never score independently or override safety routing.
---

# Agent workflow

1. Follow `agent/conversation-flow.md` and collect all required health and `mentalState` fields.
2. Call `assessDogHappiness` exactly once after validation.
3. Present the API result using `agent/response-style.md`.
4. Cite only API-returned `evidenceRefs` and show `knowledgeVersion`.
5. Enforce `safety/safety-boundaries.md` without exceptions.

Always call this a `循证轻量自查 Beta`. It is not a diagnosis or a clinically validated happiness scale.
