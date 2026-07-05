type ScoreRingProps = {
  score: number;
};

function getRingColor(score: number) {
  if (score >= 85) return "#2f7d5c";
  if (score >= 70) return "#d6a026";
  if (score >= 55) return "#d96b5f";
  return "#b94a48";
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const color = getRingColor(score);

  return (
    <div
      className="grid aspect-square w-40 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #e7ece7 0deg)` }}
      aria-label={`狗狗长寿习惯指数 ${score} 分`}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
        <div>
          <div className="text-4xl font-bold text-ink">{score}</div>
          <div className="mt-1 text-xs font-medium text-slate-500">/ 100</div>
        </div>
      </div>
    </div>
  );
}
