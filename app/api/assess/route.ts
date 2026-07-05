import { NextResponse } from "next/server";
import { generateResult } from "@/lib/generateResult";
import type {
  AssessmentInput,
  BodyCondition,
  DailyMinutes,
  FoodType,
  HomeEnvironment,
  OutdoorFrequency,
  RecentSignal,
  Size,
  SnackLevel,
  SniffingLevel
} from "@/lib/types";

const sizes = ["small", "medium", "large", "unknown"] as const;
const bodyConditions = ["thin", "ideal", "slightly_fat", "obese", "unknown"] as const;
const foodTypes = ["kibble", "canned", "freeze_dried", "fresh", "homemade", "mixed"] as const;
const snackLevels = ["low", "medium", "high"] as const;
const outdoorFrequencies = ["rare", "once_toilet_only", "one_to_two", "two_to_three", "two_plus"] as const;
const dailyMinutes = ["unknown", "under_10", "10_20", "around_30", "over_30"] as const;
const sniffingLevels = ["none", "little", "normal", "rich", "unknown"] as const;
const recentSignals = [
  "normal",
  "unstable_poop",
  "bad_breath",
  "paw_licking_or_scratching",
  "low_energy",
  "appetite_change",
  "vomiting",
  "diarrhea",
  "pain",
  "mobility_issue"
] as const;
const homeEnvironments = [
  "aromatherapy",
  "strong_cleaner",
  "secondhand_smoke",
  "plastic_bowl",
  "pesticide",
  "none",
  "unknown"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEnumValue<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

function isEnumArray<T extends readonly string[]>(value: unknown, options: T) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isEnumValue(item, options)) &&
    new Set(value).size === value.length
  );
}

function getStringField(payload: Record<string, unknown>, field: string, errors: string[], required = true) {
  const value = payload[field];

  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${field} is required.`);
    }
    return "";
  }

  if (typeof value !== "string") {
    errors.push(`${field} must be a string.`);
    return "";
  }

  const trimmedValue = value.trim();
  if (required && !trimmedValue) {
    errors.push(`${field} cannot be empty.`);
  }

  return trimmedValue;
}

function parseMovement(payload: Record<string, unknown>, errors: string[]) {
  if (!isRecord(payload.movement)) {
    errors.push("movement is required and must be an object.");
    return null;
  }

  const movement = payload.movement;

  if (!isEnumValue(movement.outdoorFrequency, outdoorFrequencies)) {
    errors.push("movement.outdoorFrequency is invalid.");
  }

  if (!isEnumValue(movement.dailyMinutes, dailyMinutes)) {
    errors.push("movement.dailyMinutes is invalid.");
  }

  if (!isEnumValue(movement.sniffing, sniffingLevels)) {
    errors.push("movement.sniffing is invalid.");
  }

  if (errors.length > 0) {
    return null;
  }

  return {
    outdoorFrequency: movement.outdoorFrequency as OutdoorFrequency,
    dailyMinutes: movement.dailyMinutes as DailyMinutes,
    sniffing: movement.sniffing as SniffingLevel
  };
}

function parseAssessmentInput(payload: unknown) {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    return { errors: ["Request body must be a JSON object."] };
  }

  const dogName = getStringField(payload, "dogName", errors, false);
  const age = getStringField(payload, "age", errors);
  const breed = getStringField(payload, "breed", errors);
  const weight = getStringField(payload, "weight", errors, false);

  if (!isEnumValue(payload.size, sizes)) {
    errors.push("size is invalid.");
  }

  if (!isEnumValue(payload.bodyCondition, bodyConditions)) {
    errors.push("bodyCondition is invalid.");
  }

  if (!isEnumArray(payload.foodTypes, foodTypes)) {
    errors.push("foodTypes must be a non-empty array of unique valid values.");
  }

  if (!isEnumValue(payload.snackLevel, snackLevels)) {
    errors.push("snackLevel is invalid.");
  }

  const movement = parseMovement(payload, errors);

  if (!isEnumArray(payload.recentSignals, recentSignals)) {
    errors.push("recentSignals must be a non-empty array of unique valid values.");
  }

  if (!isEnumArray(payload.homeEnvironment, homeEnvironments)) {
    errors.push("homeEnvironment must be a non-empty array of unique valid values.");
  }

  const submittedRecentSignals = payload.recentSignals as RecentSignal[] | undefined;
  if (submittedRecentSignals?.includes("normal") && submittedRecentSignals.length > 1) {
    errors.push("recentSignals cannot combine normal with other signals.");
  }

  const submittedHomeEnvironment = payload.homeEnvironment as HomeEnvironment[] | undefined;
  if (submittedHomeEnvironment?.includes("none") && submittedHomeEnvironment.length > 1) {
    errors.push("homeEnvironment cannot combine none with other values.");
  }

  if (submittedHomeEnvironment?.includes("unknown") && submittedHomeEnvironment.length > 1) {
    errors.push("homeEnvironment cannot combine unknown with other values.");
  }

  if (!movement || errors.length > 0) {
    return { errors };
  }

  const input: AssessmentInput = {
    dogName,
    age,
    breed,
    weight,
    size: payload.size as Size,
    bodyCondition: payload.bodyCondition as BodyCondition,
    foodTypes: payload.foodTypes as FoodType[],
    snackLevel: payload.snackLevel as SnackLevel,
    movement,
    recentSignals: payload.recentSignals as RecentSignal[],
    homeEnvironment: payload.homeEnvironment as HomeEnvironment[]
  };

  return { input, errors };
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON body.", details: ["Request body must be valid JSON."] } },
      { status: 400 }
    );
  }

  const { input, errors } = parseAssessmentInput(payload);

  if (!input || errors.length > 0) {
    return NextResponse.json(
      { error: { message: "Invalid assessment request.", details: errors } },
      { status: 400 }
    );
  }

  return NextResponse.json(generateResult(input));
}
