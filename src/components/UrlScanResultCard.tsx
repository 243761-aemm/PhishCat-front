"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ScanResult } from "@/lib/types";
import { getGoogle, getVirusTotal, getVtRisk, threatLabels } from "@/lib/scan";
import { EngineSourceCard, type Tone } from "./EngineSourceCard";
import { RiskBanner } from "./RiskBanner";

const COPY = {
  malicious: { title: "Sitio malicioso / Phishing confirmado", sub: "Este enlace fue marcado como peligroso por varios motores. No lo abras ni ingreses datos." },
  suspicious: { title: "Sitio sospechoso / Procede con precaución", sub: "Algunos motores lo marcan como dudoso. Evita ingresar datos personales." },
  safe: { title: "Sitio seguro / Ninguna amenaza detectada", sub: "Ningún motor de seguridad reportó este enlace como peligroso." },
  error: { title: "Sin veredicto / No se pudo analizar", sub: "Los servicios de análisis no respondieron. Inténtalo de nuevo en unos minutos." },
} as const;

const COUNTERS = [
  { key: "malicious", label: "Maliciosos", bar: "bg-red-500", text: "text-red-500" },
  { key: "suspicious", label: "Sospechosos", bar: "bg-yellow-500", text: "text-yellow-500" },
  { key: "harmless", label: "Inofensivos", bar: "bg-emerald-500", text: "text-emerald-500" },
  { key: "undetected", label: "Sin detectar", bar: "bg-gray-500", text: "text-gray-500" },
] as const;

export function UrlScanResultCard({ result }: { result: ScanResult }) {
  const [copied, setCopied] = useState(false);
  const vt = getVirusTotal(result);
  const google = getGoogle(result);
  const total = vt ? COUNTERS.reduce((sum, c) => sum + vt[c.key], 0) : 0;
  const vtFlagged = vt ? (result.risk_level === "suspicious" ? vt.suspicious : vt.malicious) : 0;
  // Google Safe Browsing cuenta como un motor más en el contador del banner
  const bannerTotal = total + (google.state === "unavailable" ? 0 : 1);
  const bannerFlagged = vtFlagged + (google.state === "threat" ? 1 : 0);

  // Estado de cada fuente (cada motor se evalúa por separado)
  const vtRisk = getVtRisk(result); // veredicto que calculó el backend para VirusTotal
  const vtTone: Tone = !vt ? "neutral"
    : vtRisk ?? (vt.malicious > 0 ? "malicious" : vt.suspicious > 0 ? "suspicious" : "safe");
  const vtMessage = !vt ? "Sin respuesta de VirusTotal"
    : vt.malicious > 0 ? `${vt.malicious} de ${total} motores lo marcan como malicioso`
    : vt.suspicious > 0 ? `${vt.suspicious} de ${total} motores lo marcan como sospechoso`
    : `Ningún motor lo marcó como peligroso (${total} consultados)`;
  const gTone: Tone = google.state === "threat" ? "malicious" : google.state === "safe" ? "safe" : "neutral";
  const gMessage = google.state === "threat" ? "Amenazas detectadas por Google"
    : google.state === "safe" ? "Sin amenazas detectadas"
    : "Sin respuesta de Google Safe Browsing";
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
      <RiskBanner risk={result.risk_level} title={copy.title} subtitle={copy.sub} big={bannerTotal ? `${bannerFlagged}/${bannerTotal}` : "—"} small="motores lo detectan" />

      {/* Una tarjeta por fuente de análisis */}
      <div className="grid gap-4 sm:grid-cols-2">
        <EngineSourceCard name="VirusTotal" tone={vtTone} message={vtMessage} />
        <EngineSourceCard name="Google Safe Browsing" tone={gTone} message={gMessage}
          chips={google.state === "threat" ? threatLabels(google.threats) : []} />
      </div>

      {/* Detección por motores (VirusTotal) */}
      {vt && (
      <section className="card px-6 pb-6 pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="text-base font-semibold">Detección por motores de seguridad</h3>
          <p className="text-xs text-muted">{total} motores consultados · VirusTotal</p>
        </div>

        <div className="mt-3 flex h-4 gap-0.5" role="img"
          aria-label={`${vt.malicious} maliciosos, ${vt.suspicious} sospechosos, ${vt.harmless} inofensivos, ${vt.undetected} sin detectar`}>
          {COUNTERS.map((c) => vt[c.key] > 0 && (
            <div key={c.key} className={`rounded ${c.bar}`} style={{ flexGrow: vt[c.key], flexBasis: 0 }} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {COUNTERS.map((c) => (
            <div key={c.key} className="h-[84px] rounded-lg border border-line bg-raised px-[15px] pt-[13px]">
              <p className="-ml-[3px] flex h-5 items-center gap-[9px] text-sm text-muted">
                <span className={`h-2.5 w-2.5 rounded-full ${c.bar}`} aria-hidden /> {c.label}
              </p>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className={`font-mono text-[28px] font-semibold leading-7 ${c.text}`}>{vt[c.key]}</span>
                <span className="text-xs text-muted">{total ? Math.round((vt[c.key] / total) * 100) : 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

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
