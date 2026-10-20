"use client";

import { CheckCircle2, Download, Loader2, QrCode, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Order = {
  id: string;
  productId: "platform_consult_session" | "byok_lifetime";
  provider: "wechat";
  amountFen: number;
  status: string;
  paymentCodeUrl?: string | null;
  paymentExpiresAt?: string | null;
};

export default function NativeCheckout({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [paymentMode, setPaymentMode] = useState<"mock" | "live">("mock");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const [orderResponse, accountResponse] = await Promise.all([
          fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" }),
          fetch("/api/account", { cache: "no-store" })
        ]);
        const orderBody = await orderResponse.json();
        const accountBody = await accountResponse.json();
        if (!orderResponse.ok) throw new Error(orderBody?.error?.message || "订单读取失败。");
        if (stopped) return;
        setOrder(orderBody.order);
        setPaymentMode(accountBody.paymentMode === "live" ? "live" : "mock");
        if (orderBody.order.paymentCodeUrl) {
          setQrDataUrl(await QRCode.toDataURL(orderBody.order.paymentCodeUrl, { width: 360, margin: 2, errorCorrectionLevel: "M" }));
        }
        if (orderBody.order.status === "pending") timer = setTimeout(load, 2500);
      } catch (reason) {
        if (!stopped) setError(reason instanceof Error ? reason.message : "订单读取失败。");
      }
    };
    load();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [orderId]);

  async function confirmMockPayment() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/mock/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "沙盒确认失败。");
      setOrder((current) => current ? { ...current, status: "paid" } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "沙盒确认失败。");
    } finally {
      setBusy(false);
    }
  }

  const paid = order?.status === "paid";
  const productName = order?.productId === "byok_lifetime" ? "自带模型 API 永久权益" : "平台模型快速咨询";

  return <main className="grid min-h-screen place-items-center px-4 py-6 sm:py-10">
    <section className="candy-card w-full max-w-xl rounded-[2rem] p-5 text-center sm:p-8">
      <p className="inline-flex items-center gap-2 rounded-full bg-[#eaf8ea] px-4 py-2 text-sm font-black text-[#168516]"><QrCode size={17} /> 微信 Native 扫码支付</p>
      <h1 className="mt-4 text-2xl font-black text-ink sm:text-3xl">{paid ? "支付已确认" : "请使用微信扫一扫"}</h1>
      {order ? <div className="mt-3"><p className="font-bold text-cocoa/65">{productName}</p><p className="mt-1 text-3xl font-black text-rose">¥{(order.amountFen / 100).toFixed(2)}</p></div> : null}

      {!order && !error ? <Loader2 className="mx-auto mt-8 animate-spin text-rose" size={30} /> : null}
      {!paid && qrDataUrl ? <div className="mx-auto mt-6 w-fit rounded-3xl border border-rose/15 bg-white p-3 shadow-panel"><img src={qrDataUrl} alt="微信支付二维码" className="h-[min(68vw,280px)] w-[min(68vw,280px)]" /></div> : null}
      {!paid && qrDataUrl ? <div className="mt-5 grid gap-2 text-left text-sm leading-6 text-cocoa/65 sm:grid-cols-2"><p className="flex items-start gap-2 rounded-2xl bg-white/70 p-3"><Smartphone className="mt-0.5 shrink-0 text-rose" size={18} /> 电脑端：打开微信扫一扫完成支付。</p><p className="flex items-start gap-2 rounded-2xl bg-white/70 p-3"><Download className="mt-0.5 shrink-0 text-rose" size={18} /> 手机端：保存二维码，使用另一部设备扫码。</p></div> : null}
      {!paid && qrDataUrl ? <a href={qrDataUrl} download={`dogcare-wechat-${orderId}.png`} className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose/20 bg-white px-5 py-2.5 text-sm font-black text-rose"><Download size={17} /> 保存二维码</a> : null}

      {paymentMode === "mock" && order && !paid ? <div className="mt-5 rounded-2xl border border-gold/25 bg-goldSoft p-4"><p className="flex items-center justify-center gap-2 text-sm font-black text-gold"><TriangleAlert size={17} /> 本地支付沙盒</p><p className="mt-2 text-xs leading-5 text-cocoa/60">二维码不会产生真实扣款。点击下方按钮模拟微信回调。</p><button type="button" disabled={busy} onClick={confirmMockPayment} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-white disabled:opacity-40">{busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} 模拟支付成功</button></div> : null}
      {paid ? <div className="mt-7"><CheckCircle2 className="mx-auto text-leaf" size={44} /><p className="mt-3 leading-7 text-cocoa/65">权益已经发放到当前登录账号。</p><Link href="/consult" className="candy-button mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-black text-white">进入养狗顾问</Link></div> : null}
      {error ? <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{error}</p> : null}
      {!paid ? <p className="mt-5 text-xs leading-5 text-cocoa/50">页面会自动查询支付状态。请勿重复支付同一订单。</p> : null}
    </section>
  </main>;
}
