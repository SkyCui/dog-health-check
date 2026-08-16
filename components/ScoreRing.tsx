type ScoreRingProps = {
  score: number | null;
};

function getRingColor(score: number | null) {
  if (score === null) return "#94a3b8";
  if (score >= 85) return "#c94f82";
  if (score >= 70) return "#d6a026";
  if (score >= 55) return "#d96b5f";
  return "#b94a48";
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const color = getRingColor(score);
  const progress = score ?? 0;

  return (
    <div
      className="grid aspect-square w-40 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${progress * 3.6}deg, #f8dce8 0deg)` }}
      aria-label={score === null ? "信息不足，未生成狗狗幸福指数" : `狗狗幸福指数 ${score} 分`}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-4xl font-bold text-ink">{score ?? "--"}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">{score === null ? "信息不足" : "/ 100"}</div>
        </div>
      </div>
    </div>
  );
}
