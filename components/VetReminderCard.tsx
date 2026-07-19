import { Stethoscope } from "lucide-react";

type VetReminderCardProps = {
  reminder: string;
  urgent?: boolean;
  title?: string;
};

export default function VetReminderCard({ reminder, urgent = false, title = "专业支持提醒" }: VetReminderCardProps) {
  return (
    <section className={`rounded-lg border p-5 ${urgent ? "border-coral/30 bg-red-50" : "border-sky-200 bg-skySoft"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white ${urgent ? "text-coral" : "text-blue-700"}`}>
          <Stethoscope size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-2 leading-7 text-slate-700">{reminder}</p>
        </div>
      </div>
    </section>
  );
}
