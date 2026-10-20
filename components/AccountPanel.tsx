"use client";

import { ArrowLeft, Clock3, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Account = {
  authenticated: boolean;
  user?: { phone: string };
  entitlements?: Array<{ id: string; kind: string; status: string; turnsRemaining: number | null; expiresAt: string | null }>;
  orders?: Array<{ id: string; productId: string; provider: string; amountFen: number; status: string; createdAt: string }>;
};

export default function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => { fetch("/api/account").then((response) => response.json()).then(setAccount); }, []);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.assign("/"); }

  if (!account) return <main className="grid min-h-screen place-items-center text-cocoa/60">正在读取账号...</main>;
  if (!account.authenticated) return <main className="grid min-h-screen place-items-center px-4"><section className="candy-card max-w-md rounded-2xl p-6 text-center"><h1 className="text-2xl font-black text-ink">登录后查看权益</h1><Link href="/login?next=/account" className="candy-button mt-5 inline-flex rounded-full px-5 py-3 font-black text-white">手机号登录</Link></section></main>;

  const masked = `${account.user?.phone.slice(0, 3)}****${account.user?.phone.slice(-4)}`;
  return <main className="min-h-screen px-4 py-6 sm:py-10"><div className="mx-auto max-w-4xl">
    <div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black text-cocoa shadow-panel"><ArrowLeft size={17} /> 返回首页</Link><button onClick={logout} className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black text-cocoa shadow-panel"><LogOut size={17} /> 退出登录</button></div>
    <header className="py-8"><p className="text-sm font-black text-rose">我的账号</p><h1 className="mt-2 text-4xl font-black text-ink">{masked}</h1><p className="mt-2 text-cocoa/60">购买记录和使用权益保存在服务端。</p></header>
    <section className="grid gap-4 md:grid-cols-2">
      <div className="candy-card rounded-2xl p-5"><h2 className="flex items-center gap-2 text-xl font-black text-ink"><ShieldCheck className="text-leaf" /> 当前权益</h2><div className="mt-4 space-y-3">{account.entitlements?.length ? account.entitlements.map((item) => <div key={item.id} className="rounded-xl bg-white/75 p-3"><p className="font-black text-cocoa">{item.kind === "byok_lifetime" ? "自带模型 API 永久权益" : "平台咨询会话"}</p><p className="mt-1 text-sm text-cocoa/60">状态：{item.status}{item.turnsRemaining !== null ? ` · 剩余 ${item.turnsRemaining} 轮` : ""}</p>{item.expiresAt ? <p className="mt-1 text-xs text-cocoa/50">有效至 {new Date(item.expiresAt).toLocaleString("zh-CN")}</p> : null}</div>) : <p className="text-sm text-cocoa/55">还没有购买权益。</p>}</div></div>
      <div className="candy-card rounded-2xl p-5"><h2 className="flex items-center gap-2 text-xl font-black text-ink"><Clock3 className="text-rose" /> 最近订单</h2><div className="mt-4 space-y-3">{account.orders?.length ? account.orders.slice(0, 6).map((order) => <div key={order.id} className="border-b border-rose/10 pb-3 text-sm"><p className="font-bold text-cocoa">{order.productId === "byok_lifetime" ? "自带 API 永久权益" : "平台咨询会话"} · ¥{(order.amountFen / 100).toFixed(2)}</p><p className="mt-1 text-cocoa/50">{order.provider === "wechat" ? "微信支付" : "支付宝"} · {order.status}</p></div>) : <p className="text-sm text-cocoa/55">暂无订单。</p>}</div></div>
    </section>
  </div></main>;
}
