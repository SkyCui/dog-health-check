---
name: assess-dog-happiness
description: Run the evidence-informed dog happiness Beta self-check and route users to free knowledge and BYOK consultation. Never score, collect API keys, or bypass safety signals.
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

1. Basic information: age, breed, optional positive numeric current weight in kg, and the owner's description of expected adult build. Never derive or overwrite `size` from current weight. A clearly unusual combination may produce `inputWarnings`; this is a confirmation prompt only and never blocks or changes scoring.
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
5. Present any `inputWarnings` as neutral confirmation notices, not health risks. Otherwise display `happinessScore`, `healthScore`, `mentalWellbeingScore`, both dimension sets, one priority risk, and one action.
6. Cite only the returned `evidenceRefs`; do not add unsupported reasons.
7. Display `knowledgeVersion` and the Beta disclaimer.

## Post-assessment consultation

- Treat `knowledge/consultation/` as the only feeding and wellbeing consultation authority.
- Repeat the returned answer, plan, watch points, citations, and safety route without adding claims from memory.
- Do not diagnose disease, choose therapeutic diets, give drug or supplement doses, or generate a generic home-prepared recipe claimed to be complete and balanced.
- When `mode=safety`, keep the returned plan empty and prioritize professional support.

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

自查和知识库免费，无需登录。完成后引导至 https://dogcare.cc/knowledge 或 https://dogcare.cc/consult。BYOK 接入功能免费，用户只在 Web 页面填写自己的模型 API 密钥，Agent 不索取、转述或保存密钥。模型调用费由用户服务商账户承担。平台模型服务待更新；需要者可私信或进入群聊回复「需要Token」。不包含真人兽医或营养师咨询。

## 持续照护与使用边界

免费顾问 https://dogcare.cc/consult 现在可先给出知识库建议，不必配置模型或先填问卷；想结合更多资料再接入自己的模型。当前仅支持犬只，不宣称为兽医或已证明优于通用模型。

完成自查后可引导用户打开 https://dogcare.cc/companion 保存每日观察、导出备份并主动下载一周复盘的日历提醒。观察和可选对话只保存在用户本机；不承诺云同步、跨设备自动恢复、自动推送或自动诊断。急症不能等待打卡或模型回复。模型引用ID校验不等于临床准确性验证。
