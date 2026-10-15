import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONFIG } from "../../lib/config";
import { buildReport, loadSchool, type SchoolData } from "../../lib/data";
import { gradeFor } from "../../lib/calc";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I } from "../../components/Layout";
import { DelayedSkeleton } from "../../components/Skeleton";

type Tab = "semester" | "section" | "transcript" | "admission";

export default function ReportPage() {
  const ready = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [tab, setTab] = useState<Tab>("semester");

  useEffect(() => { loadSchool().then(setData); }, []);

  if (!ready) return <div className="body"><div className="wrap"><DelayedSkeleton ready={!!data} rows={5} /></div></div>;
  if (!data) return <div className="body"><div className="wrap"><DelayedSkeleton ready={!!data} rows={5} /></div></div>;

  const s = data.students.find(x => x.id === id);
  if (!s) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Student not found</div></div></div></div>;

  const report = buildReport(s, data.assessments, data.marks, data.exams);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function printCurrent() {
    document.body.classList.add("print-" + tab);
    window.print();
    setTimeout(() => document.body.classList.remove("print-" + tab), 300);
  }

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body report-shell">
        <div className="wrap">
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <Link className="btn btn-ghost btn-sm" to={`/admin/student/${s.id}`}>{I.back} Back</Link>
            <button className="btn btn-primary btn-sm" onClick={printCurrent}>{I.print} Print this page</button>
          </div>

          <div className="chip-line report-tabs no-print">
            <button className={"chip-f " + (tab === "semester" ? "active" : "")} onClick={() => setTab("semester")}>Semester</button>
            <button className={"chip-f " + (tab === "section" ? "active" : "")} onClick={() => setTab("section")}>Section</button>
            <button className={"chip-f " + (tab === "transcript" ? "active" : "")} onClick={() => setTab("transcript")}>Transcript</button>
            <button className={"chip-f " + (tab === "admission" ? "active" : "")} onClick={() => setTab("admission")}>Admission</button>
          </div>

          {tab === "semester" && (
            <div className="report-block semester">
              <div className="rc">
                <div className="rc-head">
                  <div className="s">{CONFIG.name}</div>
                  <h2>Semester Report Card</h2>
                  <div className="sub" style={{ marginTop: 4, fontSize: 12 }}>{CONFIG.sessionLabel} · {CONFIG.semesterLabel}</div>
                </div>
                <div className="rc-meta">
                  <div className="r"><span className="k">Student</span><span className="v">{s.name}</span></div>
                  <div className="r"><span className="k">Registration</span><span className="v mono">{s.reg_no}</span></div>
                  <div className="r"><span className="k">Class</span><span className="v">{s.class_name}</span></div>
                  <div className="r"><span className="k">Date issued</span><span className="v">{today}</span></div>
                </div>
                <table className="rt">
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>Subject</th>
                      <th style={{ width: "20%", textAlign: "right" }}>Assessments</th>
                      <th style={{ width: "18%", textAlign: "right" }}>Exam</th>
                      <th style={{ width: "18%", textAlign: "right" }}>Final</th>
                      <th style={{ width: "14%", textAlign: "right" }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.results.map(r => (
                      <tr key={r.subject}>
                        <td className="s">{r.subject}</td>
                        <td className="n">{r.assessmentPct != null ? r.assessmentPct.toFixed(1) + "%" : "—"}</td>
                        <td className="n">{r.examPct != null ? r.examPct + "/100" : "—"}</td>
                        <td className="n" style={{ fontWeight: 600 }}>{r.final != null ? r.final.toFixed(1) + "%" : "—"}</td>
                        <td className="n" style={{ fontFamily: "var(--sans)", fontSize: 12.5 }}>{r.grade.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rc-sum">
                  <div className="it"><div className="l">Semester Average</div><div className="v">{report.avg != null ? report.avg + "%" : "—"}</div></div>
                  <div className="it"><div className="l">Grade</div><div className="v">{gradeFor(report.avg).label}</div></div>
                  <div className="it"><div className="l">Status</div><div className="v" style={{ fontSize: 14 }}>{report.pending ? "Provisional" : "Complete"}</div></div>
                </div>
                {report.pending && (
                  <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--warning-soft)", border: "1px solid #E8D4A8", borderRadius: "var(--r-2)", fontSize: 11.5, color: "#6B4410", lineHeight: 1.55 }}>
                    Some assessments or the examination have not been recorded. Pending marks count as zero. The average may rise once they are entered.
                  </div>
                )}
                <div className="rc-foot">
                  <div>Assessments contribute 30%. Examination contributes 70%. This report is the official semester record for the named student.</div>
                  <div className="rc-sign">
                    <div>Class Teacher</div>
                    <div>Head of School</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "section" && (
            <div className="report-block section">
              <div className="rc">
                <div className="rc-head">
                  <div className="s">{CONFIG.name}</div>
                  <h2>Section Report</h2>
                  <div className="sub" style={{ marginTop: 4, fontSize: 12 }}>Cumulative across all completed semesters</div>
                </div>
                <div className="rc-meta">
                  <div className="r"><span className="k">Student</span><span className="v">{s.name}</span></div>
                  <div className="r"><span className="k">Registration</span><span className="v mono">{s.reg_no}</span></div>
                  <div className="r"><span className="k">Current class</span><span className="v">{s.class_name}</span></div>
                  <div className="r"><span className="k">Date issued</span><span className="v">{today}</span></div>
                </div>
                <table className="rt">
                  <thead>
                    <tr>
                      <th style={{ width: "60%" }}>Subject</th>
                      <th style={{ width: "20%", textAlign: "right" }}>Cumulative</th>
                      <th style={{ width: "20%", textAlign: "right" }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONFIG.subjects.map(subject => {
                      const v = report.cumulativeBySubject[subject] ?? null;
                      const g = gradeFor(v);
                      return (
                        <tr key={subject}>
                          <td className="s">{subject}</td>
                          <td className="n" style={{ fontWeight: 600 }}>{v != null ? v.toFixed(1) + "%" : "—"}</td>
                          <td className="n" style={{ fontFamily: "var(--sans)", fontSize: 12.5 }}>{g.label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="rc-sum">
                  <div className="it"><div className="l">Section Average</div><div className="v">{report.cumulative != null ? report.cumulative + "%" : "—"}</div></div>
                  <div className="it"><div className="l">Grade</div><div className="v">{gradeFor(report.cumulative).label}</div></div>
                  <div className="it"><div className="l">Semesters counted</div><div className="v" style={{ fontSize: 15 }}>{report.semesters.length}</div></div>
                </div>
                <div className="rc-foot">
                  <div>Section average is the mean of every completed semester average. Daura results are separate and not included.</div>
                  <div className="rc-sign">
                    <div>Class Teacher</div>
                    <div>Head of School</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "transcript" && (
            <div className="report-block transcript">
              <div className="rc">
                <div className="rc-head">
                  <div className="s">{CONFIG.name}</div>
                  <h2>Academic Transcript</h2>
                  <div className="sub" style={{ marginTop: 4, fontSize: 12 }}>All completed semesters, in order</div>
                </div>
                <div className="rc-meta">
                  <div className="r"><span className="k">Student</span><span className="v">{s.name}</span></div>
                  <div className="r"><span className="k">Registration</span><span className="v mono">{s.reg_no}</span></div>
                </div>

                {report.semesters.length === 0 && (
                  <div className="empty"><div className="t">No completed semesters yet</div></div>
                )}

                {report.semesters.map(g => (
                  <div key={g.key} style={{ marginBottom: 22 }}>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 600, color: "var(--primary)", marginBottom: 8 }}>
                      {g.class_name} · {g.session_label} · Semester {g.semester}
                    </div>
                    <table className="rt" style={{ fontSize: 12.5 }}>
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th style={{ textAlign: "right" }}>Assessments</th>
                          <th style={{ textAlign: "right" }}>Exam</th>
                          <th style={{ textAlign: "right" }}>Final</th>
                          <th style={{ textAlign: "right" }}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.results.map(r => (
                          <tr key={r.subject}>
                            <td className="s">{r.subject}</td>
                            <td className="n">{r.assessmentPct != null ? r.assessmentPct.toFixed(1) + "%" : "—"}</td>
                            <td className="n">{r.examPct != null ? r.examPct + "/100" : "—"}</td>
                            <td className="n" style={{ fontWeight: 600 }}>{r.final != null ? r.final.toFixed(1) + "%" : "—"}</td>
                            <td className="n" style={{ fontFamily: "var(--sans)", fontSize: 11.5 }}>{r.grade.label}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ textAlign: "right", fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>
                      Semester average: <strong style={{ color: "var(--ink)" }}>{g.avg != null ? g.avg + "%" : "—"}</strong>
                    </div>
                  </div>
                ))}

                {report.semesters.length > 0 && (
                  <div className="rc-sum">
                    <div className="it"><div className="l">Section Average</div><div className="v">{report.cumulative != null ? report.cumulative + "%" : "—"}</div></div>
                    <div className="it"><div className="l">Grade</div><div className="v">{gradeFor(report.cumulative).label}</div></div>
                    <div className="it"><div className="l">Semesters</div><div className="v" style={{ fontSize: 15 }}>{report.semesters.length}</div></div>
                  </div>
                )}

                <div className="rc-foot">
                  <div className="rc-sign">
                    <div>Class Teacher</div>
                    <div>Head of School</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "admission" && (
            <div className="report-block admission">
              <div className="rc">
                <div className="rc-head">
                  <div className="s">{CONFIG.name}</div>
                  <h2>Admission Letter</h2>
                  <div className="sub" style={{ marginTop: 4, fontSize: 12 }}>Official record of admission</div>
                </div>

                <p style={{ fontSize: 13.5, lineHeight: 1.8, color: "var(--ink-2)", marginBottom: 18 }}>
                  This is to certify that <strong style={{ color: "var(--ink)" }}>{s.name}</strong>, bearing the registration number{" "}
                  <span className="mono"><strong>{s.reg_no}</strong></span>, was admitted into{" "}
                  <strong style={{ color: "var(--ink)" }}>{s.class_name}</strong> at {CONFIG.name} as a{" "}
                  {s.mode === "online" ? "online" : "physical"} student on{" "}
                  <strong style={{ color: "var(--ink)" }}>{new Date(s.joined).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                </p>

                <p style={{ fontSize: 13.5, lineHeight: 1.8, color: "var(--ink-2)", marginBottom: 26 }}>
                  This letter is issued on the date below and remains a permanent record of admission. The registration number above is the student's identifier throughout their time at this school and does not change on promotion, repetition, or advancement to a new section.
                </p>

                <div className="rc-meta" style={{ marginTop: 12, borderTop: "1px solid var(--line)", borderBottom: "none", paddingTop: 14 }}>
                  <div className="r"><span className="k">Date issued</span><span className="v">{today}</span></div>
                  <div className="r"><span className="k">Status</span><span className="v">{s.status === "active" ? "Active" : s.status}</span></div>
                </div>

                <div className="rc-foot">
                  <div className="rc-sign">
                    <div>Registrar</div>
                    <div>Head of School</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
