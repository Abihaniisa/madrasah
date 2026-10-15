import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CONFIG } from "../lib/config";
import { signIn } from "../lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setErr(error.message);
    else nav("/admin");
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand-mark">M</div>
        <h1>Sign in to the portal</h1>
        <p className="sub">{CONFIG.short}</p>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="field">
            <label>Authorised email</label>
            <input
              className="input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {err && (
            <div className="notice" style={{ marginTop: 4 }}>
              {err}
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="login-note">
          Only emails approved by the school administrator can enter the portal.
        </div>
      </div>
    </div>
  );
}
