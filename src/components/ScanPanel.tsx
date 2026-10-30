"use client";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, FileText, Link2, Loader2, Mail, Search, UploadCloud, X } from "lucide-react";
import { getErrorMessage, scanEmail, scanUrl } from "@/lib/api";
import type { ScanResult } from "@/lib/types";
import { ResultSkeleton, VerdictCard } from "./VerdictCard";

const urlSchema = z.object({
  url: z.string().trim().min(1, "Pega un enlace").url("Incluye el protocolo, por ejemplo https://..."),
});
type UrlForm = z.infer<typeof urlSchema>;
type Phase = { s: "idle" } | { s: "loading" } | { s: "done"; result: ScanResult } | { s: "error"; msg: string };

export function ScanPanel() {
  const [tab, setTab] = useState<"url" | "email">("url");
  const [phase, setPhase] = useState<Phase>({ s: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const loading = phase.s === "loading";

  const { register, handleSubmit, formState: { errors } } = useForm<UrlForm>({ resolver: zodResolver(urlSchema) });

  const dz = useDropzone({
    accept: { "message/rfc822": [".eml"], "application/octet-stream": [".eml"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDropAccepted: (f) => { setFile(f[0]); setFileError(null); },
    onDropRejected: () => setFileError("Solo se admite un archivo .eml de hasta 10 MB."),
  });

  async function run(fn: () => Promise<ScanResult>) {
    setPhase({ s: "loading" });
    try { setPhase({ s: "done", result: await fn() }); }
    catch (e) { setPhase({ s: "error", msg: getErrorMessage(e, "No pudimos completar el análisis.") }); }
  }

  const tabBtn = (id: "url" | "email", label: string, Icon: typeof Link2) => (
    <button
      role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition ${
        tab === id ? "border-brand text-fg" : "border-transparent text-muted hover:text-fg"}`}
    >
      <Icon size={16} aria-hidden /> {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <div role="tablist" className="flex border-b border-line px-2">
          {tabBtn("url", "Analizar URL", Link2)}
          {tabBtn("email", "Analizar correo", Mail)}
        </div>

        <div className="p-6">
          {tab === "url" ? (
            <form onSubmit={handleSubmit((v) => run(() => scanUrl(v.url)))} className="space-y-4" noValidate>
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  aria-label="Enlace sospechoso" autoComplete="off" spellCheck={false}
                  placeholder="Pega aquí el enlace sospechoso (ej. https://...)"
                  className="input py-3.5 pl-11 font-mono" {...register("url")}
                />
              </div>
              {errors.url && <p className="text-xs text-danger">{errors.url.message}</p>}
              <button type="submit" disabled={loading} className="btn w-full py-3">
                {loading && <Loader2 size={16} className="animate-spin" aria-hidden />} Analizar enlace
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div
                {...dz.getRootProps()}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
                  dz.isDragActive ? "border-brand bg-brand/5" : "border-line hover:border-muted"}`}
              >
                <input {...dz.getInputProps()} aria-label="Archivo .eml" />
                <UploadCloud size={36} className="text-muted" aria-hidden />
                <p className="text-sm">Arrastra tu archivo .eml aquí o haz clic para buscar</p>
                <p className="text-xs text-muted">Máximo 10 MB</p>
              </div>
              {fileError && <p className="text-xs text-danger">{fileError}</p>}
              {file && (
                <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-raised px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText size={16} className="shrink-0 text-brand" aria-hidden />
                    <span className="truncate font-mono text-xs">{file.name}</span>
                  </span>
                  <button onClick={() => setFile(null)} aria-label="Quitar archivo" className="text-muted hover:text-fg"><X size={16} /></button>
                </div>
              )}
              <button disabled={!file || loading} onClick={() => file && run(() => scanEmail(file))} className="btn w-full py-3">
                {loading && <Loader2 size={16} className="animate-spin" aria-hidden />} Analizar archivo
              </button>
            </div>
          )}
        </div>
      </div>

      {phase.s === "loading" && <ResultSkeleton />}
      {phase.s === "done" && <VerdictCard result={phase.result} />}
      {phase.s === "error" && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {phase.msg}
        </div>
      )}
    </div>
  );
}
