import { AlertTriangle, CircleCheck, CircleMinus, CircleX } from "lucide-react";
import type { AuthStatus, ScanResult } from "@/lib/types";
import { getEmailData } from "@/lib/scan";
import { RiskBanner, RiskPill } from "./RiskBanner";

const COPY = {
  malicious: { title: "Correo malicioso / Phishing confirmado", sub: "Este correo intenta suplantar a un remitente legítimo e incluye enlaces peligrosos." },
  suspicious: { title: "Correo sospechoso / Origen dudoso", sub: "El remitente no tiene registros de autenticación completos. Revisa antes de abrir enlaces." },
  safe: { title: "Correo seguro / Ninguna amenaza detectada", sub: "El remitente está autenticado y ningún enlace fue reportado como peligroso." },
  error: { title: "Sin veredicto / No se pudo analizar", sub: "Los servicios de análisis no respondieron. Inténtalo de nuevo en unos minutos." },
} as const;

const AUTH_STYLE: Record<AuthStatus, { cls: string; Icon: typeof CircleCheck; label: string }> = {
  pass: { cls: "border-emerald-500/50 bg-emerald-500/15 text-emerald-500", Icon: CircleCheck, label: "Pass" },
  fail: { cls: "border-red-500/50 bg-red-500/15 text-red-500", Icon: CircleX, label: "Fail" },
  softfail: { cls: "border-red-500/50 bg-red-500/15 text-red-500", Icon: CircleX, label: "Softfail" },
  none: { cls: "border-gray-500/50 bg-gray-500/15 text-gray-500", Icon: CircleMinus, label: "Ninguno" },
  neutral: { cls: "border-gray-500/50 bg-gray-500/15 text-gray-500", Icon: CircleMinus, label: "Neutral" },
  temperror: { cls: "border-gray-500/50 bg-gray-500/15 text-gray-500", Icon: CircleMinus, label: "Error temporal" },
  permerror: { cls: "border-gray-500/50 bg-gray-500/15 text-gray-500", Icon: CircleMinus, label: "Error de config." },
  present_unverified: { cls: "border-gray-500/50 bg-gray-500/15 text-gray-500", Icon: CircleMinus, label: "Sin verificar" },
};

const PROTOCOLS = [
  { key: "spf", name: "SPF", desc: "Servidor autorizado a enviar" },
  { key: "dkim", name: "DKIM", desc: "Firma digital del mensaje" },
  { key: "dmarc", name: "DMARC", desc: "Política del dominio" },
] as const;

// "PayPal Soporte <soporte@paypal.com>" -> "soporte@paypal.com"
const addressOf = (s?: string) => s?.match(/<([^>]+)>/)?.[1] ?? s ?? "";
const domainOf = (s?: string) => s?.match(/@([^>\s]+)/)?.[1]?.toLowerCase() ?? "";

