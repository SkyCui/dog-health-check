"use client";

import { CheckCircle2, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Order = { id: string; productId: "platform_consult_session" | "byok_lifetime"; provider: "wechat" | "alipay"; amountFen: number; status: string };

export default function MockCheckout({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${encodeURIComponent(orderId)}`).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "订单读取失败。");
      setOrder(body.order);
      setPaid(body.order.status === "paid");
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "订单读取失败。"));
  }, [orderId]);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/mock/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "确认失败。");
      setPaid(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "确认失败。");
    } finally {
      setBusy(false);
    }
  }

  const productName = order?.productId === "byok_lifetime" ? "自带模型 API 永久权益" : "平台模型快速咨询";
  const providerName = order?.provider === "wechat" ? "微信支付" : "支付宝";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="candy-card w-full max-w-lg rounded-[2rem] p-6 text-center sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-goldSoft px-4 py-2 text-sm font-black text-gold"><TriangleAlert size={17} /> 本地支付沙盒</p>
        <h1 className="mt-4 text-3xl font-black text-ink">{paid ? "沙盒支付已完成" : "模拟付款确认"}</h1>
        <p className="mt-3 leading-7 text-cocoa/65">该页面只用于开发测试，不连接微信或支付宝，也不会扣除真实资金。</p>

        {order ? <div className="mt-6 border-y border-rose/15 py-5 text-left"><p className="font-black text-ink">{productName}</p><p className="mt-2 text-sm text-cocoa/65">模拟渠道：{providerName}</p><p className="mt-2 text-3xl font-black text-rose">¥{(order.amountFen / 100).toFixed(2)}</p></div> : null}
        {error ? <p role="alert" className="mt-4 text-sm font-bold text-red-600">{error}</p> : null}

        {paid ? <Link href="/consult" className="candy-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black text-white"><CheckCircle2 size={19} /> 返回养狗顾问</Link> : <button type="button" onClick={confirm} disabled={busy || !order} className="candy-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black text-white disabled:opacity-40">{busy ? <Loader2 className="animate-spin" size={19} /> : <ShieldCheck size={19} />} 模拟支付成功</button>}
      </section>
    </main>
  );
}
