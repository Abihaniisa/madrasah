import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CONFIG, SECTIONS, ALL_CLASSES } from "../../lib/config";
import { loadSchool, type SchoolData } from "../../lib/data";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I, waLink } from "../../components/Layout";
import { DelayedSkeleton } from "../../components/Skeleton";
import { Modal } from "../../components/Modal";
import { Receipt } from "../../components/Receipt";
import { supabase } from "../../lib/supabase";
import { amISuperAdmin } from "../../lib/access";
import { computeFee, fmtNGN, methodLabel, type FeeStatus } from "../../lib/fees";
import type { FeePayment, Student } from "../../lib/types";

export default function FeesPage() {
  const ready = useRequireAuth();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [scope, setScope] = useState<string>("all");
  const [inClass, setInClass] = useState<string | null>(null);
  const [isSuper, setIsSuper] = useState(false);

  async function reload() { setData(await loadSchool()); }
  useEffect(() => {
    loadSchool().then(setData);
    amISuperAdmin().then(setIsSuper);
  }, []);

  if (!ready) return <div className="body"><div className="wrap"><DelayedSkeleton ready={false} rows={5} /></div></div>;
  if (!data) return <div className="body"><div className="wrap"><DelayedSkeleton ready={false} rows={5} /></div></div>;

  if (inClass) {
    return (
      <ClassDetail
        cls={inClass}
        data={data}
        onBack={() => setInClass(null)}
        mode={mode}
        onMode={setMode}
        isSuper={isSuper}
        onRefresh={reload}
      />
    );
  }

  const scopes = [
    { id: "all", label: "All" },
    { id: "foundation", label: "Foundation" },
    { id: "secondary", label: "Secondary" },
    { id: "higher", label: "Higher" },
  ];
  const classesToShow = scope === "all" ? ALL_CLASSES : (SECTIONS.find(s => s.id === scope)?.classes ?? []);

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap">
          <div className="crumb"><Link to="/admin">Portal</Link><span>/</span><span className="current">Fees</span></div>
          <div className="phead">
            <div>
              <h1>Fees</h1>
              <p className="sub">Registration fee · {CONFIG.sessionLabel} · {fmtNGN(CONFIG.registrationFee)} per student</p>
            </div>
          </div>

          <div className="chip-line">
            {scopes.map(sc => (
              <button key={sc.id} className={"chip-f " + (scope === sc.id ? "active" : "")} onClick={() => setScope(sc.id)}>{sc.label}</button>
            ))}
          </div>

          <div className="fee-sum">
            {classesToShow.map(cls => {
              const students = data.students.filter(s => s.class_name === cls);
              if (students.length === 0) return null;
              let paid = 0;
              for (const s of students) {
                const c = computeFee(s.id, data.fees, data.feePayments);
                if (c.status === "paid" || c.status === "scholarship") paid++;
              }
              const unpaid = students.length - paid;
              const tone = unpaid === 0 ? "paid" : paid === 0 ? "due" : "mixed";
              return (
                <button key={cls} className="fee-sum-row" onClick={() => setInClass(cls)}>
                  <div>
                    <div className="cname">{cls}</div>
                    <div className="cmeta">{students.length} students</div>
                  </div>
                  <div className={"stat " + tone}><div className="num">{paid}</div><div className="lbl">Paid</div></div>
                  <div className={"stat " + (unpaid === 0 ? "paid" : "due")}><div className="num">{unpaid}</div><div className="lbl">Unpaid</div></div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */

function ClassDetail({
  cls, data, onBack, mode, onMode, isSuper, onRefresh,
}: {
  cls: string;
  data: SchoolData;
  onBack: () => void;
  mode: "view" | "manage";
  onMode: (m: "view" | "manage") => void;
  isSuper: boolean;
  onRefresh: () => void;
}) {
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [copied, setCopied] = useState(false);

  const students = data.students.filter(s => s.class_name === cls);
  const order: Record<FeeStatus, number> = { unpaid: 0, partial: 1, scholarship: 2, paid: 3 };
  const sorted = [...students].sort((a, b) => {
    const ca = computeFee(a.id, data.fees, data.feePayments).status;
    const cb = computeFee(b.id, data.fees, data.feePayments).status;
    if (order[ca] !== order[cb]) return order[ca] - order[cb];
    return a.name.localeCompare(b.name);
  });

  const unpaidStudents = sorted.filter(s => {
    const st = computeFee(s.id, data.fees, data.feePayments).status;
    return st === "unpaid" || st === "partial";
  });

  async function copyUnpaidPhones() {
    const phones = unpaidStudents
      .map(s => {
        const raw = s.student_phone || s.guardian_phone || "";
        const digits = raw.replace(/[^0-9]/g, "");
        if (!digits) return null;
        return digits.startsWith("234") ? "+" + digits : digits.startsWith("0") ? "+234" + digits.slice(1) : "+234" + digits;
      })
      .filter((p): p is string => !!p);
    if (!phones.length) return;
    const text = phones.join(", ");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div>
      <AdminTop mode={mode} onMode={onMode} />
      <div className="body">
        <div className="wrap">
          <div className="crumb">
            <Link to="/admin">Portal</Link><span>/</span>
            <button onClick={onBack} style={{ color: "inherit", font: "inherit", padding: 0, background: "none", border: 0, cursor: "pointer" }}>Fees</button>
            <span>/</span>
            <span className="current">{cls}</span>
          </div>
          <div className="phead">
            <div>
              <h1>{cls}</h1>
              <p className="sub">{students.length - unpaidStudents.length} paid · {unpaidStudents.length} unpaid · {CONFIG.sessionLabel}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {unpaidStudents.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={copyUnpaidPhones}>
                  {copied ? <>{I.check} Copied</> : <>{I.link} Copy unpaid numbers</>}
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={onBack}>{I.back} All classes</button>
            </div>
          </div>

          {unpaidStudents.length > 0 && (
            <div className="notice" style={{ marginBottom: 12 }}>
              Copy unpaid phone numbers into a WhatsApp Broadcast List to send one reminder to all.
            </div>
          )}

          <div className="card" style={{ overflow: "hidden" }}>
            {sorted.map(s => {
              const c = computeFee(s.id, data.fees, data.feePayments);
              const tone = c.status === "paid" ? "success" : c.status === "partial" ? "warning" : c.status === "scholarship" ? "info" : "danger";
              const label = c.status === "paid" ? "Paid" : c.status === "partial" ? "Partial" : c.status === "scholarship" ? "Scholarship" : "Unpaid";
              const phone = (s.student_phone || s.guardian_phone || "").replace(/[^0-9+]/g, "");
              const showRemind = c.status !== "paid" && c.status !== "scholarship" && phone;
              return (
                <div key={s.id} className="fee-student">
                  <div className="avatar">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
                  <button
                    onClick={() => setActiveStudent(s)}
                    style={{ background: "none", border: 0, textAlign: "left", padding: 0, cursor: "pointer", minWidth: 0 }}
                  >
                    <div className="sname">{s.name}</div>
                    <div className="sid">{s.reg_no}{phone ? ` · ${phone}` : ""}</div>
                  </button>
                  <div className="num">{fmtNGN(c.paid)}<span className="lbl">Paid</span></div>
                  <div className="num" style={{ color: c.balance > 0 ? "var(--warning)" : undefined }}>{fmtNGN(c.balance)}<span className="lbl">Balance</span></div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                    <span className={"pill pill-dot pill-" + tone}>{label}</span>
                    {showRemind && (
                      <a className="btn btn-wa btn-sm" href={waLink(phone, `As-salamu alaykum. A reminder about the registration fee for ${s.name} (${s.reg_no}).`)} target="_blank" rel="noopener noreferrer">
                        {I.whatsapp} Remind
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeStudent && (
        <FeePanel
          student={activeStudent}
          data={data}
          isSuper={isSuper}
          onClose={() => setActiveStudent(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

/* ============================================================ */

function FeePanel({
  student, data, isSuper, onClose, onRefresh,
}: {
  student: Student;
  data: SchoolData;
  isSuper: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const c = computeFee(student.id, data.fees, data.feePayments);
  const [showAdd, setShowAdd] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [amount, setAmount] = useState(String(c.balance || CONFIG.registrationFee));
  const [method, setMethod] = useState<FeePayment["method"]>("cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function addPayment() {
    const n = parseInt(amount, 10);
    if (!n || n <= 0) { setErr("Amount must be greater than 0."); return; }
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("fee_payments").insert({
      student_id: student.id,
      year: CONFIG.regYear,
      amount: n,
      method,
      reference: reference.trim() || null,
      note: note.trim() || null,
      paid_on: paidOn,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setShowAdd(false);
    setAmount(""); setReference(""); setNote("");
    onRefresh();
  }

  async function deletePayment(id: string) {
    await supabase.from("fee_payments").delete().eq("id", id);
    setConfirmDelete(null);
    onRefresh();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ alignItems: "flex-start", paddingTop: 40, overflowY: "auto" }}>
      <div className="modal-card" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div className="d3">{student.name}</div>
            <div className="sub" style={{ marginTop: 3 }}>{student.reg_no} · {student.class_name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>

        <div className="summary" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
          <div className="it"><div className="l">Amount</div><div className="v">{fmtNGN(c.amount)}</div></div>
          <div className="it"><div className="l">Paid</div><div className="v">{fmtNGN(c.paid)}</div></div>
          <div className="it"><div className="l">Balance</div><div className="v">{fmtNGN(c.balance)}</div></div>
        </div>

        <div className="d3" style={{ marginBottom: 8 }}>Payment history</div>
        {c.payments.length === 0 ? (
          <p className="sub" style={{ marginBottom: 16 }}>No payments recorded yet.</p>
        ) : (
          <table className="rt" style={{ fontSize: 13, marginBottom: 16 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Reference</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                {isSuper && <th></th>}
              </tr>
            </thead>
            <tbody>
              {c.payments.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.paid_on).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td>{methodLabel(p.method)}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{p.reference || "—"}</td>
                  <td className="n">{fmtNGN(p.amount)}</td>
                  {isSuper && (
                    <td className="n">
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(p.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!showAdd && (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {c.payments.length > 0 && (
              <button className="btn btn-secondary" onClick={() => setShowReceipt(true)}>{I.print} Print receipt</button>
            )}
            {isSuper && c.status !== "scholarship" && (
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>{I.plus} Record payment</button>
            )}
            {!isSuper && <span className="sub" style={{ alignSelf: "center" }}>Only super admin records payments.</span>}
          </div>
        )}

        {showAdd && (
          <div className="card pad" style={{ background: "var(--muted)" }}>
            <div className="d3" style={{ marginBottom: 12 }}>Record payment</div>
            <div className="stack g3">
              <div className="row g3" style={{ flexWrap: "wrap" }}>
                <div className="field flex1" style={{ minWidth: 140 }}>
                  <label>Amount</label>
                  <input className="input" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
                </div>
                <div className="field flex1" style={{ minWidth: 140 }}>
                  <label>Date</label>
                  <input className="input" type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} />
                </div>
              </div>
              <div className="row g3" style={{ flexWrap: "wrap" }}>
                <div className="field flex1" style={{ minWidth: 160 }}>
                  <label>Method</label>
                  <div className="chip-line" style={{ marginBottom: 0 }}>
                    {(["cash","transfer","pos","other"] as FeePayment["method"][]).map(m => (
                      <button key={m} type="button" className={"chip-f " + (method === m ? "active" : "")} onClick={() => setMethod(m)}>{methodLabel(m)}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Reference <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(optional)</span></label>
                <input className="input" value={reference} onChange={e => setReference(e.target.value)} placeholder="Receipt no., transfer ref., etc." />
              </div>
              <div className="field">
                <label>Note <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(optional)</span></label>
                <input className="input" value={note} onChange={e => setNote(e.target.value)} />
              </div>
              {err && <div className="notice">{err}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setErr(null); }}>Cancel</button>
                <button className="btn btn-primary" disabled={busy} onClick={addPayment}>{busy ? "Saving…" : "Save payment"}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!confirmDelete}
        title="Delete this payment?"
        message="The payment will be removed and the fee balance recalculated."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => confirmDelete && deletePayment(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {showReceipt && (
        <div
          className="modal-backdrop"
          style={{ background: "#fff", alignItems: "flex-start", paddingTop: 20, zIndex: 300 }}
          onClick={() => setShowReceipt(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 660 }}>
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReceipt(false)}>Close</button>
              <button className="btn btn-primary btn-sm" onClick={() => window.print()}>{I.print} Print</button>
            </div>
            <Receipt student={student} payments={c.payments} amount={c.amount} paid={c.paid} balance={c.balance} />
          </div>
        </div>
      )}
    </div>
  );
}
