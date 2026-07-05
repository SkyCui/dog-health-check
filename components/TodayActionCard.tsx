import { Sparkles } from "lucide-react";

type TodayActionCardProps = {
  title: string;
  body: string;
};

export default function TodayActionCard({ title, body }: TodayActionCardProps) {
  return (
    <section className="rounded-lg border border-leaf/20 bg-mint p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-leaf">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-2 leading-7 text-slate-700">{body}</p>
        </div>
      </div>
    </section>
  );
}
