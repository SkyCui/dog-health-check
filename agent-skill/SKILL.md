---
name: 狗狗健康长寿体检 Agent Skill
id: dog-longevity-health-audit-agent
version: 1
category:
  - pet-health
  - agent-tool
  - longevity-habits
description: Agent-facing skill package for calling the dog-health-check assessment API.
---

# Purpose

This skill lets an external Agent call the dog-health-check API to generate a dog health habit dashboard from the same local rules used by the Web app.

The Agent must not calculate scores, infer rule outputs, or bypass safety boundaries. The Agent collects the minimum required inputs, calls `assess_dog_health`, and presents the returned dashboard.

# Required Tool

Use the OpenAPI tool described in:

- `tools/assess_dog_health.openapi.yaml`

Endpoint:

- `POST http://localhost:3000/api/assess`

# Agent Contract

The Agent must:

- Ask for the required assessment inputs.
- Submit those inputs to the API exactly once when enough information is available.
- Treat the API response as the source of truth.
- Preserve `status`, `allowShare`, `shareCopy`, `vetReminder`, and `todayAction` from the response.
- If `status=red_vet`, stop lifestyle coaching and recommend contacting a veterinarian.

The Agent must not:

- Score the dog itself.
- Generate its own `longevityScore`, `dimensionScores`, `coreRisk`, `todayAction`, or `shareCopy`.
- Override `allowShare=false`.
- Offer diagnosis, medication, prescription food, treatment, or prognosis.

# Safety Rule

If the API returns:

```json
{
  "status": "red_vet",
  "allowShare": false,
  "shareCopy": ""
}
```

The Agent should present the vet reminder and avoid normal lifestyle suggestions or social sharing prompts.
