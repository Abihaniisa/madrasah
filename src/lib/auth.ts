import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isAuthorized } from "./supabase";

/* Session-scoped cache.
   The auth result does not change between page navigations, so
   check it once and reuse. Cleared by resetAuth() on logout. */
let cache: "unknown" | "authorized" | "denied" = "unknown";
let inflight: Promise<void> | null = null;

async function doCheck() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) { cache = "denied"; return; }
  const ok = await isAuthorized();
  cache = ok ? "authorized" : "denied";
}

async function ensureChecked() {
  if (cache !== "unknown") return;
  if (!inflight) inflight = doCheck().finally(() => { inflight = null; });
  await inflight;
}

export function resetAuth() {
  cache = "unknown";
  inflight = null;
}

export function useRequireAuth(): boolean {
  const nav = useNavigate();
  const [ready, setReady] = useState(cache === "authorized");

  useEffect(() => {
    if (cache === "authorized") { setReady(true); return; }
    if (cache === "denied") { nav("/login"); return; }
    let cancelled = false;
    (async () => {
      await ensureChecked();
      if (cancelled) return;
      if (cache === "authorized") setReady(true);
      else nav("/login");
    })();
    return () => { cancelled = true; };
  }, [nav]);

  return ready;
}
