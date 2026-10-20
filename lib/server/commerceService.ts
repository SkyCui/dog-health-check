import { randomUUID } from "node:crypto";
import { commercePlans } from "@/lib/commerce";
import type { PaymentProvider, ProductId, StoredEntitlement, StoredOrder } from "./store";
import { readStore, updateStore } from "./store";

const productAmounts: Record<ProductId, number> = {
  platform_consult_session: Math.round(commercePlans.platformConsult.priceCny * 100),
  byok_lifetime: Math.round(commercePlans.byokLifetime.priceCny * 100)
};

export const isMockPayment = () => process.env.PAYMENT_MODE?.trim() !== "live" && process.env.NODE_ENV !== "production";

export async function createOrder(userId: string, productId: ProductId, provider: PaymentProvider) {
  if (!isMockPayment()) {
    throw new Error(`${provider === "wechat" ? "微信支付" : "支付宝"}商户接口尚未配置，订单未创建。`);
  }
  const order = await updateStore((data) => {
    const reusable = data.orders.find((item) =>
      item.userId === userId &&
      item.productId === productId &&
      item.provider === provider &&
      item.status === "pending" &&
      Date.now() - new Date(item.createdAt).getTime() < 15 * 60 * 1000
    );
    if (reusable) return reusable;

    const id = randomUUID();
    const created: StoredOrder = {
      id,
      userId,
      productId,
      provider,
      amountFen: productAmounts[productId],
      status: "pending",
      paymentCodeUrl: provider === "wechat" ? `weixin://wxpay/bizpayurl/up?pr=dogcare_mock_${id.replaceAll("-", "")}` : null,
      paymentExpiresAt: provider === "wechat" ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null,
      channelTransactionId: null,
      createdAt: new Date().toISOString(),
      paidAt: null
    };
    data.orders.push(created);
    return created;
  });

  const checkoutPath = provider === "wechat" ? "/checkout/wechat" : "/checkout/mock";
  return { order, checkoutUrl: `${checkoutPath}?orderId=${encodeURIComponent(order.id)}` };
}

export async function getOrder(userId: string, orderId: string) {
  const data = await readStore();
  return data.orders.find((item) => item.id === orderId && item.userId === userId) ?? null;
}

export async function markMockOrderPaid(userId: string, orderId: string) {
  if (!isMockPayment()) throw new Error("生产环境禁止使用本地支付确认接口。");
  return updateStore((data) => {
    const order = data.orders.find((item) => item.id === orderId && item.userId === userId);
    if (!order) throw new Error("订单不存在。");
    if (order.status === "paid") return order;
    if (order.status !== "pending") throw new Error("当前订单状态不能支付。");
    order.status = "paid";
    order.paidAt = new Date().toISOString();

    const existing = data.entitlements.find((item) => item.orderId === order.id);
    if (!existing) {
      const now = Date.now();
      const entitlement: StoredEntitlement = order.productId === "platform_consult_session"
        ? { id: randomUUID(), userId, orderId: order.id, kind: "platform_session", status: "active", turnsRemaining: commercePlans.platformConsult.turns, expiresAt: new Date(now + commercePlans.platformConsult.validityHours * 60 * 60 * 1000).toISOString(), createdAt: new Date(now).toISOString() }
        : { id: randomUUID(), userId, orderId: order.id, kind: "byok_lifetime", status: "active", turnsRemaining: null, expiresAt: null, createdAt: new Date(now).toISOString() };
      data.entitlements.push(entitlement);
    }
    return order;
  });
}

export async function getAccountSummary(userId: string) {
  const data = await readStore();
  const now = Date.now();
  const entitlements = data.entitlements.filter((item) => item.userId === userId).map((item) => ({
    ...item,
    status: item.status === "active" && item.expiresAt && new Date(item.expiresAt).getTime() <= now ? "expired" as const : item.status
  }));
  return { entitlements, orders: data.orders.filter((item) => item.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

export async function consumeConsultationAccess(userId: string) {
  return updateStore((data) => {
    const now = Date.now();
    const byok = data.entitlements.find((item) => item.userId === userId && item.kind === "byok_lifetime" && item.status === "active");
    if (byok) return { mode: "byok_lifetime" as const, turnsRemaining: null, expiresAt: null };
    const session = data.entitlements
      .filter((item) => item.userId === userId && item.kind === "platform_session" && item.status === "active" && (item.turnsRemaining ?? 0) > 0 && item.expiresAt && new Date(item.expiresAt).getTime() > now)
      .sort((a, b) => String(a.expiresAt).localeCompare(String(b.expiresAt)))[0];
    if (!session) return null;
    session.turnsRemaining = Math.max(0, (session.turnsRemaining ?? 0) - 1);
    if (session.turnsRemaining === 0) session.status = "expired";
    return { mode: "platform_session" as const, turnsRemaining: session.turnsRemaining, expiresAt: session.expiresAt };
  });
}
