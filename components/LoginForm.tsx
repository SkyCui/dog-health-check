"use client";

import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/request-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "验证码发送失败。");
      setSent(true);
      if (body.debugCode) {
        setDebugCode(body.debugCode);
        setCode(body.debugCode);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "验证码发送失败。");
    } finally {
      setBusy(false);
    }
  }

  async function login() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "登录失败。");
      window.location.assign(nextPath);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:py-12">
      <div className="mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-black text-cocoa shadow-panel"><ArrowLeft size={17} /> 返回首页</Link>
        <section className="candy-card mt-5 rounded-[2rem] p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-sm font-black text-rose"><ShieldCheck size={18} /> 账号与权益</p>
          <h1 className="mt-3 text-3xl font-black text-ink">登录后，购买不会丢</h1>
          <p className="mt-3 text-sm leading-6 text-cocoa/65">权益保存在服务端账号中。退出、换设备或清理浏览器后，重新登录即可恢复。</p>

          <label className="mt-6 block text-sm font-bold text-cocoa">手机号</label>
          <div className="mt-2 flex gap-2">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" maxLength={11} placeholder="请输入手机号" className="min-w-0 flex-1 rounded-2xl border border-rose/20 bg-white px-4 py-3 outline-none focus:border-rose" />
            <button type="button" onClick={requestCode} disabled={busy || !/^1[3-9]\d{9}$/.test(phone)} className="rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white disabled:opacity-40">获取验证码</button>
          </div>

          {sent ? <><label className="mt-4 block text-sm font-bold text-cocoa">验证码</label><input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" maxLength={6} placeholder="6 位验证码" className="mt-2 w-full rounded-2xl border border-rose/20 bg-white px-4 py-3 outline-none focus:border-rose" /></> : null}
          {debugCode ? <p className="mt-3 rounded-xl bg-goldSoft px-3 py-2 text-sm font-bold text-cocoa">本地开发验证码：{debugCode}，不会发送短信。</p> : null}
          {error ? <p role="alert" className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}

          <button type="button" onClick={login} disabled={busy || !sent || !/^\d{6}$/.test(code)} className="candy-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black text-white disabled:opacity-40">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} 登录 / 自动注册
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-cocoa/50">首次验证手机号会自动创建账号。正式上线前将接入真实短信服务、隐私政策与注销流程。</p>
        </section>
      </div>
    </main>
  );
}
