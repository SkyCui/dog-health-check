import { NextResponse } from "next/server";
import { parseAssessmentInput, isRecord } from "@/lib/assessmentProtocol";
import { generateConsultation } from "@/lib/consultation";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON body.", details: ["Request body must be valid JSON."] } }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return NextResponse.json({ error: { message: "Invalid consultation request.", details: ["Request body must be a JSON object."] } }, { status: 400 });
  }
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const { input, errors } = parseAssessmentInput(payload.assessment);
  if (!message) errors.push("message is required and cannot be empty.");
  if (message.length > 1000) errors.push("message must be 1000 characters or fewer.");
  if (!input || errors.length) {
    return NextResponse.json({ error: { message: "Invalid consultation request.", details: errors } }, { status: 400 });
  }
  return NextResponse.json(generateConsultation(input, message));
}
