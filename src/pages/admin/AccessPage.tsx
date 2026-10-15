import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { I } from "../../components/Layout";
import { AdminTop as TopBar } from "../../components/AdminTop";
import {
  listAccess, addAccess, updateExpiry, removeAccess, currentEmail, amISuperAdmin,
  type AccessRow,
} from "../../lib/access";

export default function AccessPage() {
  const ready = useRequireAuth();
  const nav = useNavigate();
  const [mode, setMode] = useMode();
  const [allowed, setAllowed] = useState(false);
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newSuper, setNewSuper] = useState(false);
  const [newExpiry, setNewExpiry] = useState("");

  async function refresh() {
    setRows(await listAccess());
  }

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const isSuper = await amISuperAdmin();
      if (!isSuper) { nav("/admin"); return; }
      setAllowed(true);
      setMe(await currentEmail());
      refresh();
    })();
  }, [ready, nav]);

  if (!ready || !allowed) {
    return <div className="body"><div className="wrap"><div className="empty"><div className="t">Checking access…</div></div></div></div>;
  }

  async function onAdd() {
    const email = newEmail.toLowerCase().trim();
    if (!email) return;
    setBusy(true);
    const { error } = await addAccess(email, newSuper, newExpiry || null);
    setBusy(false);
    if (error) { alert(error.message); return; }
    setNewEmail(""); setNewSuper(false); setNewExpiry("");
    refresh();
  }

  async function onSetExpiry(email: string, value: string) {
    await updateExpiry(email, value || null);
    refresh();
  }

  async function onRemove(email: string) {
    if (!confirm(`Remove ${email}? They will be signed out on their next click.`)) return;
    await removeAccess(email);
    refresh();
  }

  function status(row: AccessRow) {
    if (row.expires_at) {
      const d = new Date(row.expires_at);
      const today = new Date();
      if (d < today) return <span className="pill pill-danger pill-dot">Expired</span>;
      return <span className="pill pill-warning pill-dot">Expires {row.expires_at}</span>;
    }
    return <span className="pill pill-success pill-dot">No expiry</span>;
  }

  return (
    <div>
      <TopBar mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap">
          <div className="crumb">
            <Link to="/admin">Portal</Link>
            <span>/</span>
            <span className="current">Access</span>
          </div>

          <div className="phead">
            <div>
              <h1>Access</h1>
              <p className="sub">Grant and revoke portal access. Only super admins see this page.</p>
            </div>
          </div>

          <div className="card pad mb4">
            <div className="d3" style={{ marginBottom: 12 }}>Add access</div>
            <div className="stack g3">
              <div className="field">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="teacher@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  autoComplete="off"
                />
                <div className="hint">The account must already exist in Supabase Auth. If it does not, create it there first.</div>
              </div>
              <div className="row g3" style={{ flexWrap: "wrap" }}>
                <div className="field flex1" style={{ minWidth: 180 }}>
                  <label>Expires on <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(optional)</span></label>
                  <input
                    className="input"
                    type="date"
                    value={newExpiry}
                    onChange={e => setNewExpiry(e.target.value)}
                  />
                  <div className="hint">Leave blank for permanent access.</div>
                </div>
                <div className="field" style={{ minWidth: 140 }}>
                  <label>Role</label>
                  <div className="chip-line" style={{ marginBottom: 0 }}>
                    <button
                      className={"chip-f " + (!newSuper ? "active" : "")}
                      onClick={() => setNewSuper(false)}
                      type="button"
                    >
                      Admin
                    </button>
                    <button
                      className={"chip-f " + (newSuper ? "active" : "")}
                      onClick={() => setNewSuper(true)}
                      type="button"
                    >
                      Super admin
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={onAdd} disabled={busy || !newEmail}>
                  {busy ? "Adding…" : <>{I.plus} Grant access</>}
                </button>
              </div>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="card"><div className="empty"><div className="t">No one yet</div></div></div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              {rows.map(r => {
                const isMe = r.email === me;
                return (
                  <div
                    key={r.email}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) auto auto auto",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.email} {isMe && <span className="pill pill-info" style={{ marginLeft: 6 }}>you</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                        {r.is_super ? "Super admin" : ""}
                      </div>
                    </div>
                    <div>{status(r)}</div>
                    <div>
                      <input
                        className="input"
                        type="date"
                        value={r.expires_at ?? ""}
                        onChange={e => onSetExpiry(r.email, e.target.value)}
                        style={{ padding: "6px 8px", fontSize: 12.5, width: 140 }}
                      />
                    </div>
                    <div>
                      {isMe ? (
                        <span className="sub" style={{ fontSize: 11.5 }}>Cannot remove self</span>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => onRemove(r.email)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card pad mt4" style={{ background: "var(--muted)" }}>
            <p className="sub" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              Removing someone here locks them out on their next click. Their Supabase Auth account still exists — delete it separately if you want to fully remove them. New users must be created in Supabase Auth first, then added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
