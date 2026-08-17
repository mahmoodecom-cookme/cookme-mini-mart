import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/catalog.functions";
import { settingsMap } from "@/lib/format";

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSettings(),
    staleTime: 5 * 60_000,
  });
  return settingsMap(data as { key: string; value: string | null }[] | undefined);
}

/** Owner-controlled theme colours applied on top of the design tokens. */
export function ThemeOverrides() {
  const s = useSiteSettings();
  const map: Array<[string, string]> = [
    ["--primary", s.theme_primary],
    ["--background", s.theme_background],
    ["--secondary", s.theme_secondary],
  ];
  const css = map
    .filter(([, v]) => v && /^(oklch|hsl|rgb|#)/i.test(v.trim()))
    .map(([k, v]) => `${k}: ${v.trim()};`)
    .join("");
  if (!css) return null;
  return <style>{`:root{${css}}`}</style>;
}

export function parseMenuLinks(value: string | undefined) {
  const rows = (value ?? "")
    .split("\n")
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter((p) => p.length === 2 && p[0] && p[1].startsWith("/"))
    .map(([label, to]) => ({ label, to }));
  return rows;
}
