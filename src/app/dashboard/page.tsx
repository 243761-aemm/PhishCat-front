"use client";
import { AuthGuard } from "@/components/AuthGuard";
import { ScanPanel } from "@/components/ScanPanel";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <ScanPanel />
    </AuthGuard>
  );
}
