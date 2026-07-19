import rules from "@/knowledge/rules/assessment-rules.json";
import content from "@/knowledge/rules/content-rules.json";
import type {
  AssessmentInput, DailyMinutes, DistressSignal, HealthDimensionKey, HealthDimensionScores,
  HomeEnvironment, MentalDimensionKey, MentalDimensionScores, OutdoorFrequency, SniffingLevel,
  StatusKey
} from "./types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function getHealthDimensionScores(input: AssessmentInput): HealthDimensionScores {
  const health = rules.health;
  const foodAdjustments = health.diet.foodTypeAdjustments as Record<string, number>;
  const foodTypes = input.foodTypes.length ? input.foodTypes : ["kibble" as const];
  const foodAverage = foodTypes.reduce((sum, item) => sum + (foodAdjustments[item] ?? 0), 0) / foodTypes.length;
  const diet = health.diet.base + foodAverage + (foodTypes.length >= 2 ? 5 : 0)
    + health.diet.snackAdjustments[input.snackLevel]
    + (foodTypes.includes("homemade") && !foodTypes.includes("mixed") ? health.diet.homemadeWithoutMixedPenalty : 0);
  const movement = health.movement.outdoorFrequency[input.movement.outdoorFrequency as OutdoorFrequency]
    * 0.4 + health.movement.dailyMinutes[input.movement.dailyMinutes as DailyMinutes] * 0.3
    + health.movement.sniffing[input.movement.sniffing as SniffingLevel] * 0.3;
  const recent = input.recentSignals.length === 1 && input.recentSignals[0] === "normal"
    ? health.recent.normal
    : health.recent.base - input.recentSignals.reduce((sum, item) => sum + ((health.recent.signalDeductions as Record<string, number>)[item] ?? 0), 0);
  const environment = input.homeEnvironment.length === 1 && input.homeEnvironment[0] === "none"
    ? health.environment.none
    : input.homeEnvironment.length === 1 && input.homeEnvironment[0] === "unknown"
      ? health.environment.unknown
      : health.environment.base - input.homeEnvironment.reduce((sum, item) => sum + ((health.environment.exposureDeductions as Record<HomeEnvironment, number>)[item] ?? 0), 0);
  return { body: clamp(health.body[input.bodyCondition]), diet: clamp(diet), movement: clamp(movement), recent: clamp(recent), environment: clamp(environment) };
}

export function getMentalDimensionScores(input: AssessmentInput): MentalDimensionScores {
  const mental = rules.mental;
  const signals = input.mentalState.distressSignals;
  const distress = signals.length === 1 && signals[0] === "none" ? mental.distress.none
    : signals.length === 1 && signals[0] === "unknown" ? mental.distress.unknown
      : mental.distress.base - signals.reduce((sum, item) => sum + ((mental.distress.deductions as Record<DistressSignal, number>)[item] ?? 0), 0);
  return {
    positiveEngagement: clamp(mental.positiveEngagement[input.mentalState.positiveEngagement]),
    relaxation: clamp(mental.relaxation[input.mentalState.relaxation]),
    socialConnection: clamp(mental.socialConnection[input.mentalState.socialConnection]),
    distress: clamp(distress)
  };
}

function weightedScore<T extends string>(scores: Record<T, number>, weights: Record<T, number>) {
  return clamp((Object.keys(scores) as T[]).reduce((sum, key) => sum + scores[key] * weights[key], 0));
}

export const getHealthScore = (scores: HealthDimensionScores) => weightedScore(scores, rules.health.weights as Record<HealthDimensionKey, number>);
export const getMentalWellbeingScore = (scores: MentalDimensionScores) => weightedScore(scores, rules.mental.weights as Record<MentalDimensionKey, number>);
export const getHappinessScore = (healthScore: number, mentalScore: number) => clamp(healthScore * rules.happiness.healthWeight + mentalScore * rules.happiness.mentalWeight);

export function getStatus(score: number, override: "red_vet" | "behavior_support" | null): StatusKey {
  if (override) return override;
  return (rules.happiness.statusRanges.find((range) => score >= range.min && score <= range.max)?.status ?? "watch") as StatusKey;
}

export function getStatusText(status: StatusKey) {
  if (status === "red_vet" || status === "behavior_support") return content.statusOverrides[status];
  return rules.happiness.statusRanges.find((item) => item.status === status)?.label ?? "有一项影响幸福感的因素值得关注";
}
