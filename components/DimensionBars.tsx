import type { HealthDimensionKey, HealthDimensionScores } from "@/lib/types";

const dimensionLabels: Record<HealthDimensionKey, string> = {
  body: "体况",
  diet: "饮食",
  movement: "运动嗅闻",
  recent: "近期状态",
  environment: "家庭环境"
};

function getBarColor(score: number) {
  if (score >= 85) return "bg-[#c94f82]";
  if (score >= 70) return "bg-amber-500";
  if (score >= 55) return "bg-coral";
  return "bg-red-700";
}

export default function DimensionBars({ scores }: { scores: HealthDimensionScores }) {
  return (
    <div className="space-y-4">
      {(Object.keys(dimensionLabels) as HealthDimensionKey[]).map((key) => {
        const score = scores[key];
        return (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-ink">{dimensionLabels[key]}</span>
              <span className="tabular-nums text-slate-600">{score} / 100</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${getBarColor(score)}`} style={{ width: `${score}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
