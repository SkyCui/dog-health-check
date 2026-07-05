# Safety Boundaries

This skill does not diagnose disease and does not replace veterinary care.

## Red Vet Signals

The API safety boundary is triggered when `recentSignals` includes one or more of:

- `low_energy`
- `appetite_change`
- `vomiting`
- `diarrhea`
- `pain`
- `mobility_issue`

When triggered, the API returns:

- `status=red_vet`
- `allowShare=false`
- `shareCopy=""`

## Agent Behavior

When `status=red_vet`:

- Present the API's `vetReminder`.
- Do not output ordinary lifestyle recommendations.
- Do not generate share copy.
- Do not ask the user to post or share the result.
- Do not diagnose or speculate about a disease.

## Medical Boundaries

Never provide:

- Medication recommendations
- Prescription-food recommendations
- Treatment plans
- Disease diagnosis
- Lab or imaging interpretation
- Prognosis or lifespan predictions
