import { createHash, randomInt, randomUUID } from "node:crypto";
import type { StoredUser } from "./store";
import { readStore, updateStore } from "./store";

export const SESSION_COOKIE = "dogcare_session";
const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export const isMockAuth = () => process.env.AUTH_MODE?.trim() !== "sms" && process.env.NODE_ENV !== "production";

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  const phone = value.replace(/[\s-]/g, "");
  return /^1[3-9]\d{9}$/.test(phone) ? phone : null;
}

export async function requestLoginCode(phone: string) {
  if (!isMockAuth()) throw new Error("真实短信服务尚未配置。请先接入短信供应商再启用登录。");
  const code = String(randomInt(100000, 1000000));
  const now = new Date();
  await updateStore((data) => {
    const recent = data.codes.find((item) => item.phone === phone && now.getTime() - new Date(item.requestedAt).getTime() < 60_000);
    if (recent) throw new Error("验证码发送过于频繁，请一分钟后再试。");
    data.codes = data.codes.filter((item) => item.phone !== phone && new Date(item.expiresAt).getTime() > now.getTime());
    data.codes.push({ phone, codeHash: digest(code), requestedAt: now.toISOString(), expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(), attempts: 0 });
  });
  return code;
}

export async function verifyLoginCode(phone: string, code: string) {
  const token = `${randomUUID()}${randomUUID()}`;
  const now = new Date();
  const verification = await updateStore((data) => {
    const record = data.codes.find((item) => item.phone === phone);
    if (!record || new Date(record.expiresAt).getTime() <= now.getTime()) {
      return { error: "验证码已失效，请重新获取。" } as const;
    }
    record.attempts += 1;
    if (record.attempts > 5) {
      data.codes = data.codes.filter((item) => item.phone !== phone);
      return { error: "验证码尝试次数过多，请重新获取。" } as const;
    }
    if (record.codeHash !== digest(code)) {
      return { error: "验证码不正确。" } as const;
    }
    data.codes = data.codes.filter((item) => item.phone !== phone);
    let existing = data.users.find((item) => item.phone === phone);
    if (!existing) {
      existing = { id: randomUUID(), phone, createdAt: now.toISOString() };
      data.users.push(existing);
    }
    data.sessions.push({ id: randomUUID(), userId: existing.id, tokenHash: digest(token), createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString() });
    return { user: existing } as const;
  });
  if ("error" in verification) throw new Error(verification.error);
  return { token, user: verification.user, expiresAt: new Date(now.getTime() + SESSION_TTL_MS) };
}

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  const part = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

export async function getRequestUser(request: Request): Promise<StoredUser | null> {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const now = Date.now();
  const data = await readStore();
  const session = data.sessions.find((item) => item.tokenHash === digest(token) && new Date(item.expiresAt).getTime() > now);
  return session ? data.users.find((item) => item.id === session.userId) ?? null : null;
}

export async function revokeRequestSession(request: Request) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return;
  await updateStore((data) => {
    data.sessions = data.sessions.filter((item) => item.tokenHash !== digest(token));
  });
}
