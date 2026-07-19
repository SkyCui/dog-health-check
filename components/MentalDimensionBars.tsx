import type { MentalDimensionKey, MentalDimensionScores } from "@/lib/types";

const labels: Record<MentalDimensionKey, string> = {
  positiveEngagement: "积极参与",
  relaxation: "放松恢复",
  socialConnection: "社交安全",
  distress: "压力信号"
};

export default function MentalDimensionBars({ scores }: { scores: MentalDimensionScores }) {
  return (
    <div className="space-y-4">
      {(Object.keys(labels) as MentalDimensionKey[]).map((key) => (
        <div key={key}>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink">{labels[key]}</span>
            <span className="tabular-nums text-slate-600">{scores[key]} / 100</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#c94f82]" style={{ width: `${scores[key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
