import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CONFIG } from "../lib/config";
import { PublicNav, I } from "../components/Layout";
import { getStudentSession, clearStudentSession, fetchStudentPortal, type StudentPortalData } from "../lib/student";
import { buildReport } from "../lib/data";
import type { Assessment, Exam, Mark, Student } from "../lib/types";

export default function StudentPortal() {
  const nav = useNavigate();
  const [data, setData] = useState<StudentPortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!CONFIG.studentLoginEnabled) { nav("/login"); return; }
    const s = getStudentSession();
    if (!s) { nav("/login"); return; }
    (async () => {
      const res = await fetchStudentPortal(s.nin, s.reg_no);
      if (!res.ok) { clearStudentSession(); nav("/login"); return; }
      setData(res);
      setLoading(false);
    })();
  }, [nav]);

  function signOut() {
    clearStudentSession();
    nav("/login");
  }

  if (loading) return <div className="body"><div className="wrap"><div style={{ minHeight: 80 }} /></div></div>;
  if (!data || !data.student) return null;

  const s = data.student as Student;
  const marks = (data.marks ?? []) as Mark[];
  const exams = (data.exams ?? []) as Exam[];
  const assessments = (data.assessments ?? []) as Assessment[];
  const report = buildReport(s, assessments, marks, exams);

  const payments = data.fee_payments ?? [];
  const amount = CONFIG.registrationFee;
  const paid = payments.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0);
  const balance = Math.max(0, amount - paid);
  const status = paid === 0 ? "Unpaid" : paid >= amount ? "Paid" : "Partial";

  return (
    <div>
      <PublicNav />
      <section className="section">
        <div className="wrap-narrow">
          <div className="ph">
            <div className="pav">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
            <div className="pinfo">
              <h1>{s.name}</h1>
              <div className="pmeta">
                <span>Reg. No. <strong>{s.reg_no}</strong></span>
                <span>Class <strong>{s.class_name}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {report.pending
                  ? <span className="pill pill-warning pill-dot">Pending</span>
                  : report.avg != null
                    ? <span className="pill pill-success pill-dot">{report.avg}%</span>
                    : <span className="pill pill-neutral pill-dot">No results yet</span>}
                <span className="pill pill-info">{s.mode === "online" ? "Online" : "Physical"}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={signOut}>Sign out</button>
          </div>

          <div className="card mb4" style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 10px" }}>
              <div className="d3">My report</div>
              <div className="sub" style={{ marginTop: 2 }}>{CONFIG.sessionLabel} · {CONFIG.semesterLabel}</div>
            </div>
            <div style={{ padding: "0 20px 18px" }}>
              <table className="rt">
                <thead>
                  <tr>
                    <th style={{ width: "34%" }}>Subject</th>
                    <th style={{ width: "22%", textAlign: "right" }}>Assessments</th>
                    <th style={{ width: "22%", textAlign: "right" }}>Exam</th>
                    <th style={{ width: "22%", textAlign: "right" }}>Final</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map(r => (
                    <tr key={r.subject}>
                      <td className="s">{r.subject}</td>
                      <td className="n">{r.pending ? "Pending" : r.assessmentPct != null ? r.assessmentPct.toFixed(1) + "%" : "—"}</td>
                      <td className="n">{r.examPct != null ? r.examPct + "/100" : "—"}</td>
                      <td className="n" style={{ fontWeight: 600, color: "var(--primary)" }}>{r.pending ? "—" : r.final != null ? r.final.toFixed(1) + "%" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="summary">
                <div className="it"><div className="l">Semester</div><div className="v">{report.avg != null ? report.avg + "%" : "—"}</div></div>
                <div className="it"><div className="l">Grade</div><div className="v" style={{ fontSize: 15 }}>{report.pending ? "—" : report.results[0]?.grade.code ?? "—"}</div></div>
                <div className="it"><div className="l">Status</div><div className="v sm">{report.pending ? "Pending" : "Complete"}</div></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ padding: "18px 20px" }}>
              <div className="d3" style={{ marginBottom: 10 }}>Fees</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "baseline" }}>
                <div><div className="sub">Amount</div><div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600 }}>₦{amount.toLocaleString("en-NG")}</div></div>
                <div><div className="sub">Paid</div><div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600 }}>₦{paid.toLocaleString("en-NG")}</div></div>
                <div><div className="sub">Balance</div><div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: "var(--warning)" }}>₦{balance.toLocaleString("en-NG")}</div></div>
                <div style={{ marginLeft: "auto" }}>
                  <span className={"pill pill-dot pill-" + (status === "Paid" ? "success" : status === "Partial" ? "warning" : "danger")}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Link className="btn btn-ghost btn-sm" to="/">{I.back} Public site</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
