import vetBoundaryRules from "@/rules/vet-boundary-rules.json";
import type { AssessmentInput, RecentSignal, VetBoundaryResult } from "./types";

const redVetSignals = new Set<RecentSignal>(vetBoundaryRules.redVetSignals as RecentSignal[]);

const signalLabels: Record<RecentSignal, string> = {
  normal: "最近都正常",
  unstable_poop: "便便不稳定",
  bad_breath: "口臭",
  paw_licking_or_scratching: "舔爪 / 抓痒",
  low_energy: "精神明显变差",
  appetite_change: "食欲明显变化",
  vomiting: "呕吐",
  diarrhea: "腹泻",
  pain: "明显疼痛",
  mobility_issue: "行动异常"
};

export function checkVetBoundary(input: AssessmentInput): VetBoundaryResult {
  const triggeredSignals = input.recentSignals.filter((signal) => redVetSignals.has(signal));

  if (triggeredSignals.length > 0) {
    return {
      triggered: true,
      reason: triggeredSignals.map((signal) => signalLabels[signal]).join("、"),
      reminder: vetBoundaryRules.message
    };
  }

  const hasMildSignal = input.recentSignals.some((signal) =>
    ["unstable_poop", "bad_breath", "paw_licking_or_scratching"].includes(signal)
  );

  return {
    triggered: false,
    reason: "",
    reminder: hasMildSignal ? vetBoundaryRules.observeMessage : vetBoundaryRules.safeMessage
  };
}
