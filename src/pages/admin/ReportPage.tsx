import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONFIG, TRANSCRIPT_GROUPS } from "../../lib/config";
import { buildReport, loadSchool, type SchoolData } from "../../lib/data";
import { gradeFor } from "../../lib/calc";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I } from "../../components/Layout";

type Tab = "semester" | "transcript" | "admission";

export default function ReportPage() {
  const ready = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [tab, setTab] = useState<Tab>("semester");

  useEffect(() => { loadSchool().then(setData); }, []);

  if (!ready) return <div className="body"><div className="wrap"><div style={{ minHeight: 80 }} /></div></div>;
  if (!data) return <div className="body"><div className="wrap"><div style={{ minHeight: 80 }} /></div></div>;

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
            <button className="btn btn-primary btn-sm" onClick={printCurrent}>{I.print} Print</button>
          </div>

          <div className="chip-line report-tabs no-print">
            <button className={"chip-f " + (tab === "semester" ? "active" : "")} onClick={() => setTab("semester")}>Semester</button>
            <button className={"chip-f " + (tab === "transcript" ? "active" : "")} onClick={() => setTab("transcript")}>Transcript</button>
            <button className={"chip-f " + (tab === "admission" ? "active" : "")} onClick={() => setTab("admission")}>Admission</button>
          </div>

          {tab === "semester" && <SemesterReport s={s} report={report} today={today} />}
          {tab === "transcript" && <Transcript s={s} report={report} today={today} />}
          {tab === "admission" && <Admission s={s} today={today} />}
        </div>
      </div>
    </div>
  );
}

