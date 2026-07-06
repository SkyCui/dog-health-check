# Conversation Flow

## Principle

Use a card-first flow. Do not make the user answer a long plain-text questionnaire when buttons, quick replies, tabs, or choice cards are available.

If the host cannot render cards, use compact numbered choices and let the user reply with numbers.

## 1. Intro Card

Show:

- Title: 狗狗 1 分钟健康自测
- Subtitle: 生成健康习惯 Dashboard，不替代兽医诊断
- CTA: 开始自测

## 2. Collect Inputs With Six Screens

### Screen 1: Basic Info

Fields:

- `dogName` optional free text
- `age` required free text
- `breed` required free text
- `weight` optional free text
- `size` single choice:
  - 小型犬 -> `small`
  - 中型犬 -> `medium`
  - 大型犬 -> `large`
  - 不确定 -> `unknown`

### Screen 2: Body Condition

Single choice cards:

- 偏瘦：肋骨明显，腰很细 -> `thin`
- 刚刚好：能摸到肋骨，有腰线 -> `ideal`
- 有点胖：肋骨不太好摸 -> `slightly_fat`
- 明显胖：肚子圆，走路容易喘 -> `obese`
- 不确定：凭第一感觉也可以 -> `unknown`

### Screen 3: Diet

Multi-select `foodTypes`:

- 狗粮 -> `kibble`
- 罐头 -> `canned`
- 冻干 -> `freeze_dried`
- 鲜食 -> `fresh`
- 自制 -> `homemade`
- 混合喂养 -> `mixed`

Single-select `snackLevel`:

- 零食少 -> `low`
- 中等 -> `medium`
- 偏多 -> `high`

### Screen 4: Movement Presets

Use preset cards so the user does not need to answer three separate movement fields:

- 很少出门 / 主要在家活动 -> `{ outdoorFrequency: "rare", dailyMinutes: "under_10", sniffing: "none" }`
- 每天 1 次 / 主要下楼上厕所 -> `{ outdoorFrequency: "once_toilet_only", dailyMinutes: "under_10", sniffing: "little" }`
- 每天 1～2 次 / 累计 10～20 分钟 -> `{ outdoorFrequency: "one_to_two", dailyMinutes: "10_20", sniffing: "normal" }`
- 每天 2～3 次 / 累计 30 分钟左右 -> `{ outdoorFrequency: "two_to_three", dailyMinutes: "around_30", sniffing: "normal" }`
- 出门且能慢慢闻 / 有比较多嗅闻和探索 -> `{ outdoorFrequency: "two_plus", dailyMinutes: "over_30", sniffing: "rich" }`

### Screen 5: Recent Signals

Multi-select `recentSignals`:

- 便便不稳定 -> `unstable_poop`
- 口臭 -> `bad_breath`
- 舔爪 / 抓痒 -> `paw_licking_or_scratching`
- 精神明显变差 -> `low_energy`
- 食欲明显变化 -> `appetite_change`
- 呕吐 -> `vomiting`
- 腹泻 -> `diarrhea`
- 明显疼痛 -> `pain`
- 行动异常 -> `mobility_issue`
- 最近都正常 -> `normal`

Rules:

- `normal` is exclusive. If selected, clear all other recent signals.
- The urgent values are not diagnoses. They only trigger the API safety boundary.

### Screen 6: Home Environment

Multi-select `homeEnvironment`:

- 香薰 -> `aromatherapy`
- 刺激性清洁剂 -> `strong_cleaner`
- 二手烟 -> `secondhand_smoke`
- 塑料饭盆 -> `plastic_bowl`
- 杀虫剂 / 草坪药剂 -> `pesticide`
- 都没有 -> `none`
- 不确定 -> `unknown`

Rules:

- `none` is exclusive.
- `unknown` is exclusive.

## 3. Call API

When required inputs are available, call `POST /api/assess`.

Do not ask extra questions unless required inputs are missing or unclear.

## 4. Present Dashboard Report

Render `dashboardReport` from the API response:

- Title: `dashboardReport.title`
- Subtitle: `dashboardReport.subtitle`
- Score badge: `dashboardReport.scoreLabel`
- Cards: every object in `dashboardReport.sections[]`

Do not invent or reorder safety-relevant content.

## 5. Share Guidance

If `allowShare=true`:

- Show `shareCopy` in a copyable block.
- Show `shareGuide.primaryCta` as the main CTA.
- Show enabled `shareGuide.actions` as buttons:
  - copy_text
  - download_image
  - wechat_moments
  - xiaohongshu
  - weibo
- Show `shareGuide.safetyNote`.

If native file/image sharing is unavailable, tell the user to copy the text and upload the generated/downloaded dashboard image manually.

## 6. Safety Boundary

If `status=red_vet`:

- Do not present ordinary lifestyle coaching as the next step.
- Do not create a share prompt.
- Do not ask the user to wait and see.
- Present the vet reminder and the API-provided `todayAction`.
