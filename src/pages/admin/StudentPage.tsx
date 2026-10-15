import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SECTIONS, CONFIG } from "../../lib/config";
import { buildReport, loadSchool, type SchoolData } from "../../lib/data";
import { fmtN } from "../../lib/calc";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I, waLink } from "../../components/Layout";
import { DelayedSkeleton } from "../../components/Skeleton";

export default function StudentPage() {
  const ready = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);

  useEffect(() => { loadSchool().then(setData); }, []);

  if (!ready) return <div className="body"><div className="wrap"><DelayedSkeleton ready={ready} rows={5} /></div></div>;
  if (!data) return <div className="body"><div className="wrap"><DelayedSkeleton ready={!!data} rows={5} /></div></div>;

  const s = data.students.find(x => x.id === id);
  if (!s) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Student not found</div></div></div></div>;

  const sec = SECTIONS.find(x => x.id === s.section);
  const report = buildReport(s, data.assessments, data.marks, data.exams);
  const fee = data.fees.find(f => f.student_id === s.id && f.year === CONFIG.regYear);

  const phoneForRemind = (s.student_phone || s.guardian_phone || "").replace(/[^0-9+]/g, "");

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap-narrow">
          <div className="crumb">
            <Link to="/admin">Students</Link>
            <span>/</span>
            <Link to={`/admin/class/${encodeURIComponent(s.class_name)}`}>{s.class_name}</Link>
            <span>/</span>
            <span className="current">{s.name}</span>
          </div>

          <div className="ph">
            <div className="pav">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
            <div className="pinfo">
              <h1>{s.name}</h1>
              <div className="pmeta">
                <span>Registration <strong>{s.reg_no}</strong></span>
                <span>Class <strong>{s.class_name}</strong></span>
                {s.nin && <span>NIN <strong className="mono">{"•".repeat(7) + s.nin.slice(-4)}</strong></span>}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {report.pending
                  ? <span className="pill pill-warning pill-dot">Provisional</span>
                  : <span className="pill pill-success pill-dot">Complete</span>}
                <span className="pill pill-info">{s.mode === "online" ? "Online" : "Physical"}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {mode === "manage" && (
                <Link className="btn btn-secondary btn-sm" to={`/admin/student/${s.id}/edit`}>
                  {I.plus} Edit
                </Link>
              )}
              <Link className="btn btn-secondary btn-sm" to={`/admin/report/${s.id}`}>
                {I.print} Reports
              </Link>
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
                      <td className="n">{r.assessmentPct != null ? r.assessmentPct.toFixed(1) + "%" : "—"}</td>
                      <td className="n">{r.examPct != null ? r.examPct + "/100" : "—"}</td>
                      <td className="n" style={{ fontWeight: 600, color: "var(--primary)" }}>{r.final != null ? r.final.toFixed(1) + "%" : "—"}</td>
                      <td className="n" style={{ fontFamily: "var(--sans)", fontSize: 12.5 }}>{r.grade.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="summary">
                <div className="it"><div className="l">Semester</div><div className="v">{report.avg != null ? report.avg + "%" : "—"}</div></div>
                <div className="it"><div className="l">Section</div><div className="v">{report.cumulative != null ? report.cumulative + "%" : "—"}</div></div>
                <div className="it"><div className="l">Grade</div><div className="v" style={{ fontSize: 15 }}>{report.results[0]?.grade.label ?? "—"}</div></div>
              </div>
              {report.pending && (
                <div className="notice">
                  Some assessments or the examination have not been recorded. Pending marks count as zero. The average may rise once they are entered.
                </div>
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
                    <span className={"pill pill-dot pill-" + (
                      fee.status === "paid" ? "success" :
                      fee.status === "partial" ? "warning" :
                      fee.status === "scholarship" ? "info" : "danger"
                    )}>
                      {fee.status === "paid" ? "Paid" :
                       fee.status === "partial" ? "Partial" :
                       fee.status === "scholarship" ? "Scholarship" : "Unpaid"}
                    </span>
                    {fee.status !== "paid" && fee.status !== "scholarship" && phoneForRemind && (
                      <a
                        className="btn btn-wa btn-sm"
                        href={waLink(phoneForRemind, `As-salamu alaykum. A reminder about the registration fee for ${s.name} (${s.reg_no}).`)}
                        target="_blank" rel="noopener noreferrer"
                      >
                        {I.whatsapp} Remind
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="sub">No fee on record.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
