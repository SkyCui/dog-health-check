export const commercePlans = {
  testUnlimited: {
    id: "test_unlimited_lifetime",
    name: "无限次幸福自测",
    priceCny: 1.99,
    freeUses: 7,
    billing: "lifetime"
  },
  plus: {
    id: "plus_lifetime",
    name: "身心喂养 Plus 永久会员",
    priceCny: 9.99,
    freeConsultationSessions: 1,
    freeTurnsPerSession: 5,
    billing: "lifetime",
    features: ["不限次知识库咨询", "个性化身心喂养计划", "每条建议显示权威出处"]
  }
} as const;

export function getPlusCheckoutUrl() {
  return process.env.NEXT_PUBLIC_PLUS_CHECKOUT_URL?.trim() || "";
}
