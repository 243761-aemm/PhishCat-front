import { RISK, toDetailList } from "@/lib/risk";
import type { ScanResult } from "@/lib/types";

export function VerdictCard({ result }: { result: ScanResult }) {
  const r = RISK[result.risk_level] ?? RISK.suspicious;
  const Icon = r.icon;
  const details = toDetailList(result.details);

  return (
    <section aria-live="polite" className={`rounded-lg border ${r.border} ${r.bg} p-6`}>
      <div className="flex items-center gap-4">
        <Icon className={r.text} size={44} strokeWidth={1.75} aria-hidden />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${r.text}`}>{r.label}</p>
          <h2 className="text-xl font-semibold sm:text-2xl">{r.title}</h2>
        </div>
      </div>
      <p className="mt-4 break-all font-mono text-xs text-muted">{result.target}</p>
      {details.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line/60 pt-4 text-sm">
          {details.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${r.text} bg-current`} aria-hidden />
              {d}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ResultSkeleton() {
  return (
    <div className="card animate-pulse p-6" role="status" aria-live="polite">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-raised" />
        <div className="space-y-2"><div className="h-3 w-20 rounded bg-raised" /><div className="h-5 w-56 rounded bg-raised" /></div>
      </div>
      <div className="mt-6 space-y-2"><div className="h-3 w-full rounded bg-raised" /><div className="h-3 w-2/3 rounded bg-raised" /></div>
      <p className="mt-6 text-sm text-muted">Consultando fuentes de inteligencia…</p>
    </div>
  );
}
