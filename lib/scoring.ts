import rules from "@/knowledge/rules/assessment-rules.json";
import content from "@/knowledge/rules/content-rules.json";
import type {
  AssessmentInput, DailyMinutes, DistressSignal, HealthDimensionKey, HealthDimensionScores,
  HomeEnvironment, MentalDimensionKey, MentalDimensionScores, OutdoorFrequency, SniffingLevel,
  StatusKey
} from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
type NullableScores<T extends string> = Record<T, number | null>;

function weightedKnownScore<T extends string>(scores: NullableScores<T>, weights: Record<T, number>) {
  const known = (Object.keys(scores) as T[]).filter((key) => scores[key] !== null);
  const knownWeight = known.reduce((sum, key) => sum + weights[key], 0);
  if (!knownWeight) return null;
  return clamp(known.reduce((sum, key) => sum + (scores[key] as number) * weights[key], 0) / knownWeight);
}

export function getHealthDimensionScores(input: AssessmentInput): HealthDimensionScores {
  const health = rules.health;
  const foodAdjustments = health.diet.foodTypeAdjustments as Record<string, number>;
  const foodTypes = input.foodTypes.length ? input.foodTypes : ["kibble" as const];
  const foodAverage = foodTypes.reduce((sum, item) => sum + (foodAdjustments[item] ?? 0), 0) / foodTypes.length;
  const diet = health.diet.base + foodAverage + (foodTypes.length >= 2 ? 5 : 0)
    + health.diet.snackAdjustments[input.snackLevel]
    + (foodTypes.includes("homemade") && !foodTypes.includes("mixed") ? health.diet.homemadeWithoutMixedPenalty : 0);
  const movement = weightedKnownScore({
    outdoorFrequency: health.movement.outdoorFrequency[input.movement.outdoorFrequency as OutdoorFrequency],
    dailyMinutes: health.movement.dailyMinutes[input.movement.dailyMinutes as DailyMinutes],
    sniffing: health.movement.sniffing[input.movement.sniffing as SniffingLevel]
  }, health.movement.weights);
  const recent = input.recentSignals.length === 1 && input.recentSignals[0] === "normal"
    ? health.recent.normal
    : health.recent.base - input.recentSignals.reduce((sum, item) => sum + ((health.recent.signalDeductions as Record<string, number>)[item] ?? 0), 0);
  const environment = input.homeEnvironment.length === 1 && input.homeEnvironment[0] === "none"
    ? health.environment.none
    : input.homeEnvironment.length === 1 && input.homeEnvironment[0] === "unknown"
      ? null
      : health.environment.base - input.homeEnvironment.reduce((sum, item) => sum + ((health.environment.exposureDeductions as Record<HomeEnvironment, number>)[item] ?? 0), 0);
  const body = health.body[input.bodyCondition];
  return {
    body: body === null ? null : clamp(body),
    diet: clamp(diet),
    movement,
    recent: clamp(recent),
    environment: environment === null ? null : clamp(environment)
  };
}

export function getMentalDimensionScores(input: AssessmentInput): MentalDimensionScores {
  const mental = rules.mental;
  const signals = input.mentalState.distressSignals;
  const distress = signals.length === 1 && signals[0] === "none" ? mental.distress.none
    : signals.length === 1 && signals[0] === "unknown" ? null
      : mental.distress.base - signals.reduce((sum, item) => sum + ((mental.distress.deductions as Record<DistressSignal, number>)[item] ?? 0), 0);
  return {
    positiveEngagement: mental.positiveEngagement[input.mentalState.positiveEngagement],
    relaxation: mental.relaxation[input.mentalState.relaxation],
    socialConnection: mental.socialConnection[input.mentalState.socialConnection],
    distress: distress === null ? null : clamp(distress)
  };
}

export const getHealthScore = (scores: HealthDimensionScores) => weightedKnownScore(scores, rules.health.weights as Record<HealthDimensionKey, number>);
export const getMentalWellbeingScore = (scores: MentalDimensionScores) => weightedKnownScore(scores, rules.mental.weights as Record<MentalDimensionKey, number>);

export function getAssessmentCoverage(input: AssessmentInput) {
  const movementWeights = rules.health.movement.weights;
  const movementCoverage = movementWeights.outdoorFrequency
    + (input.movement.dailyMinutes === "unknown" ? 0 : movementWeights.dailyMinutes)
    + (input.movement.sniffing === "unknown" ? 0 : movementWeights.sniffing);
  const healthCoverage =
    (input.bodyCondition === "unknown" ? 0 : rules.health.weights.body)
    + rules.health.weights.diet
    + rules.health.weights.movement * movementCoverage
    + rules.health.weights.recent
    + (input.homeEnvironment.length === 1 && input.homeEnvironment[0] === "unknown" ? 0 : rules.health.weights.environment);
  const mentalCoverage =
    (input.mentalState.positiveEngagement === "unknown" ? 0 : rules.mental.weights.positiveEngagement)
    + (input.mentalState.relaxation === "unknown" ? 0 : rules.mental.weights.relaxation)
    + (input.mentalState.socialConnection === "unknown" ? 0 : rules.mental.weights.socialConnection)
    + (input.mentalState.distressSignals.length === 1 && input.mentalState.distressSignals[0] === "unknown" ? 0 : rules.mental.weights.distress);
  return Math.round((healthCoverage * rules.happiness.healthWeight + mentalCoverage * rules.happiness.mentalWeight) * 100) / 100;
}

export function getAssessmentConfidence(coverage: number) {
  if (coverage >= rules.confidence.highMin) return "high" as const;
  if (coverage >= rules.confidence.mediumMin) return "medium" as const;
  return "insufficient" as const;
}

export function getHappinessScore(healthScore: number | null, mentalScore: number | null, coverage: number) {
  if (coverage < rules.confidence.insufficientBelow || healthScore === null || mentalScore === null) return null;
  return clamp(healthScore * rules.happiness.healthWeight + mentalScore * rules.happiness.mentalWeight);
}

export function getStatus(score: number | null, override: "red_vet" | "behavior_support" | null): StatusKey {
  if (override) return override;
  if (score === null) return "insufficient";
  return (rules.happiness.statusRanges.find((range) => score >= range.min && score <= range.max)?.status ?? "watch") as StatusKey;
}

export function getStatusText(status: StatusKey) {
  if (status === "red_vet" || status === "behavior_support" || status === "insufficient") return content.statusOverrides[status];
  return rules.happiness.statusRanges.find((item) => item.status === status)?.label ?? "有一项影响幸福感的因素值得关注";
}
