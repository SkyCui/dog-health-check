import rules from "@/knowledge/rules/assessment-rules.json";
import type { AssessmentInput, DistressSignal, RecentSignal, SafetyBoundaryResult } from "./types";

const signalLabels = rules.safety.signalLabels as Record<string, string>;

export function checkSafetyBoundary(input: AssessmentInput): SafetyBoundaryResult {
  const redRecent = new Set(rules.safety.redVetRecentSignals as RecentSignal[]);
  const redMental = new Set(rules.safety.redVetMentalSignals as DistressSignal[]);
  const behavior = new Set(rules.safety.behaviorSupportSignals as DistressSignal[]);
  const recentMatches = input.recentSignals.filter((item) => redRecent.has(item));
  const mentalVetMatches = input.mentalState.distressSignals.filter((item) => redMental.has(item));
  if (recentMatches.length || mentalVetMatches.length) {
    return { statusOverride: "red_vet", supportRoute: "vet", reason: [...recentMatches, ...mentalVetMatches].map((item) => signalLabels[item]).join("、"), reminder: rules.safety.vetMessage };
  }
  const behaviorMatches = input.mentalState.distressSignals.filter((item) => behavior.has(item));
  if (behaviorMatches.length) {
    return { statusOverride: "behavior_support", supportRoute: "veterinary_behavior", reason: behaviorMatches.map((item) => signalLabels[item]).join("、"), reminder: rules.safety.behaviorMessage };
  }
  return { statusOverride: null, supportRoute: "none", reason: "", reminder: rules.safety.safeMessage };
}
