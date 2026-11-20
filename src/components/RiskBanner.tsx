import { AlertTriangle, CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RiskLevel } from "@/lib/types";

const STYLES = {
  malicious: { box: "bg-red-500/10 border-red-500 text-red-500", Icon: ShieldAlert, label: "Malicioso" },
  suspicious: { box: "bg-yellow-500/10 border-yellow-500 text-yellow-500", Icon: AlertTriangle, label: "Sospechoso" },
  safe: { box: "bg-emerald-500/10 border-emerald-500 text-emerald-500", Icon: ShieldCheck, label: "Seguro" },
  error: { box: "bg-gray-500/10 border-gray-500 text-gray-400", Icon: CircleHelp, label: "Sin veredicto" },
} as const;

const PILLS = {
  malicious: "border-red-500/50 bg-red-500/15 text-red-500",
  suspicious: "border-yellow-500/50 bg-yellow-500/15 text-yellow-500",
  safe: "border-emerald-500/50 bg-emerald-500/15 text-emerald-500",
  error: "border-gray-500/50 bg-gray-500/15 text-gray-400",
} as const;

export function RiskBanner({
  risk, title, subtitle, big, small,
}: { risk: RiskLevel; title: string; subtitle: string; big: string; small: string }) {
  const { box, Icon } = STYLES[risk] ?? STYLES.suspicious;
  return (
    <section aria-live="polite" className={`flex flex-col gap-4 rounded-lg border p-6 sm:h-24 sm:flex-row sm:items-center sm:py-0 ${box}`}>
      <Icon size={40} strokeWidth={1.75} className="shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 sm:-mt-1">
        <h2 className="text-[22px] font-semibold leading-7">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-fg">{subtitle}</p>
      </div>
      <div className="sm:text-right">
        <p className="font-mono text-[32px] font-semibold leading-8">{big}</p>
        <p className="mt-1 text-xs leading-4 text-muted">{small}</p>
      </div>
    </section>
  );
}

export function RiskPill({ risk }: { risk: RiskLevel }) {
  const s = STYLES[risk] ?? STYLES.suspicious;
  return (
    <span className={`inline-flex h-6 items-center rounded-full border px-4 text-xs font-medium ${PILLS[risk] ?? PILLS.suspicious}`}>
      {s.label}
    </span>
  );
}
