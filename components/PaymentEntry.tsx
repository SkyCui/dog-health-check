"use client";

import { Loader2, LogIn, QrCode, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ProductId = "platform_consult_session" | "byok_lifetime";
type Account = { authenticated: boolean; paymentMode: "mock" | "live" };

const productCopy: Record<ProductId, { name: string; price: string; detail: string }> = {
  platform_consult_session: { name: "平台模型快速咨询", price: "¥0.99", detail: "购买后 24 小时内可连续追问 5 轮" },
  byok_lifetime: { name: "自带模型 API 永久权益", price: "¥1.99", detail: "一次购买永久解锁，模型费用由服务商另行收取" }
};

export default function PaymentEntry({ productId, source }: { productId: ProductId; source: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const started = useRef(false);
  const currentPath = `/pay?product=${encodeURIComponent(productId)}&source=${encodeURIComponent(source)}`;

  useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as Account;
        setAccount(body);
        if (!body.authenticated || started.current) return;
        started.current = true;
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, provider: "wechat" })
        });
        const orderBody = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderBody?.error?.message || "微信支付订单创建失败。");
        window.location.replace(orderBody.checkoutUrl);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "支付入口暂时不可用。"));
  }, [productId]);

  const product = productCopy[productId];
  return <main className="grid min-h-screen place-items-center px-4 py-8">
    <section className="candy-card w-full max-w-lg rounded-[2rem] p-6 text-center sm:p-8">
      <p className="inline-flex items-center gap-2 rounded-full bg-roseSoft px-4 py-2 text-sm font-black text-rose"><QrCode size={17} /> 微信扫码支付</p>
      <h1 className="mt-4 text-3xl font-black text-ink">{product.name}</h1>
      <p className="mt-3 text-4xl font-black text-rose">{product.price}</p>
      <p className="mt-3 leading-7 text-cocoa/65">{product.detail}</p>

      {!account && !error ? <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cocoa/60"><Loader2 className="animate-spin" size={18} /> 正在确认账号...</p> : null}
      {account?.authenticated && !error ? <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cocoa/60"><Loader2 className="animate-spin" size={18} /> 正在生成一次性支付二维码...</p> : null}
      {account && !account.authenticated ? <Link href={`/login?next=${encodeURIComponent(currentPath)}`} className="candy-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black text-white"><LogIn size={18} /> 登录后生成二维码</Link> : null}
      {error ? <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">{error}</p> : null}

      <p className="mt-6 inline-flex items-center gap-2 text-xs font-bold leading-5 text-cocoa/50"><ShieldCheck size={15} /> 权益只在服务端确认支付成功后发放</p>
    </section>
  </main>;
}
