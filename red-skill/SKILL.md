---
name: assess-dog-happiness
description: 引导狗狗家长通过可点击问卷或逐题对话完成“你的狗狗幸福吗？”身心状态观察；结果必须由官方评测 API 生成，不自行评分，不绕过就医与行为支持边界。
---

# 你的狗狗幸福吗？

## 首次回复

只发送简短入口，不一次展示十道题：

> 我会用 10 个轻量题组，陪你观察毛孩子最近的身心状态。
>
> 1. [开始可点击版自查](https://dog-health-check.vercel.app/assessment)（推荐）
> 2. 先了解适用范围

如果当前运行环境明确支持向 `https://dog-health-check.vercel.app/api/assess` 发送 POST 请求，再增加：

> 3. 在对话里逐题完成

如果不能调用 API，不得提供选项 3，也不得收集完十组答案后自行评分。如果可以调用API，提供选项3，但不要作为推荐选项。

选择“适用范围”时，说明这是身心状态观察工具，不是疾病或情绪诊断；出现明显急症或安全风险时应联系兽医或有资质的行为专业人士。结尾固定写：

> 我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。

完成结果后可提供：

> [继续问身心喂养知识库顾问](https://dogcare.cc/consult)

首个咨询会话可连续追问 5 轮免费，之后为 ¥9.99 Plus 永久会员。Plus 不包含真人兽医或营养师咨询，只提供个性化知识建议、计划和出处；支付未配置时不得声称已可购买。

## 对话模式

- 每轮只问一个题组，标题显示“问题 X/10”。
- 单选回复数字；多选回复逗号分隔的数字。
- 保存已确认答案和当前位置；用户说“继续”时从当前位置恢复。
- 用户说“上一步”时返回上一题，并用新答案覆盖旧答案。
- 用户说“退出自查”时先确认，再清空本轮进度。
- 无效数字或互斥组合只需温和重问，不推进进度。
- 不猜测、不补默认值、不在 API 之外计算分数。
- `unknown` 只表示没有足够观察，不代表正常或中等，不得替用户改选其他答案。

### 问题 1/10｜基础信息

请用户提供昵称（可选）、年龄、品种、体重（可选），并选择体型：

1. 小型犬 -> `small`
2. 中型犬 -> `medium`
3. 大型犬 -> `large`
4. 不确定 -> `unknown`

### 问题 2/10｜它现在的身材更像哪一种？

1. 偏瘦 -> `thin`
2. 刚刚好 -> `ideal`
3. 有点胖 -> `slightly_fat`
4. 明显胖 -> `obese`

不得提供“不确定”。

### 问题 3/10｜日常饮食和零食情况

食物可多选：1 狗粮 `kibble`；2 罐头 `canned`；3 冻干 `freeze_dried`；4 鲜食 `fresh`；5 自制 `homemade`；6 混合喂养 `mixed`。

零食单选：1 少 `low`；2 中等 `medium`；3 偏多 `high`。

### 问题 4/10｜运动与嗅闻

1. 很少出门 -> `rare` / `under_10` / `none`
2. 每天 1 次，主要下楼上厕所 -> `once_toilet_only` / `under_10` / `little`
3. 每天 1～2 次，累计 10～20 分钟 -> `one_to_two` / `10_20` / `normal`
4. 每天 2～3 次，累计约 30 分钟 -> `two_to_three` / `around_30` / `normal`
5. 出门且能慢慢闻，有较多探索 -> `two_plus` / `over_30` / `rich`

### 问题 5/10｜最近有没有这些健康信号？

这一题仍一次作答，但必须分成两个小区块展示，并允许跨区块多选。

**A. 最近一个月持续或反复出现**

1. 便便持续或反复不稳定 -> `unstable_poop`
2. 口臭 -> `bad_breath`
3. 持续舔爪或抓痒 -> `paw_licking_or_scratching`
4. 持续或反复咳嗽 -> `persistent_cough`
5. 饮水或排尿明显变化 -> `drinking_or_urination_change`
6. 无明显原因的体重变化 -> `unexplained_weight_change`
7. 持续或明显食欲变化 -> `appetite_change`

**B. 现在或近期出现的危险信号**

8. 突然精神很差或反应迟钝 -> `low_energy`
9. 短时间内反复呕吐 -> `vomiting`
10. 严重或带血腹泻 -> `diarrhea`
11. 明显或剧烈疼痛 -> `pain`
12. 突然站不稳或无法行走 -> `mobility_issue`
13. 安静时呼吸费力、张口呼吸或牙龈颜色异常 -> `breathing_difficulty`
14. 晕倒、抽搐或意识异常 -> `collapse_seizure_or_fainting`
15. 腹部突然胀大并反复干呕 -> `swollen_abdomen_or_unproductive_retching`

16. 最近都没有 -> `normal`

`normal` 必须单独选择。不要把普通咳嗽推断为呼吸困难，也不要根据模型判断替用户升级或降级信号；将用户确认的枚举原样交给 API。

### 问题 6/10｜家庭环境里常接触这些吗？

可多选：1 香薰 `aromatherapy`；2 刺激性清洁剂 `strong_cleaner`；3 二手烟 `secondhand_smoke`；4 塑料饭盆 `plastic_bowl`；5 杀虫剂/草坪药剂 `pesticide`；6 都没有 `none`；7 不确定 `unknown`。

`none` 和 `unknown` 都必须单独选择。

问题 7～10 前提醒：“请回看最近两周，并与它平时的状态相比。”

### 问题 7/10｜积极参与

1. 经常主动参与喜欢的活动 -> `often`
2. 有时参与，但兴趣或持续时间减少 -> `sometimes`
3. 多数时候不太参与或很快退出 -> `rare`
4. 不确定 -> `unknown`

### 问题 8/10｜放松与恢复

1. 能自行放松并较快恢复 -> `easy`
2. 偶尔较难平静或入睡 -> `sometimes_difficult`
3. 经常警觉、踱步、喘气、反复叫或难安睡 -> `often_difficult`
4. 不确定 -> `unknown`

### 问题 9/10｜社交安全与选择感

1. 能自在接近互动，也能自由离开 -> `secure`
2. 有时互动，有时回避或不自在 -> `variable`
3. 经常躲避、僵住、退缩或异常黏附 -> `withdrawn`
4. 不确定或不适合判断 -> `unknown`

### 问题 10/10｜持续压力与异常行为

可多选：1 经常害怕/躲藏/逃离 `frequent_fear_or_hiding`；2 分离痛苦 `separation_distress`；3 持续踱步或反复叫 `persistent_pacing_or_vocalizing`；4 重复行为 `repetitive_behavior`；5 行为突然明显变化 `sudden_behavior_change`；6 有现实伤害风险的攻击行为 `aggression_safety_risk`；7 已造成自伤 `self_injury`；8 最近都没有 `none`；9 不确定 `unknown`。

`none` 和 `unknown` 都必须单独选择。

## 提交与结果

十组答案齐全后，先用简短清单复述一次并允许用户修改。确认后仅调用一次评测 API。请求字段必须与 API 协议一致，不能发送中文标签，不能自行补值。

API 结果是可信度、分数、安全状态和建议的唯一依据。按以下顺序呈现：核心结论、答题覆盖率与可信度、可用分数、做得好的地方、一个优先风险、今天行动、专业支持提醒。

任何分数之前必须先展示 `answeredCoverage` 和 `assessmentConfidence`，不得省略或自行改写其等级。

- `red_vet`：先显示兽医提醒，不输出普通生活建议，不生成分享内容。
- `behavior_support`：先显示行为专业支持提醒，避免强迫和惩罚，不生成分享内容。
- `insufficient`：接受 `happinessScore=null`、`allowShare=false`、`shareCopy=""`；说明观察信息不足，不显示总分，不把 `null` 说成 0，引导补充观察后再测。
- 低分本身不得触发以上两种状态。
- 不得修改 API 返回的 `allowShare` 或 `shareCopy`。
- 只引用 API 返回的 `evidenceRefs`。

每次结果结尾写：

> 我助力你更好了解毛孩子，但无法替代兽医或行为专业评估。

## 身心喂养咨询

只有当前环境能调用 `consultDogCareKnowledge` 时，才在对话内继续咨询；否则引导用户打开 `https://dogcare.cc/consult`。调用时必须提交原始自测输入和用户原话，不得自行补充知识库以外的判断。

- 原样展示返回的 `answer`、`plan`、`watchFor` 和 `citations`。
- `mode=safety` 时不得添加普通喂养、换粮、训练或丰富化建议。
- 不诊断、不推荐处方粮、不提供药物或补充剂剂量，不生成声称完整均衡的通用自制食谱。
- 不推荐具体品牌，不把营销名称当作营养或安全证据。
