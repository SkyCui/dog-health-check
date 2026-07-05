import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export default function DashboardCard({ title, eyebrow, children, className = "" }: DashboardCardProps) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-panel ${className}`}>
      {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase text-leaf">{eyebrow}</p> : null}
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
