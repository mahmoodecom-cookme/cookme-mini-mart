const TONES: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  confirmed: "bg-chart-5/15 text-foreground border-chart-5/40",
  packing: "bg-chart-5/15 text-foreground border-chart-5/40",
  out_for_delivery: "bg-chart-3/20 text-foreground border-chart-3/40",
  delivered: "bg-success/15 text-success border-success/40",
  paid: "bg-success/15 text-success border-success/40",
  completed: "bg-success/15 text-success border-success/40",
  cancelled: "bg-destructive/10 text-destructive border-destructive/40",
  void: "bg-destructive/10 text-destructive border-destructive/40",
  new: "bg-warning/15 text-warning-foreground border-warning/40",
  in_progress: "bg-chart-5/15 text-foreground border-chart-5/40",
  done: "bg-success/15 text-success border-success/40",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
