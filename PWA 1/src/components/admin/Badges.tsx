export function BloodBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-[11px] font-bold text-primary">
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    Baru: "bg-amber-100 text-amber-800 border-amber-200",
    Diproses: "bg-blue-100 text-blue-800 border-blue-200",
    Selesai: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${
        statusStyles[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
}
