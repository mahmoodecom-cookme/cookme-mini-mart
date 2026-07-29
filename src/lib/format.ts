export const CURRENCY = "Rs.";

export function money(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return `${CURRENCY} ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function settingsMap(rows: { key: string; value: string | null }[] | undefined | null) {
  const m: Record<string, string> = {};
  (rows ?? []).forEach((r) => (m[r.key] = r.value ?? ""));
  return m;
}

export function num(v: string | undefined, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
