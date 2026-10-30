"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/store/auth";
import { Logo } from "./Logo";

const links = [
  { href: "/dashboard", label: "Analizar" },
  { href: "/history", label: "Historial" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { email, logout } = useAuth();

  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard"><Logo /></Link>
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  pathname === l.href ? "bg-raised text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[200px] truncate font-mono text-xs text-muted sm:block">{email}</span>
          <button
            onClick={() => { logout(); router.replace("/login"); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-muted transition hover:text-fg"
          >
            <LogOut size={14} aria-hidden /> Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
