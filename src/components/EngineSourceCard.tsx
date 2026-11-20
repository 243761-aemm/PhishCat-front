import { AlertTriangle, CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";

export type Tone = "malicious" | "suspicious" | "safe" | "neutral";

const TONES = {
  malicious: { box: "border-red-500/50 bg-red-500/10 text-red-500", pill: "border-red-500/50 bg-red-500/15 text-red-500", Icon: ShieldAlert, label: "Malicioso" },
  suspicious: { box: "border-yellow-500/50 bg-yellow-500/10 text-yellow-500", pill: "border-yellow-500/50 bg-yellow-500/15 text-yellow-500", Icon: AlertTriangle, label: "Sospechoso" },
  safe: { box: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500", pill: "border-emerald-500/50 bg-emerald-500/15 text-emerald-500", Icon: ShieldCheck, label: "Seguro" },
  neutral: { box: "border-gray-500/50 bg-gray-500/10 text-gray-500", pill: "border-gray-500/50 bg-gray-500/15 text-gray-500", Icon: CircleHelp, label: "No disponible" },
} as const;

/** Tarjeta independiente por motor de análisis (VirusTotal, Google Safe Browsing…) */
export function EngineSourceCard({
  name, tone, message, chips = [],
}: { name: string; tone: Tone; message: string; chips?: string[] }) {
  const t = TONES[tone];
  return (
    <section className="card flex gap-4 p-5">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${t.box}`}>
        <t.Icon size={20} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{name}</h3>
          <span className={`inline-flex h-6 shrink-0 items-center rounded-full border px-3 text-xs font-medium ${t.pill}`}>{t.label}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{message}</p>
        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c} className={`rounded-full border px-2.5 py-0.5 text-xs ${t.pill}`}>{c}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
