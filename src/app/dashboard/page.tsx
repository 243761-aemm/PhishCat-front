"use client";
import { AuthGuard } from "@/components/AuthGuard";
import { ScanPanel } from "@/components/ScanPanel";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">¿Algo te parece raro?</h1>
        <p className="mt-1 text-sm text-muted">Analiza un enlace o un correo y te decimos si es seguro abrirlo.</p>
      </div>
      <ScanPanel />
    </AuthGuard>
  );
}
