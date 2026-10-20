import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: { message: "平台付费服务待更新。请免费接入自己的模型，或私信/进入群聊回复「需要Token」。" } }, { status: 410 });
}
