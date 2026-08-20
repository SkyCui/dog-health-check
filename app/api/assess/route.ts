import { NextResponse } from "next/server";
import { parseAssessmentInput } from "@/lib/assessmentProtocol";
import { generateResult } from "@/lib/generateResult";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON body.", details: ["Request body must be valid JSON."] } }, { status: 400 });
  }

  const { input, errors } = parseAssessmentInput(payload);
  if (!input || errors.length > 0) {
    return NextResponse.json({ error: { message: "Invalid assessment request.", details: errors } }, { status: 400 });
  }
  return NextResponse.json(generateResult(input));
}
