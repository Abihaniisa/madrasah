import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isAuthorized } from "./supabase";

export function useRequireAuth() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) { nav("/login"); return; }
      const ok = await isAuthorized();
      if (cancelled) return;
      if (!ok) { nav("/login"); return; }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [nav]);
  return ready;
}
