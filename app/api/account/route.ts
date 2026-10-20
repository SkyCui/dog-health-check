import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ error: { message: "当前免费 BYOK 版本无需账号或付费，请访问 /consult。" } }, { status: 410 });
}
