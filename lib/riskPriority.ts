import content from "@/knowledge/rules/content-rules.json";
import rules from "@/knowledge/rules/assessment-rules.json";
import type { AssessmentInput, HealthDimensionKey, HealthDimensionScores, MentalDimensionKey, MentalDimensionScores, SafetyBoundaryResult } from "./types";

const reasons = content.riskReasons as Record<string, string>;
type Domain = "health" | "mental";
type Condition = { field: string; operator: "in" | "includes"; values: string[] };
type CandidateRule = {
  title: string;
  domain: Domain;
  dimension: HealthDimensionKey | MentalDimensionKey;
  priority: number;
  when?: Condition;
  whenAny?: Condition[];
  whenScoreBelow?: number;
};

function readField(input: AssessmentInput, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) =>
    value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, input);
}

function matches(input: AssessmentInput, condition: Condition) {
  const value = readField(input, condition.field);
  if (condition.operator === "includes") {
    return Array.isArray(value) && condition.values.some((item) => value.includes(item));
  }
  return typeof value === "string" && condition.values.includes(value);
}

export function getCoreRisk(input: AssessmentInput, health: HealthDimensionScores, mental: MentalDimensionScores, safety: SafetyBoundaryResult, insufficient = false) {
  if (safety.statusOverride === "red_vet") return { title: "需要咨询兽医的异常信号", reason: `你选择了 ${safety.reason}。${reasons["需要咨询兽医的异常信号"]}`, domain: "safety" as const };
  if (safety.statusOverride === "behavior_support") return { title: "需要行为专业支持", reason: `你选择了 ${safety.reason}。${reasons["需要行为专业支持"]}`, domain: "safety" as const };
  if (insufficient) return { title: "信息不足", reason: reasons["信息不足"], domain: "information" as const };

  const candidates = (rules.riskPriority.candidates as CandidateRule[]).flatMap((rule) => {
    const score = rule.domain === "health"
      ? health[rule.dimension as HealthDimensionKey]
      : mental[rule.dimension as MentalDimensionKey];
    if (score === null) return [];
    const selected = rule.whenScoreBelow !== undefined
      ? score < rule.whenScoreBelow
      : rule.whenAny
        ? rule.whenAny.some((condition) => matches(input, condition))
        : Boolean(rule.when && matches(input, rule.when));
    return selected ? [{ title: rule.title, score, domain: rule.domain, priority: rule.priority }] : [];
  });

  candidates.sort((a, b) => a.score - b.score || a.priority - b.priority);
  const selected = candidates[0];
  const fallback = rules.riskPriority.fallbackTitle;
  if (!selected || selected.score >= rules.riskPriority.ignoreAtOrAbove) {
    return { title: fallback, reason: reasons[fallback], domain: "health" as const };
  }
  return { title: selected.title, reason: reasons[selected.title], domain: selected.domain };
}
