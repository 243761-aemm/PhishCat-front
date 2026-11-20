import { AlertTriangle, CircleHelp, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RiskLevel } from "./types";

export const RISK: Record<RiskLevel, {
  label: string; title: string; icon: typeof ShieldCheck; text: string; border: string; bg: string; pill: string;
}> = {
  malicious: {
    label: "Malicioso", title: "¡Peligro! Amenaza detectada", icon: ShieldAlert,
    text: "text-danger", border: "border-danger/50", bg: "bg-danger/10", pill: "bg-danger/15 text-danger border-danger/40",
  },
  suspicious: {
    label: "Sospechoso", title: "Precaución: origen dudoso", icon: AlertTriangle,
    text: "text-warn", border: "border-warn/50", bg: "bg-warn/10", pill: "bg-warn/15 text-warn border-warn/40",
  },
  safe: {
    label: "Seguro", title: "Ninguna amenaza detectada", icon: ShieldCheck,
    text: "text-ok", border: "border-ok/50", bg: "bg-ok/10", pill: "bg-ok/15 text-ok border-ok/40",
  },
  error: {
    label: "Sin veredicto", title: "No se pudo completar el análisis", icon: CircleHelp,
    text: "text-muted", border: "border-line", bg: "bg-raised", pill: "bg-raised text-muted border-line",
  },
};

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMin = Math.round((date.getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffMin) < 60 * 24) return rtf.format(Math.round(diffMin / 60), "hour");
  if (Math.abs(diffMin) < 60 * 24 * 7) return rtf.format(Math.round(diffMin / 1440), "day");
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
