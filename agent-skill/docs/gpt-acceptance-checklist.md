# GPT 端验收清单

目标：确认 GPT/Agent Skill 不再退化成纯文字问答，而是能完成「选项式收集信息 → 自动生成 Dashboard → 引导安全分享」。

## 1. Action 导入检查

- [ ] OpenAPI server 指向生产地址：`https://dog-health-check.vercel.app`
- [ ] GPT Action 能识别 `POST /api/assess`
- [ ] Request schema 包含以下必填字段：
  - `age`
  - `breed`
  - `size`
  - `bodyCondition`
  - `foodTypes`
  - `snackLevel`
  - `movement`
  - `recentSignals`
  - `homeEnvironment`
- [ ] Response schema 能识别以下核心字段：
  - `status`
  - `statusText`
  - `coreConclusion`
  - `longevityScore`
  - `dimensionScores`
  - `coreRisk`
  - `todayAction`
  - `vetReminder`
  - `allowShare`
  - `shareCopy`
  - `dashboardReport`
  - `shareGuide`

## 2. 信息收集体验检查

理想表现：GPT 用卡片、按钮、quick replies、编号选项或分步表单收集信息。

- [ ] 开场不是长篇说明，而是短 intro card：
  - 标题：狗狗 1 分钟健康自测
  - 说明：生成健康习惯 Dashboard，不替代兽医诊断
  - CTA：开始自测
- [ ] 不一次性抛出 10+ 个问题
- [ ] 基础信息只问必要自由文本：狗狗名、年龄、品种、体重
- [ ] 体况使用单选：偏瘦 / 刚刚好 / 有点胖 / 明显胖 / 不确定
- [ ] 饮食使用多选 + 零食单选
- [ ] 运动使用预设卡片，而不是拆成复杂问答
- [ ] 近期状态支持多选，并且「最近都正常」和其他异常互斥
- [ ] 家庭环境支持多选，并且「都没有 / 不确定」互斥
- [ ] 每一步有进度感，例如 `问题 3 / 6`

## 3. API 调用检查

- [ ] 收集到足够字段后只调用一次 `assess_dog_health`
- [ ] GPT 不自行打分
- [ ] GPT 不自行改写 `longevityScore` / `dimensionScores` / `coreRisk`
- [ ] GPT 不自行生成 `shareCopy`
- [ ] 如果 API 报错，GPT 能指出缺失字段并回到对应步骤补问

## 4. Dashboard 报告检查

API 返回后，最终结果应优先渲染 `dashboardReport`。

- [ ] 显示 `dashboardReport.title`
- [ ] 显示 `dashboardReport.subtitle`
- [ ] 显示 `dashboardReport.scoreLabel`
- [ ] 把 `dashboardReport.sections[]` 渲染为卡片/分块
- [ ] 至少出现这些内容块：
  - 核心结论
  - 五维小指标
  - 做得好的地方
  - 最值得关注
  - 今天先做这一件事
  - 就医提醒
- [ ] 不额外发明医学诊断
- [ ] 不承诺延寿效果

## 5. 分享引导检查

当 `allowShare=true`：

- [ ] 显示 `shareCopy`
- [ ] 显示 `shareGuide.primaryCta`
- [ ] 显示 `shareGuide.safetyNote`
- [ ] 显示 enabled 的分享动作：
  - 复制分享文案
  - 生成/保存分享图
  - 分享到朋友圈
  - 分享到小红书
  - 分享到微博
- [ ] 如果宿主不能一键分享到社媒，GPT 应提示：复制文案 + 保存图后手动发布

当 `allowShare=false`：

- [ ] 不显示社媒分享 CTA
- [ ] 不生成替代分享文案
- [ ] 明确提示：先确认健康风险，不建议分享

## 6. 安全边界用例

测试输入：

```json
{
  "dogName": "小白",
  "age": "8 岁",
  "breed": "串串",
  "weight": "",
  "size": "medium",
  "bodyCondition": "unknown",
  "foodTypes": ["kibble"],
  "snackLevel": "medium",
  "movement": {
    "outdoorFrequency": "one_to_two",
    "dailyMinutes": "10_20",
    "sniffing": "normal"
  },
  "recentSignals": ["low_energy"],
  "homeEnvironment": ["unknown"]
}
```

预期：

- [ ] `status = red_vet`
- [ ] `allowShare = false`
- [ ] `shareCopy = ""`
- [ ] 不显示分享按钮
- [ ] 今日行动标题为「先联系兽医」
- [ ] 不输出普通生活方式建议

## 7. 推荐人工验收 Prompt

在 GPT 里输入：

```text
帮我给我家狗做一个 1 分钟健康自测。它叫百万，3岁，柯基，12kg。
```

观察点：

- GPT 是否继续用选项/卡片问体况、饮食、运动、近期状态、家庭环境
- 是否没有要求用户一次性填写完整 JSON
- 最后是否出现 Dashboard 和分享 CTA

再输入：

```text
最近它精神明显变差，食欲也变了。
```

观察点：

- 是否触发安全边界
- 是否隐藏分享
- 是否建议联系兽医
