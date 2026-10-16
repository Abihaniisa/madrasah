import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isAuthorized } from "./supabase";

type CacheState = "unknown" | "authorized" | "denied";

/* Session-scoped cache.
   The auth result does not change between page navigations, so
   check it once and reuse. Cleared by resetAuth() on logout. */
let cache: CacheState = "unknown";
let inflight: Promise<void> | null = null;

async function doCheck() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) { cache = "denied"; return; }
  const ok = await isAuthorized();
  cache = ok ? "authorized" : "denied";
}

async function ensureChecked(): Promise<CacheState> {
  if (cache !== "unknown") return cache;
  if (!inflight) {
    inflight = doCheck().finally(() => { inflight = null; });
  }
  await inflight;
  return cache;
}

export function resetAuth() {
  cache = "unknown";
  inflight = null;
}

export function useRequireAuth(): boolean {
  const nav = useNavigate();
  const [ready, setReady] = useState<boolean>(cache === "authorized");

  useEffect(() => {
    if (cache === "authorized") { setReady(true); return; }
    if (cache === "denied") { nav("/login"); return; }
    let cancelled = false;
    (async () => {
      const result = await ensureChecked();
      if (cancelled) return;
      if (result === "authorized") setReady(true);
      else nav("/login");
    })();
    return () => { cancelled = true; };
  }, [nav]);

  return ready;
}
