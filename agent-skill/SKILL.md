---
name: 狗狗健康长寿体检 Agent Skill
id: dog-longevity-health-audit-agent
version: 2
category:
  - pet-health
  - agent-tool
  - longevity-habits
description: Card-first dog health habit assessment with dashboard report and share guidance.
---

# Purpose

This skill lets an external Agent collect dog health habit inputs through a card-first flow, call the dog-health-check API, and present a structured dashboard report with safe social sharing guidance.

The Agent must not calculate scores, infer rule outputs, or bypass safety boundaries. The Agent collects the minimum required inputs, calls `assess_dog_health`, and presents the returned dashboard.

# Required Tool

Use the OpenAPI tool described in:

- `tools/assess_dog_health.openapi.yaml`

Production endpoint:

- `POST https://dog-health-check.vercel.app/api/assess`

# Agent UX Contract

The Agent should avoid a plain text interrogation flow. Use the richest UI supported by the host GPT/App:

1. Start with a short intro card.
2. Collect inputs with choice cards, quick replies, button groups, or tabs.
3. Ask free-text only for dog name, age, breed, and optional weight.
4. Show progress, for example `问题 2 / 6`.
5. After the API returns, render `dashboardReport` as the main result.
6. If `allowShare=true`, show `shareGuide.actions` as one-click CTA options.
7. If the host cannot render cards/buttons, simulate them with compact numbered options and ask the user to reply with numbers.

Recommended collection screens:

- `basic_info`: dogName optional, age, breed, weight optional, size.
- `body_condition`: thin, ideal, slightly_fat, obese, unknown.
- `diet`: foodTypes multi-select, snackLevel single-select.
- `movement`: one of the movement presets in `agent/conversation-flow.md`.
- `recent_signals`: recentSignals multi-select; `normal` is exclusive.
- `home_environment`: homeEnvironment multi-select; `none` and `unknown` are exclusive.

# Agent Contract

The Agent must:

- Ask for the required assessment inputs.
- Submit those inputs to the API exactly once when enough information is available.
- Treat the API response as the source of truth.
- Preserve `status`, `allowShare`, `shareCopy`, `vetReminder`, `todayAction`, `dashboardReport`, and `shareGuide` from the response.
- Prefer rendering `dashboardReport.sections` over inventing a report.
- If `status=red_vet`, stop lifestyle coaching and recommend contacting a veterinarian.

The Agent must not:

- Score the dog itself.
- Generate its own `longevityScore`, `dimensionScores`, `coreRisk`, `todayAction`, `dashboardReport`, `shareGuide`, or `shareCopy`.
- Override `allowShare=false`.
- Offer diagnosis, medication, prescription food, treatment, or prognosis.

# Result Presentation

Use this order:

1. Dashboard title and score from `dashboardReport.title`, `dashboardReport.subtitle`, `dashboardReport.scoreLabel`.
2. Render each `dashboardReport.sections[]` as a card or compact block.
3. Show `shareCopy` only when `allowShare=true`.
4. Show share CTAs from `shareGuide.actions` only when their `enabled=true`.
5. Always include `shareGuide.safetyNote` near sharing actions.

# Safety Rule

If the API returns:

```json
{
  "status": "red_vet",
  "allowShare": false,
  "shareCopy": ""
}
```

The Agent should present the vet reminder, hide share CTAs, and avoid normal lifestyle suggestions or social sharing prompts.
