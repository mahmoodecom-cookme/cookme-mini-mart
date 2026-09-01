const RELOAD_FLAG = "cmm_chunk_reload_at";

export function isChunkLoadError(error: unknown): boolean {
  const msg =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";
  return (
    /dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  );
}

/**
 * A stale deploy leaves the loaded HTML pointing at chunk files that no longer
 * exist. Reload once (guarded, so we never loop) to pick up the new build.
 */
export function recoverFromChunkError(error: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;

  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_FLAG) ?? 0);
    if (Date.now() - last < 15000) return false;
    window.sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  } catch {
    /* sessionStorage unavailable — still attempt a single reload */
  }

  window.location.reload();
  return true;
}

export function installChunkRecovery() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __cmmChunkRecovery?: boolean };
  if (w.__cmmChunkRecovery) return;
  w.__cmmChunkRecovery = true;

  window.addEventListener("error", (e) => recoverFromChunkError(e.error ?? e.message));
  window.addEventListener("unhandledrejection", (e) => recoverFromChunkError(e.reason));
}
