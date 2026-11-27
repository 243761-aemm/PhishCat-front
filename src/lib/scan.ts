import type {
  AuthStatus, EmailAuth, EmailMetadata, EmbeddedUrl, EngineStats, GoogleMatch, GoogleSafeBrowsing,
  RiskLevel, ScanDetails, ScanResult,
} from "./types";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown) => (typeof v === "number" ? v : 0);

export function getDetails(r: ScanResult): ScanDetails {
  return isObj(r.details) ? (r.details as ScanDetails) : {};
}

/* ----------------------------- VirusTotal ----------------------------- */

type VtRaw = ScanDetails["virustotal"];

/** details.virustotal -> conteo por motores. null = sin datos (error de VirusTotal). */
export function parseVirusTotal(vt: VtRaw, fallback?: EngineStats): EngineStats | null {
  if (vt?.error) return null;
  const src = vt?.stats ?? vt?.last_analysis_stats ?? (vt && "malicious" in vt ? vt : undefined) ?? fallback;
  if (!src) return null;
  return {
    malicious: num(src.malicious),
    suspicious: num(src.suspicious),
    harmless: num(src.harmless),
    undetected: num(src.undetected),
  };
}

export const getVirusTotal = (r: ScanResult) => parseVirusTotal(getDetails(r).virustotal, r.stats);

/** Veredicto que el backend calculó para VirusTotal (safe | suspicious | malicious) */
export function getVtRisk(r: ScanResult): Exclude<RiskLevel, "error"> | null {
  const v = getDetails(r).virustotal?.risk_level;
  return v === "safe" || v === "suspicious" || v === "malicious" ? v : null;
}

/* -------------------------- Google Safe Browsing -------------------------- */

export type GoogleState = "safe" | "threat" | "unavailable";

/**
 * details.google:
 *   seguro   -> { risk_level: "safe", details: { matches: [] } }   (matches vacío = SEGURO, no es error)
 *   amenaza  -> { risk_level: "malicious", threat_types: [...], details: { matches: [...] } }
 *   falla    -> { risk_level: "unknown" | "error", error: "..." }
 */
export function parseGoogle(g: GoogleSafeBrowsing | GoogleMatch[] | null | undefined): { state: GoogleState; threats: string[] } {
  if (g === undefined || g === null) return { state: "unavailable", threats: [] };
  if (Array.isArray(g)) {
    return g.length ? { state: "threat", threats: uniq(g.map((m) => m.threatType)) } : { state: "safe", threats: [] };
  }
  if (g.error || g.risk_level === "error" || g.risk_level === "unknown") return { state: "unavailable", threats: [] };
  const matches = g.matches ?? g.details?.matches ?? [];
  const threats = uniq([...(g.threat_types ?? []), ...matches.map((m) => m.threatType)]);
  if (g.risk_level === "malicious" || matches.length > 0 || threats.length > 0) return { state: "threat", threats };
  return { state: "safe", threats: [] };
}

const uniq = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter((x): x is string => !!x)));

export const getGoogle = (r: ScanResult) => parseGoogle(getDetails(r).google);

const THREAT_LABELS: Record<string, string> = {
  SOCIAL_ENGINEERING: "Ingeniería social (phishing)",
  MALWARE: "Malware",
  UNWANTED_SOFTWARE: "Software no deseado",
  POTENTIALLY_HARMFUL_APPLICATION: "Aplicación potencialmente dañina",
};

export const threatLabels = (types: string[]) => types.map((t) => THREAT_LABELS[t] ?? t);

/* --------------------------------- Correo --------------------------------- */

const AUTH_VALUES: AuthStatus[] = ["pass", "fail", "softfail", "neutral", "none", "temperror", "permerror", "present_unverified"];
const normAuth = (v: unknown): AuthStatus => {
  const s = String(v ?? "none").toLowerCase();
  return (AUTH_VALUES as string[]).includes(s) ? (s as AuthStatus) : "none";
};

const KNOWN_RISK: RiskLevel[] = ["safe", "suspicious", "malicious"];

export function getEmailData(r: ScanResult): {
  metadata?: EmailMetadata; authentication: EmailAuth; urls: EmbeddedUrl[]; urlsFound: number; urlsScanned: number;
} {
  const d = getDetails(r);
  const h = d.security_headers;
  const urls: EmbeddedUrl[] = (d.urls_details ?? []).map((u) => {
    const vt = parseVirusTotal(u.details?.virustotal);
    return {
      url: u.url,
      risk_level: KNOWN_RISK.includes(u.risk_level as RiskLevel) ? (u.risk_level as RiskLevel) : "error",
      malicious_count: vt?.malicious ?? 0,
      total_engines: vt ? vt.malicious + vt.suspicious + vt.harmless + vt.undetected : 0,
      google_threat: parseGoogle(u.details?.google).state === "threat",
    };
  });
  return {
    metadata: d.metadata,
    authentication: { spf: normAuth(h?.spf), dkim: normAuth(h?.dkim), dmarc: normAuth(h?.dmarc) },
    urls,
    urlsFound: d.urls_found ?? urls.length,
    urlsScanned: d.urls_scanned ?? urls.length,
  };
}

/* El backend guarda los correos pegados como "raw_email:<asunto>" */
export const isRawTarget = (t: string) => t.startsWith("raw_email:");
export const cleanTarget = (t: string) => (isRawTarget(t) ? t.slice("raw_email:".length) : t);
