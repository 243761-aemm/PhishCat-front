/** "error" = el backend no pudo emitir veredicto (risk_level error / unknown / pending) */
export type RiskLevel = "safe" | "suspicious" | "malicious" | "error";
export type ScanType = "url" | "email";
export type AuthStatus =
  | "pass" | "fail" | "softfail" | "neutral" | "none" | "temperror" | "permerror" | "present_unverified";

/** Conteo por motores de VirusTotal */
export interface EngineStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
}

/** Una coincidencia de Google Safe Browsing (matches[]) */
export interface GoogleMatch {
  threatType?: string;
  platformType?: string;
  threatEntryType?: string;
  threat?: { url?: string };
}

/** Forma real del backend: details.google */
export interface GoogleSafeBrowsing {
  risk_level?: string;               // safe | malicious | unknown | error
  threat_types?: string[];           // solo si hay amenazas
  matches?: GoogleMatch[] | null;    // (por compatibilidad)
  details?: { matches?: GoogleMatch[] | null; status?: string; message?: string };
  error?: string;
}

export interface EmailMetadata {
  from: string;
  to: string;
  subject: string;
  date: string;
  return_path?: string;
}

export interface EmailAuth {
  spf: AuthStatus;
  dkim: AuthStatus;
  dmarc: AuthStatus;
}

/** Enlace del correo, ya normalizado por lib/scan.ts */
export interface EmbeddedUrl {
  url: string;
  risk_level: RiskLevel;
  malicious_count: number;   // motores de VirusTotal que lo marcan malicioso
  total_engines: number;     // motores de VirusTotal consultados
  google_threat: boolean;    // Google Safe Browsing lo marcó
}

/** details ahora es un objeto multimotor */
export interface ScanDetails {
  virustotal?: (Partial<EngineStats> & {
    risk_level?: string;
    stats?: Partial<EngineStats>;
    last_analysis_stats?: Partial<EngineStats>;
    error?: string;
  }) | null;
  google?: GoogleSafeBrowsing | GoogleMatch[] | null;
  // Escaneo de correo (.eml): así lo devuelve el backend
  metadata?: EmailMetadata;
  security_headers?: Partial<Record<"spf" | "dkim" | "dmarc", string>>;
  urls_found?: number;
  urls_scanned?: number;
  urls_details?: RawEmbeddedUrl[];
}

/** Cada enlace del correo trae el resultado combinado de URL */
export interface RawEmbeddedUrl {
  url: string;
  risk_level: string;
  details?: ScanDetails;
}

export interface ScanResult {
  id?: string | number;
  target: string;
  scan_type: ScanType;
  risk_level: RiskLevel;
  details?: string | string[] | ScanDetails;
  created_at?: string;
  // Compatibilidad con el modo demo
  stats?: EngineStats;
}
