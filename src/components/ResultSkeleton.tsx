export function ResultSkeleton() {
  return (
    <div className="card animate-pulse p-6" role="status" aria-live="polite">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-full bg-raised" />
        <div className="space-y-2"><div className="h-3 w-20 rounded bg-raised" /><div className="h-5 w-56 rounded bg-raised" /></div>
      </div>
      <div className="mt-6 space-y-2"><div className="h-3 w-full rounded bg-raised" /><div className="h-3 w-2/3 rounded bg-raised" /></div>
      <p className="mt-6 text-sm text-muted">Consultando fuentes de inteligencia…</p>
    </div>
  );
}
