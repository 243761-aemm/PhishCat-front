"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Link2, Mail, SearchX } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { getErrorMessage, getHistory } from "@/lib/api";
import { RISK, formatDate } from "@/lib/risk";
import type { ScanResult } from "@/lib/types";

export default function HistoryPage() {
  const [items, setItems] = useState<ScanResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHistory().then(setItems).catch((e) => setError(getErrorMessage(e, "No pudimos cargar tu historial.")));
  }, []);

  return (
    <AuthGuard>
      <h1 className="mb-6 text-2xl font-semibold">Historial de análisis</h1>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {error}
        </div>
      )}

      {!error && items === null && (
        <div className="card divide-y divide-line">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-raised/40" />)}
        </div>
      )}

      {items?.length === 0 && (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <SearchX size={56} strokeWidth={1.25} className="text-muted" aria-hidden />
          <p className="max-w-xs text-sm text-muted">Aún no has analizado ninguna amenaza. Ve al Dashboard para comenzar.</p>
          <Link href="/dashboard" className="btn mt-2">Ir al Dashboard</Link>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Objetivo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Veredicto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((it, i) => {
                const r = RISK[it.risk_level] ?? RISK.suspicious;
                const isUrl = it.scan_type === "url";
                return (
                  <tr key={it.id ?? i}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(it.created_at)}</td>
                    <td className="max-w-[280px] px-4 py-3"><span className="block truncate font-mono text-xs" title={it.target}>{it.target}</span></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        {isUrl ? <Link2 size={14} aria-hidden /> : <Mail size={14} aria-hidden />}
                        {isUrl ? "Enlace" : "Correo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${r.pill}`}>{r.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AuthGuard>
  );
}
