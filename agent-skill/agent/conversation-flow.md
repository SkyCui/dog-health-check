# Conversation flow

## Entry

Send:

> 我会用 10 个轻量题组，陪你观察毛孩子最近的身心状态。
>
> 1. [开始可点击版自查](https://dog-health-check.vercel.app/assessment)
> 2. 先了解适用范围

If the runtime can call `assessDogHappiness`, also offer `3. 在对话里逐题完成`. Never offer chat collection when the tool is unavailable.

For option 2, explain briefly: this is an observation aid, not a diagnosis; urgent physical or behavior signals require professional support. End with `我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。`

## Chat state

- Ask exactly one numbered group per message and show `问题 X/10`.
- Persist accepted fields and the current group. Never restart after an unrelated interruption; say `继续` to resume.
- `上一步` returns to the previous group and replaces its saved answer.
- `退出自查` clears the in-progress answers after confirming the exit.
- For multi-select groups, accept comma-separated numbers. Reject invalid combinations without advancing.
- Do not infer missing answers or call the API with defaults.

## Numbered groups and enum mapping

1. **基础信息**: nickname (optional), age, breed, weight (optional), then size: `1 small`, `2 medium`, `3 large`, `4 unknown`.
2. **体况**: `1 thin 偏瘦`, `2 ideal 刚刚好`, `3 slightly_fat 有点胖`, `4 obese 明显胖`. Do not offer `unknown`.
3. **饮食**: food types, multi-select: `1 kibble`, `2 canned`, `3 freeze_dried`, `4 fresh`, `5 homemade`, `6 mixed`; snack level: `1 low`, `2 medium`, `3 high`.
4. **运动与嗅闻**: one combined choice:
   - `1` -> `rare / under_10 / none`
   - `2` -> `once_toilet_only / under_10 / little`
   - `3` -> `one_to_two / 10_20 / normal`
   - `4` -> `two_to_three / around_30 / normal`
   - `5` -> `two_plus / over_30 / rich`
5. **最近状态**, multi-select: `1 unstable_poop`, `2 bad_breath`, `3 paw_licking_or_scratching`, `4 low_energy`, `5 appetite_change`, `6 vomiting`, `7 diarrhea`, `8 pain`, `9 mobility_issue`, `10 normal`. `normal` must be alone.
6. **家庭环境**, multi-select: `1 aromatherapy`, `2 strong_cleaner`, `3 secondhand_smoke`, `4 plastic_bowl`, `5 pesticide`, `6 none`, `7 unknown`. `none` and `unknown` must each be alone.
7. **积极参与**: `1 often`, `2 sometimes`, `3 rare`, `4 unknown`.
8. **放松恢复**: `1 easy`, `2 sometimes_difficult`, `3 often_difficult`, `4 unknown`.
9. **社交安全与选择感**: `1 secure`, `2 variable`, `3 withdrawn`, `4 unknown`.
10. **持续压力与异常行为**, multi-select: `1 frequent_fear_or_hiding`, `2 separation_distress`, `3 persistent_pacing_or_vocalizing`, `4 repetitive_behavior`, `5 sudden_behavior_change`, `6 aggression_safety_risk`, `7 self_injury`, `8 none`, `9 unknown`. `none` and `unknown` must each be alone.

For groups 7-10, say: `请回看最近两周，并与它平时的状态相比。`

After all fields are present, summarize the saved answers once, allow corrections, then call `assessDogHappiness` exactly once. Never score in the conversation.
