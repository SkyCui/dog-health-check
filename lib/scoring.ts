import dimensionRules from "@/rules/dimension-score-rules.json";
import scoringRules from "@/rules/scoring-rules.json";
import type {
  AssessmentInput,
  DailyMinutes,
  DimensionKey,
  DimensionScores,
  FoodType,
  HomeEnvironment,
  OutdoorFrequency,
  SniffingLevel,
  StatusKey
} from "./types";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreDiet(input: AssessmentInput) {
  const rules = dimensionRules.diet;
  const foodAdjustments = rules.foodTypeAdjustments as Record<FoodType, number>;
  const snackAdjustments = rules.snackAdjustments as Record<string, number>;
  const uniqueFoodTypes: FoodType[] = input.foodTypes.length > 0 ? input.foodTypes : ["kibble"];
  const foodTotal = uniqueFoodTypes.reduce((sum, type) => sum + (foodAdjustments[type] ?? 0), 0);
  const varietyBonus = uniqueFoodTypes.length >= 2 ? 5 : 0;
  const homemadePenalty =
    uniqueFoodTypes.includes("homemade") && !uniqueFoodTypes.includes("mixed")
      ? rules.homemadeWithoutMixedPenalty
      : 0;

  return clampScore(
    rules.base + foodTotal / uniqueFoodTypes.length + varietyBonus + snackAdjustments[input.snackLevel] + homemadePenalty
  );
}

function scoreMovement(input: AssessmentInput) {
  const rules = dimensionRules.movement;
  const frequencyScores = rules.outdoorFrequency as Record<OutdoorFrequency, number>;
  const minuteScores = rules.dailyMinutes as Record<DailyMinutes, number>;
  const sniffingScores = rules.sniffing as Record<SniffingLevel, number>;

  return clampScore(
    frequencyScores[input.movement.outdoorFrequency] * 0.4 +
      minuteScores[input.movement.dailyMinutes] * 0.3 +
      sniffingScores[input.movement.sniffing] * 0.3
  );
}

function scoreRecent(input: AssessmentInput) {
  const rules = dimensionRules.recent;
  if (input.recentSignals.includes("normal") && input.recentSignals.length === 1) {
    return rules.normal;
  }

  const deductions = rules.signalDeductions as Record<string, number>;
  const totalDeduction = input.recentSignals.reduce((sum, signal) => sum + (deductions[signal] ?? 0), 0);
  return clampScore(rules.base - totalDeduction);
}

function scoreEnvironment(input: AssessmentInput) {
  const rules = dimensionRules.environment;
  if (input.homeEnvironment.includes("none") && input.homeEnvironment.length === 1) {
    return rules.none;
  }

  if (input.homeEnvironment.includes("unknown") && input.homeEnvironment.length === 1) {
    return rules.unknown;
  }

  const deductions = rules.exposureDeductions as Record<HomeEnvironment, number>;
  const totalDeduction = input.homeEnvironment.reduce(
    (sum, exposure) => sum + (deductions[exposure] ?? 0),
    0
  );
  return clampScore(rules.base - totalDeduction);
}

export function getDimensionScores(input: AssessmentInput): DimensionScores {
  return {
    body: clampScore(dimensionRules.body[input.bodyCondition]),
    diet: scoreDiet(input),
    movement: scoreMovement(input),
    recent: scoreRecent(input),
    environment: scoreEnvironment(input)
  };
}

export function getLongevityScore(dimensionScores: DimensionScores) {
  const weights = dimensionRules.weights as Record<DimensionKey, number>;
  const weightedScore = (Object.keys(dimensionScores) as DimensionKey[]).reduce(
    (sum, key) => sum + dimensionScores[key] * weights[key],
    0
  );

  return clampScore(weightedScore);
}

export function getStatus(score: number, vetBoundaryTriggered: boolean): StatusKey {
  if (vetBoundaryTriggered) {
    return "red_vet";
  }

  const matchedRange = scoringRules.statusRanges.find(
    (range) => score >= range.min && score <= range.max
  );

  return (matchedRange?.status ?? "watch") as StatusKey;
}

export function getStatusText(status: StatusKey) {
  if (status === "red_vet") {
    return "建议优先确认健康风险";
  }

  const range = scoringRules.statusRanges.find((item) => item.status === status);
  return range?.label ?? "有一项值得关注";
}