function SemesterReport({ s, report, today }: any) {
  return (
    <div className="report-block semester rc-landscape">
      <div className="rc-head">
        <div className="s">{CONFIG.name}</div>
        <h2>Semester Report</h2>
      </div>

      <div className="rc-meta-4">
        <div><span className="k">Academic Section</span><span className="v">{s.section}</span></div>
        <div><span className="k">Session</span><span className="v">{CONFIG.sessionLabel}</span></div>
        <div><span className="k">Semester</span><span className="v">{CONFIG.semesterLabel}</span></div>
        <div><span className="k">Class</span><span className="v">{s.class_name}</span></div>
        <div><span className="k">Reg. No.</span><span className="v mono">{s.reg_no}</span></div>
        <div><span className="k">Name</span><span className="v">{s.name}</span></div>
        <div><span className="k">Mode</span><span className="v">{s.mode === "online" ? "Online" : "Physical"}</span></div>
        <div><span className="k">Date Issued</span><span className="v">{today}</span></div>
      </div>

      <table className="rt table-land">
        <thead>
          <tr>
            <th style={{ width: "22%" }}>Subject</th>
            <th style={{ textAlign: "right" }}>Assessments</th>
            <th style={{ textAlign: "right" }}>Exam</th>
            <th style={{ textAlign: "right" }}>Final</th>
            <th style={{ textAlign: "right" }}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {report.results.map((r: any) => (
            <tr key={r.subject}>
              <td className="s">{r.subject}</td>
              <td className="n">{r.pending ? "Pending" : r.assessmentPct != null ? r.assessmentPct.toFixed(1) + "%" : "—"}</td>
              <td className="n">{r.examPct != null ? r.examPct + "/100" : "—"}</td>
              <td className="n" style={{ fontWeight: 600 }}>{r.pending ? "—" : r.final != null ? r.final.toFixed(1) + "%" : "—"}</td>
              <td className="n">{r.pending ? "—" : r.grade.code}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rc-sum-land">
        <div className="it"><div className="l">Semester Average</div><div className="v">{report.avg != null ? report.avg + "%" : "—"}</div></div>
        <div className="it"><div className="l">Grade</div><div className="v">{report.pending ? "—" : gradeFor(report.avg).code}</div></div>
        <div className="it"><div className="l">Status</div><div className="v" style={{ fontSize: 14 }}>{report.pending ? "Pending" : "Complete"}</div></div>
      </div>

      {report.pending && (
        <div className="rc-warn">Pending marks exist. Those subjects are excluded until the marks are entered.</div>
      )}

      <div className="rc-foot">
        <div className="rc-sign">
          <div>Class Teacher</div>
          <div>Head of School</div>
        </div>
      </div>
    </div>
  );
}

function Transcript({ s, report, today }: any) {
  const groupName = Object.keys(TRANSCRIPT_GROUPS).find(g => TRANSCRIPT_GROUPS[g].includes(s.class_name)) ?? "Foundation";
  const classesInGroup = TRANSCRIPT_GROUPS[groupName];
  const groupSemesters = report.semesters.filter((g: any) => classesInGroup.includes(g.class_name));

  const semesterKeys: { key: string; label: string }[] = [];
  for (const cls of classesInGroup) {
    semesterKeys.push({ key: `${cls}|1`, label: `${cls} — Sem 1` });
    semesterKeys.push({ key: `${cls}|2`, label: `${cls} — Sem 2` });
  }

  return (
    <div className="report-block transcript rc-landscape">
      <div className="rc-head">
        <div className="s">{CONFIG.name}</div>
        <h2>Student Transcript · {groupName}</h2>
      </div>

      <div className="rc-meta-4">
        <div><span className="k">Name</span><span className="v">{s.name}</span></div>
        <div><span className="k">Reg. No.</span><span className="v mono">{s.reg_no}</span></div>
        <div><span className="k">Current Class</span><span className="v">{s.class_name}</span></div>
        <div><span className="k">Date</span><span className="v">{today}</span></div>
      </div>

      {groupSemesters.length === 0 ? (
        <div className="empty"><div className="t">No completed semesters yet</div></div>
      ) : (
        <table className="rt table-land transcript-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>Subject</th>
              {semesterKeys.map(k => <th key={k.key} style={{ textAlign: "right", fontSize: 10 }}>{k.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {CONFIG.subjects.map(subject => (
              <tr key={subject}>
                <td className="s">{subject}</td>
                {semesterKeys.map(k => {
                  const g = groupSemesters.find((x: any) => `${x.class_name}|${x.semester}` === k.key);
                  const r = g?.results.find((y: any) => y.subject === subject);
                  const v = r && !r.pending ? r.final : null;
                  return <td key={k.key} className="n">{v != null ? v.toFixed(1) : "—"}</td>;
                })}
              </tr>
            ))}
            <tr style={{ background: "var(--muted)" }}>
              <td className="s">Average</td>
              {semesterKeys.map(k => {
                const g = groupSemesters.find((x: any) => `${x.class_name}|${x.semester}` === k.key);
                return <td key={k.key} className="n" style={{ fontWeight: 600 }}>{g?.avg != null ? g.avg.toFixed(1) : "—"}</td>;
              })}
            </tr>
            <tr style={{ background: "var(--muted)" }}>
              <td className="s">Grade</td>
              {semesterKeys.map(k => {
                const g = groupSemesters.find((x: any) => `${x.class_name}|${x.semester}` === k.key);
                return <td key={k.key} className="n">{g?.avg != null ? gradeFor(g.avg).code : "—"}</td>;
              })}
            </tr>
          </tbody>
        </table>
      )}

      <div className="rc-scale">
        <div><strong>A</strong> · Distinction · 75+</div>
        <div><strong>B</strong> · Credit · 60–74</div>
        <div><strong>C</strong> · Pass · 50–59</div>
        <div><strong>D</strong> · Fail · below 50</div>
      </div>

      <div className="rc-foot">
        <div className="rc-sign">
          <div>Class Teacher</div>
          <div>Head of School</div>
        </div>
      </div>
    </div>
  );
}

function Admission({ s, today }: any) {
  return (
    <div className="report-block admission rc">
      <div className="rc-head">
        <div className="s">{CONFIG.name}</div>
        <h2>Admission Letter</h2>
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.8, color: "var(--ink-2)", margin: "18px 0" }}>
        This is to certify that <strong style={{ color: "var(--ink)" }}>{s.name}</strong>, bearing Reg. No.{" "}
        <span className="mono"><strong>{s.reg_no}</strong></span>, was admitted into{" "}
        <strong style={{ color: "var(--ink)" }}>{s.class_name}</strong> at {CONFIG.name} as a{" "}
        {s.mode === "online" ? "online" : "physical"} student on{" "}
        <strong style={{ color: "var(--ink)" }}>{new Date(s.joined).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.
      </p>
      <p style={{ fontSize: 13.5, lineHeight: 1.8, color: "var(--ink-2)", margin: "0 0 26px" }}>
        The registration number above is the student's permanent identifier and does not change on promotion, repetition, or advancement to a new section.
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
  );
}
