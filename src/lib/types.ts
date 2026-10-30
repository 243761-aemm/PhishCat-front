export type RiskLevel = "safe" | "suspicious" | "malicious";
export type ScanType = "url" | "email";

export interface ScanResult {
  id?: string | number;
  target: string;
  scan_type: ScanType;
  risk_level: RiskLevel;
  details: string | string[];
  created_at?: string;
}
