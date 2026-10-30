"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, useHydrated } from "@/store/auth";
import { Navbar } from "./Navbar";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token } = useAuth();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-muted" aria-label="Cargando" />
      </div>
    );
  }
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">{children}</main>
    </>
  );
}