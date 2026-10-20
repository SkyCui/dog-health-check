import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: { message: "请在 /consult 免费配置自己的模型。平台模型服务待更新。" } }, { status: 410 });
}