function formatDate(raw?: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export function EmailScanResultCard({ result }: { result: ScanResult }) {
  const { metadata: meta, authentication: auth, urls: links, urlsFound, urlsScanned } = getEmailData(result);
  const copy = COPY[result.risk_level] ?? COPY.suspicious;
  const flagged = result.risk_level === "suspicious"
    ? links.filter((l) => l.risk_level !== "safe").length
    : links.filter((l) => l.risk_level === "malicious").length;

  // Suplantación: dominio visible ≠ ruta de retorno y SPF/DMARC fallaron
  const failed = (v?: string) => v === "fail" || v === "softfail";
  const authFailed = failed(auth?.spf) || failed(auth?.dmarc);
  const mismatch = !!domainOf(meta?.from) && !!domainOf(meta?.return_path) && domainOf(meta?.from) !== domainOf(meta?.return_path);
  const spoofing = mismatch && authFailed;

  const rows: [string, string | undefined, boolean?][] = [
    ["De (From)", meta?.from],
    ["Para (To)", meta?.to],
    ["Asunto (Subject)", meta?.subject],
    ["Fecha (Date)", formatDate(meta?.date)],
    ["Ruta de retorno", meta?.return_path, mismatch], // en rojo si no coincide con el remitente
  ];

  return (
    <div className="space-y-6">
      <RiskBanner risk={result.risk_level} title={copy.title} subtitle={copy.sub} big={`${flagged}/${links.length}`}
        small={result.risk_level === "suspicious" ? "enlaces dudosos" : "enlaces peligrosos"} />

      {/* Autenticación */}
      <section className="card px-6 pb-6 pt-4">
        <h3 className="text-base font-semibold">Autenticación del remitente (anti-spoofing)</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {PROTOCOLS.map((p) => {
            const st = AUTH_STYLE[auth[p.key]] ?? AUTH_STYLE.none;
            return (
              <div key={p.key} className="min-h-24 rounded-lg border border-line bg-raised px-[15px] pb-2.5 pt-[11px]">
                <p className="text-base font-semibold">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted">{p.desc}</p>
                <span className={`mt-1.5 inline-flex h-[26px] items-center gap-1.5 rounded-full border pl-2.5 pr-5 text-xs font-medium ${st.cls}`}>
                  <st.Icon size={14} aria-hidden /> {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Alerta de suplantación */}
      {spoofing && (
        <div role="alert" className="flex min-h-[84px] gap-4 rounded-lg border border-red-500 bg-red-500/10 px-6 pb-2 pt-4">
          <AlertTriangle size={32} strokeWidth={1.75} className="mt-2 shrink-0 text-red-500" aria-hidden />
          <div className="min-w-0">
            <p className="text-base font-semibold text-red-500">Posible suplantación de identidad detectada</p>
            <p className="text-sm">El remitente visible no coincide con el servidor de origen.</p>
            <p className="whitespace-pre-wrap break-all font-mono text-xs text-muted">
              {`Visible: ${addressOf(meta?.from)}   ·   Ruta real: ${addressOf(meta?.return_path)}`}
            </p>
          </div>
        </div>
      )}

      {/* Metadatos */}
      <section className="card px-6 pb-6 pt-3.5">
        <h3 className="text-base font-semibold">Metadatos del correo</h3>
        <dl className="-mx-6 mt-3.5">
          {rows.map(([k, v, alert]) => (
            <div key={k} className="grid min-h-10 items-center gap-1 border-t border-line px-6 sm:grid-cols-[160px_1fr]">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className={`break-all font-mono text-[13px] ${alert ? "font-medium text-red-500" : ""}`}>
                {v || "—"}{alert && <span className="ml-2 font-sans text-xs">· no coincide con el remitente</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Enlaces */}
      <section className="card px-6 pb-6 pt-3.5">
        <h3 className="text-base font-semibold">Enlaces encontrados en el correo ({urlsFound})</h3>
        {links.length === 0 ? (
          <p className="mt-3.5 text-sm text-muted">Este correo no contiene enlaces.</p>
        ) : (
          <div className="-mx-6 mt-3.5 overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed text-left">
              <colgroup><col style={{ width: "56.8%" }} /><col style={{ width: "17.9%" }} /><col /></colgroup>
              <thead>
                <tr className="h-8 align-top text-sm font-medium text-muted">
                  <th className="pl-6 font-medium">Enlace</th>
                  <th className="font-medium">Veredicto</th>
                  <th className="pr-6 font-medium">Motores que lo detectan</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l, i) => (
                  <tr key={i} className="h-[52px] border-t border-line">
                    <td className="pl-6 pr-4"><span className="block truncate font-mono text-xs" title={l.url}>{l.url}</span></td>
                    <td><RiskPill risk={l.risk_level} /></td>
                    <td className={`pr-6 text-sm ${
                      l.malicious_count > 0 || l.google_threat ? `font-medium ${l.risk_level === "malicious" ? "text-red-500" : "text-yellow-500"}` : "text-muted"}`}>
                      {l.total_engines ? `${l.malicious_count} de ${l.total_engines} motores` : "Sin datos"}
                      {l.google_threat && " + Google"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {urlsFound > urlsScanned && (
          <p className="mt-3 text-xs text-muted">Se analizaron {urlsScanned} de {urlsFound} enlaces.</p>
        )}
      </section>
    </div>
  );
}
