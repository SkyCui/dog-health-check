export const commercePlans = {
  testUnlimited: {
    id: "test_unlimited_lifetime",
    name: "无限次幸福自测",
    priceCny: 1.99,
    freeUses: 7,
    billing: "lifetime"
  },
  platformConsult: {
    id: "platform_consult_session",
    name: "平台模型快速咨询",
    priceCny: 0.99,
    turns: 5,
    validityHours: 24,
    billing: "per_session",
    features: ["结合本次测评", "连续追问 5 轮", "24 小时内有效", "建议标明知识出处"]
  },
  byokLifetime: {
    id: "byok_lifetime",
    name: "自带模型 API",
    priceCny: 1.99,
    billing: "lifetime",
    features: ["永久解锁 API 配置功能", "自由选择支持的模型服务", "沿用同一套知识与安全边界"],
    modelCostNotice: "模型调用费用由用户选择的模型服务商另行收取"
  }
} as const;
