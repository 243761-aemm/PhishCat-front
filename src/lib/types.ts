export type RiskLevel = "safe" | "suspicious" | "malicious";
export type ScanType = "url" | "email";
export type AuthStatus = "pass" | "fail" | "softfail" | "none";

/** Conteo por motores de seguridad (estilo VirusTotal) */
export interface EngineStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
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

export interface EmbeddedUrl {
  url: string;
  risk_level: RiskLevel;
  malicious_count: number;
}

export interface ScanResult {
  id?: string | number;
  target: string;
  scan_type: ScanType;
  risk_level: RiskLevel;
  details?: string | string[];
  created_at?: string;
  // Solo escaneos de URL
  stats?: EngineStats;
  // Solo escaneos de correo
  metadata?: EmailMetadata;
  authentication?: EmailAuth;
  urls_details?: EmbeddedUrl[];
}
