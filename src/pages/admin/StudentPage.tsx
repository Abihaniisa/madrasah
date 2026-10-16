import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SECTIONS, CONFIG } from "../../lib/config";
import { buildReport, loadSchool, type SchoolData } from "../../lib/data";
import { fmtN } from "../../lib/calc";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I, waLink } from "../../components/Layout";
import { Modal } from "../../components/Modal";
import { supabase } from "../../lib/supabase";

export default function StudentPage() {
  const ready = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [confirmMode, setConfirmMode] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reload() { setData(await loadSchool()); }
  useEffect(() => { loadSchool().then(setData); }, []);

  if (!ready) return <div className="body"><div className="wrap"><div style={{ minHeight: 80 }} /></div></div>;
  if (!data) return <div className="body"><div className="wrap"><div style={{ minHeight: 80 }} /></div></div>;

  const s = data.students.find(x => x.id === id);
  if (!s) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Student not found</div></div></div></div>;

  const report = buildReport(s, data.assessments, data.marks, data.exams);
  const fee = data.fees.find(f => f.student_id === s.id && f.year === CONFIG.regYear);
  const phone = (s.student_phone || s.guardian_phone || "").replace(/[^0-9+]/g, "");

  async function toggleMode() {
    if (mode !== "manage") return;
    setBusy(true);
    await supabase.from("students").update({ mode: s!.mode === "online" ? "physical" : "online" }).eq("id", s!.id);
    await reload();
    setBusy(false);
    setConfirmMode(false);
  }

  const feeTone = !fee ? "neutral" :
    fee.status === "paid" ? "success" :
    fee.status === "partial" ? "warning" :
    fee.status === "scholarship" ? "info" : "danger";
  const feeLabel = !fee ? "No fee" :
    fee.status === "paid" ? "Paid" :
    fee.status === "partial" ? "Partial" :
    fee.status === "scholarship" ? "Scholarship" : "Unpaid";

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap-narrow">
          <div className="crumb">
            <Link to="/admin">Students</Link><span>/</span>
            <Link to={`/admin/class/${encodeURIComponent(s.class_name)}`}>{s.class_name}</Link><span>/</span>
            <span className="current">{s.name}</span>
          </div>

          <div className="ph">
            <div className="pav">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
            <div className="pinfo">
              <h1>{s.name}</h1>
              <div className="pmeta">
                <span>Reg. No. <strong>{s.reg_no}</strong></span>
                <span>Class <strong>{s.class_name}</strong></span>
                {s.nin && <span>NIN <strong className="mono">{"•".repeat(7) + s.nin.slice(-4)}</strong></span>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {report.pending
                  ? <span className="pill pill-warning pill-dot">Pending</span>
                  : report.avg != null
                    ? <span className="pill pill-success pill-dot">{report.avg}%</span>
                    : <span className="pill pill-neutral pill-dot">No results</span>}
                <button type="button" onClick={() => mode === "manage" && setConfirmMode(true)} className="pill pill-info" style={{ cursor: mode === "manage" ? "pointer" : "default", border: 0, font: "inherit", fontFamily: "var(--sans)", fontSize: "11.5px", fontWeight: 500, padding: "2px 9px" }}>
                  {s.mode === "online" ? "Online" : "Physical"}
                </button>
                <span className={"pill pill-dot pill-" + feeTone}>{feeLabel}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {mode === "manage" && (
                <Link className="btn btn-secondary btn-sm" to={`/admin/student/${s.id}/edit`}>{I.plus} Edit</Link>
              )}
              <Link className="btn btn-secondary btn-sm" to={`/admin/report/${s.id}`}>{I.print} Reports</Link>
            </div>
          </div>

          <div className="card mb4" style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 10px" }}>
              <div className="d3">Semester report</div>
              <div className="sub" style={{ marginTop: 2 }}>{CONFIG.sessionLabel} · {CONFIG.semesterLabel}</div>
            </div>
            <div style={{ padding: "0 20px 18px" }}>
              <table className="rt">
                <thead>
                  <tr>
                    <th style={{ width: "34%" }}>Subject</th>
                    <th style={{ width: "16.5%", textAlign: "right" }}>Assessments</th>
                    <th style={{ width: "16.5%", textAlign: "right" }}>Exam</th>
                    <th style={{ width: "16.5%", textAlign: "right" }}>Final</th>
                    <th style={{ width: "16.5%", textAlign: "right" }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map(r => (
                    <tr key={r.subject}>
                      <td className="s">{r.subject}</td>
                      <td className="n">{r.pending ? "Pending" : r.assessmentPct != null ? r.assessmentPct.toFixed(1) + "%" : "—"}</td>
                      <td className="n">{r.examPct != null ? r.examPct + "/100" : "—"}</td>
                      <td className="n" style={{ fontWeight: 600, color: "var(--primary)" }}>{r.pending ? "—" : r.final != null ? r.final.toFixed(1) + "%" : "—"}</td>
                      <td className="n" style={{ fontFamily: "var(--sans)", fontSize: 12.5 }}>{r.pending ? "—" : r.grade.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="summary">
                <div className="it"><div className="l">Semester</div><div className="v">{report.avg != null ? report.avg + "%" : "—"}</div></div>
                <div className="it"><div className="l">Transcript</div><div className="v">{report.cumulative != null ? report.cumulative + "%" : "—"}</div></div>
                <div className="it"><div className="l">Grade</div><div className="v" style={{ fontSize: 15 }}>{report.pending ? "—" : report.results[0]?.grade.code ?? "—"}</div></div>
              </div>
              {report.pending && (
                <div className="notice">Some subjects have pending marks. Those subjects are excluded until the marks are entered.</div>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: "18px 20px" }}>
              <div className="d3" style={{ marginBottom: 10 }}>Fees</div>
              {fee ? (
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "baseline" }}>
                  <div><div className="sub">Amount</div><div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600 }}>{fmtN(fee.amount)}</div></div>
                  <div><div className="sub">Paid</div><div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600 }}>{fmtN(fee.paid)}</div></div>
                  <div><div className="sub">Balance</div><div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: "var(--warning)" }}>{fmtN(fee.amount - fee.paid)}</div></div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={"pill pill-dot pill-" + feeTone}>{feeLabel}</span>
                    {fee.status !== "paid" && fee.status !== "scholarship" && phone && (
                      <a className="btn btn-wa btn-sm" href={waLink(phone, `As-salamu alaykum. A reminder about the registration fee for ${s.name} (${s.reg_no}).`)} target="_blank" rel="noopener noreferrer">
                        {I.whatsapp} Remind
                      </a>
                    )}
                  </div>
                </div>
              ) : <p className="sub">No fee on record.</p>}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={confirmMode}
        title="Change mode?"
        message={s ? `Switch ${s.name} to ${s.mode === "online" ? "Physical" : "Online"}?` : ""}
        confirmLabel="Change"
        onConfirm={toggleMode}
        onCancel={() => setConfirmMode(false)}
      />
    </div>
  );
}
