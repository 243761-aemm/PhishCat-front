"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { AlertCircle, Loader2 } from "lucide-react";
import { getErrorMessage, loginRequest, registerRequest } from "@/lib/api";
import { useAuth, useHydrated } from "@/store/auth";
import { Logo } from "./Logo";

const schema = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Correo no válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type FormData = z.infer<typeof schema>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const { token, login } = useAuth();
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (hydrated && token) router.replace("/dashboard");
  }, [hydrated, token, router]);

  async function onSubmit({ email, password }: FormData) {
    setError(null);
    try {
      if (!isLogin) await registerRequest(email, password);
      const data = await loginRequest(email, password);
      login(data.access_token, email);
      router.replace("/dashboard");
    } catch (e) {
      if (isLogin && axios.isAxiosError(e) && [400, 401].includes(e.response?.status ?? 0)) {
        setError("Credenciales incorrectas");
      } else {
        setError(getErrorMessage(e));
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-sm text-muted">Revisa enlaces y correos antes de confiar en ellos.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6" noValidate>
          <h1 className="text-base font-semibold">{isLogin ? "Inicia sesión" : "Crea tu cuenta"}</h1>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm text-muted">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" placeholder="tu@correo.com" className="input" {...register("email")} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm text-muted">Contraseña</label>
            <input id="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} className="input" {...register("password")} />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn w-full">
            {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <Link href={isLogin ? "/register" : "/login"} className="text-brand hover:underline">
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </Link>
        </p>
      </div>
    </div>
  );
}