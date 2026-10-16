import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../lib/config";
import { signIn, supabase, isAuthorized } from "../lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const id = identifier.trim();

    if (id.includes("@")) {
      const { error } = await signIn(id, secret);
      if (error) { setErr(error.message); setBusy(false); return; }
      const ok = await isAuthorized();
      if (!ok) { await supabase.auth.signOut(); setErr("Not authorized."); setBusy(false); return; }
      setBusy(false);
      nav("/admin");
      return;
    }

    setErr("Student portal is not yet open.");
    setBusy(false);
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <img src="/logo.svg" alt="" width={56} height={56} style={{ display: "block", margin: "0 auto 18px" }} />
        <h1>Sign in</h1>
        <p className="sub">{CONFIG.short}</p>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          {err && <div className="notice">{err}</div>}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="login-note">Staff only. Contact the administrator for access.</div>
      </div>
    </div>
  );
}
