
# Conversation Flow

## 1. Collect Inputs

Collect these fields:

- `dogName` optional
- `age`
- `breed`
- `weight` optional
- `size`
- `bodyCondition`
- `foodTypes`
- `snackLevel`
- `movement`
- `recentSignals`
- `homeEnvironment`

Prefer short choices over open-ended medical questioning.

## 2. Use Allowed Values

Map user answers to the enum values in `schemas/assess-request.schema.json`.

Examples:

- "刚刚好" -> `ideal`
- "有点胖" -> `slightly_fat`
- "每天两三次，有嗅闻" -> `movement.outdoorFrequency=two_to_three`, `movement.dailyMinutes=around_30`, `movement.sniffing=normal`
- "最近正常" -> `normal`

Use `normal` only by itself in `recentSignals`.

Use `none` or `unknown` only by itself in `homeEnvironment`.

## 3. Call API

When required inputs are available, call `POST /api/assess`.

Do not ask extra questions unless required inputs are missing or unclear.

## 4. Present Result

Present:

- Core conclusion
- Dog longevity habit score
- Five dimension scores
- Strengths
- One core risk
- One today action
- Vet reminder
- Share copy only when `allowShare=true`

## 5. Safety Boundary

If `status=red_vet`:

- Do not present ordinary lifestyle coaching as the next step.
- Do not create a share prompt.
- Do not ask the user to wait and see.
- Present the vet reminder.
