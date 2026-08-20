---
name: assess-dog-happiness
description: Run the evidence-informed dog happiness Beta self-check and post-assessment care consultation. Use when collecting observations, calling /api/assess, calling /api/consult for cited feeding or wellbeing guidance, or routing safety signals. Never score or advise from model memory.
---

# 你的狗狗幸福吗？循证轻量自查 Beta

## Non-negotiable boundaries

- Treat `knowledge/` as the only assessment authority. Do not score from model memory.
- Collect every required field defined by `knowledge/questionnaire.json` before calling the API.
- Call `POST /api/assess`; repeat its result without changing scores, status, risk priority, support route, sharing permission, or evidence.
- Never describe this Beta as clinically validated, diagnostic, or guaranteed accurate.
- Always state: `我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。`

## Evidence levels

- `A1`: formal international or national veterinary guidance.
- `A2`: peer-reviewed canine instruments with reported reliability or validity work.
- `B`: peer-reviewed welfare theory used to organize observations.
- `C`: official education or consensus used only for explanations and action wording.

Read full source metadata and limitations from `knowledge/sources.json` and `knowledge/methodology.md`. Numeric weights are `product_heuristic`, not findings copied from papers.

## Ten question groups

Collect the exact fields and enums from `knowledge/questionnaire.json`:

1. Basic information: age, breed, optional weight, and size.
2. Body condition.
3. Food types and snack level.
4. Outdoor frequency, daily minutes, and sniffing.
5. Recent physical signals, separated into persistent observations and urgent warning signs.
6. Home environment exposures.
7. Positive engagement during the last two weeks compared with the dog's usual state.
8. Relaxation and recovery after ordinary activity or stimuli.
9. Social safety and freedom to approach or leave.
10. Persistent stress or unusual behavior signals.

Do not infer that quiet, independent, introverted, or less obedient dogs are unhappy. For questions 7-10, compare the dog only with its own usual behavior. `none` and `unknown` must each be selected alone in multi-select groups.

## Runtime flow

1. Read the questionnaire and collect missing observations neutrally.
2. Submit the exact request schema to `/api/assess`.
3. Display `assessmentConfidence` and `answeredCoverage` before scores. An `unknown` answer is missing observation, never a medium score.
4. If `status=insufficient`, do not invent or display a total score; explain what to observe before retesting.
5. Otherwise display `happinessScore`, `healthScore`, `mentalWellbeingScore`, both dimension sets, one priority risk, and one action.
6. Cite only the returned `evidenceRefs`; do not add unsupported reasons.
7. Display `knowledgeVersion` and the Beta disclaimer.

## Post-assessment consultation

- Only call `POST /api/consult` after a complete assessment is available; send the original `AssessmentInput`, not a model-written summary.
- Treat `knowledge/consultation/` as the only feeding and wellbeing consultation authority.
- Repeat the returned answer, plan, watch points, citations, and safety route without adding claims from memory.
- Do not diagnose disease, choose therapeutic diets, give drug or supplement doses, or generate a generic home-prepared recipe claimed to be complete and balanced.
- When `mode=safety`, keep the returned plan empty and prioritize professional support.
- The Web MVP includes one free consultation session with up to five turns, then presents the ¥9.99 Plus lifetime plan. Payment enforcement still requires login, server-side entitlements, orders, and verified callbacks.

## Safety precedence

1. Explicit urgent medical signals, `sudden_behavior_change`, or `self_injury` produce `red_vet`. Persistent cough, drinking/urination change, unexplained weight change, and sustained appetite change do not trigger `red_vet` by themselves.
2. Persistent fear, separation distress, pacing/vocalizing, repetitive behavior, or aggression risk produce `behavior_support`.
3. Low scores alone never produce a safety status.

For both safety statuses, accept the API output exactly: `allowShare=false` and `shareCopy=""`. Do not provide ordinary lifestyle or enrichment suggestions. Follow `supportRoute` and `supportReminder`.

When `status=insufficient`, accept `happinessScore=null`, `allowShare=false`, and `shareCopy=""`. Ask for more observation; never replace unknown values with guessed answers.

## Key files

- Questionnaire: `knowledge/questionnaire.json`
- Source register: `knowledge/sources.json`
- Evidence traceability: `knowledge/evidence-map.json`
- Method limits: `knowledge/methodology.md`
- Runtime rules: `knowledge/rules/*.json`
- API contract: `schemas/*.json`
