"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { EngineStats, ScanResult } from "@/lib/types";
import { RiskBanner } from "./RiskBanner";

const COPY = {
  malicious: { title: "Sitio malicioso / Phishing confirmado", sub: "Este enlace fue marcado como peligroso por varios motores. No lo abras ni ingreses datos." },
  suspicious: { title: "Sitio sospechoso / Procede con precaución", sub: "Algunos motores lo marcan como dudoso. Evita ingresar datos personales." },
  safe: { title: "Sitio seguro / Ninguna amenaza detectada", sub: "Ningún motor de seguridad reportó este enlace como peligroso." },
} as const;

const EMPTY: EngineStats = { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };

const COUNTERS = [
  { key: "malicious", label: "Maliciosos", bar: "bg-red-500", text: "text-red-500" },
  { key: "suspicious", label: "Sospechosos", bar: "bg-yellow-500", text: "text-yellow-500" },
  { key: "harmless", label: "Inofensivos", bar: "bg-emerald-500", text: "text-emerald-500" },
  { key: "undetected", label: "Sin detectar", bar: "bg-gray-500", text: "text-gray-500" },
] as const;

export function UrlScanResultCard({ result }: { result: ScanResult }) {
  const [copied, setCopied] = useState(false);
  const stats = result.stats ?? EMPTY;
  const total = COUNTERS.reduce((sum, c) => sum + stats[c.key], 0);
  const flagged = result.risk_level === "suspicious" ? stats.suspicious : stats.malicious;
  const copy = COPY[result.risk_level] ?? COPY.suspicious;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(result.target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* el navegador bloqueó el portapapeles */ }
  }

  let hostname = "—";
  try { hostname = new URL(result.target).hostname; } catch { /* URL inválida */ }

  const date = new Date(result.created_at ?? Date.now()).toLocaleString("es-MX", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <div className="space-y-6">
      <RiskBanner risk={result.risk_level} title={copy.title} subtitle={copy.sub} big={`${flagged}/${total}`} small="motores lo detectan" />

      {/* Detección por motores */}
      <section className="card px-6 pb-6 pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="text-base font-semibold">Detección por motores de seguridad</h3>
          <p className="text-xs text-muted">{total} motores consultados · VirusTotal</p>
        </div>

        <div className="mt-3 flex h-4 gap-0.5" role="img"
          aria-label={`${stats.malicious} maliciosos, ${stats.suspicious} sospechosos, ${stats.harmless} inofensivos, ${stats.undetected} sin detectar`}>
          {COUNTERS.map((c) => stats[c.key] > 0 && (
            <div key={c.key} className={`rounded ${c.bar}`} style={{ flexGrow: stats[c.key], flexBasis: 0 }} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {COUNTERS.map((c) => (
            <div key={c.key} className="h-[84px] rounded-lg border border-line bg-raised px-[15px] pt-[13px]">
              <p className="-ml-[3px] flex h-5 items-center gap-[9px] text-sm text-muted">
                <span className={`h-2.5 w-2.5 rounded-full ${c.bar}`} aria-hidden /> {c.label}
              </p>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className={`font-mono text-[28px] font-semibold leading-7 ${c.text}`}>{stats[c.key]}</span>
                <span className="text-xs text-muted">{total ? Math.round((stats[c.key] / total) * 100) : 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* URL analizada */}
      <section className="card px-6 pb-8 pt-4">
        <h3 className="text-base font-semibold">URL analizada</h3>
        <div className="mt-2.5 flex min-h-[52px] flex-col gap-3 rounded-md border border-line bg-bg py-[7px] pl-[17px] pr-[11px] sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 break-all font-mono text-sm">{result.target}</p>
          <button onClick={copyUrl}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-line bg-raised pl-3.5 pr-4 text-sm transition hover:border-muted sm:w-32">
            {copied ? <Check size={16} className="text-emerald-500" aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? "Copiada" : "Copiar URL"}
          </button>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-[284px_284px_1fr]">
          <div><dt className="text-xs text-muted">Tipo de análisis</dt><dd className="mt-[5px] text-sm">Enlace (URL)</dd></div>
          <div><dt className="text-xs text-muted">Dominio</dt><dd className="mt-[5px] break-all font-mono text-sm">{hostname}</dd></div>
          <div><dt className="text-xs text-muted">Fecha</dt><dd className="mt-[5px] text-sm">{date}</dd></div>
        </dl>
      </section>
    </div>
  );
}
