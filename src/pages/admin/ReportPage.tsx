import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONFIG, TRANSCRIPT_GROUPS } from "../../lib/config";
import { buildReport, loadSchool, type SchoolData } from "../../lib/data";
import { gradeFor } from "../../lib/calc";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I } from "../../components/Layout";
import { DelayedSkeleton } from "../../components/Skeleton";

type Tab = "semester" | "transcript" | "admission";

export default function ReportPage() {
  const ready = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [tab, setTab] = useState<Tab>("semester");

  useEffect(() => { loadSchool().then(setData); }, []);

  if (!ready) return <div className="body"><div className="wrap"><DelayedSkeleton ready={ready} rows={5} /></div></div>;
  if (!data) return <div className="body"><div className="wrap"><DelayedSkeleton ready={!!data} rows={5} /></div></div>;

  const s = data.students.find(x => x.id === id);
  if (!s) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Student not found</div></div></div></div>;

  const report = buildReport(s, data.assessments, data.marks, data.exams);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function printCurrent() {
    document.body.classList.add("print-" + tab);
    window.print();
    setTimeout(() => document.body.classList.remove("print-" + tab), 400);
  }

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap-narrow" style={{ maxWidth: 1060 }}>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <Link className="btn btn-ghost btn-sm" to={`/admin/student/${s.id}`}>{I.back} Back</Link>
            <button className="btn btn-primary btn-sm" onClick={printCurrent}>{I.print} Print</button>
          </div>

          <div className="chip-line report-tabs no-print" style={{ marginBottom: 20 }}>
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

/* ============================================================ */

function SemesterReport({ s, report, today }: any) {
  const overallGrade = gradeFor(report.pending ? null : report.avg);
  const statusLabel = report.pending ? "Provisional" : "Complete";

  return (
    <div className="report-block semester cert-doc">
      <div className="cert-doc-inner">
        <div className="cert-head-block">
          <img src="/logo.svg" alt="" className="cert-head-logo" />
          <div className="cert-head-school">{CONFIG.name}</div>
          <div className="cert-head-title">Semester Report</div>
          <div className="cert-head-subtitle">{CONFIG.sessionLabel} · First Semester</div>
        </div>

        <div className="cert-fields">
          <div className="f"><div className="fl">Student</div><div className="fv">{s.name}</div></div>
          <div className="f"><div className="fl">Reg. No.</div><div className="fv mono">{s.reg_no}</div></div>
          <div className="f"><div className="fl">Class</div><div className="fv">{s.class_name}</div></div>
          <div className="f"><div className="fl">Mode</div><div className="fv">{s.mode === "online" ? "Online" : "Physical"}</div></div>
          <div className="f"><div className="fl">Academic Section</div><div className="fv">{s.section}</div></div>
          <div className="f"><div className="fl">Session</div><div className="fv">{CONFIG.sessionLabel}</div></div>
          <div className="f"><div className="fl">Date Issued</div><div className="fv">{today}</div></div>
          <div className="f"><div className="fl">Status</div><div className="fv">{statusLabel}</div></div>
        </div>

        <table className="cert-data">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Subject</th>
              <th className="r" style={{ width: "19%" }}>Assessments</th>
              <th className="r" style={{ width: "17%" }}>Exam</th>
              <th className="r" style={{ width: "17%" }}>Final</th>
              <th className="c" style={{ width: "17%" }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {report.results.map((r: any) => {
              const gradeKey = r.grade?.label?.toLowerCase() ?? "";
              return (
                <tr key={r.subject}>
                  <td className="subj">{r.subject}</td>
                  <td className="num">{r.pending ? "Pending" : r.assessmentPct != null ? r.assessmentPct.toFixed(1) + "%" : "—"}</td>
                  <td className="num">{r.examPct != null ? r.examPct + "/100" : "—"}</td>
                  <td className="num strong">{r.pending ? "—" : r.final != null ? r.final.toFixed(1) + "%" : "—"}</td>
                  <td className="grade-cell">
                    {r.pending ? "—" : <span className={"cert-grade " + gradeKey}>{r.grade.code}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="cert-band">
          <div className="cell">
            <div className="cl">Semester Average</div>
            <div className="cv">{report.avg != null ? report.avg.toFixed(1) + "%" : "—"}</div>
          </div>
          <div className="cell">
            <div className="cl">Grade</div>
            <div className="cv small">{overallGrade.code ?? "—"}</div>
          </div>
          <div className="cell">
            <div className="cl">Status</div>
            <div className="cv label-only">{statusLabel}</div>
          </div>
        </div>

        {report.pending && (
          <div className="cert-note">
            Some subjects have pending marks. They will appear on this report once recorded.
          </div>
        )}

        <div className="cert-signs">
          <div className="s">Class Teacher</div>
          <div className="s">Head of School</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */

function Transcript({ s, report, today }: any) {
  const groupName = Object.keys(TRANSCRIPT_GROUPS).find(g => TRANSCRIPT_GROUPS[g].includes(s.class_name)) ?? "Foundation";
  const classesInGroup = TRANSCRIPT_GROUPS[groupName];
  const groupSemesters = report.semesters.filter((g: any) => classesInGroup.includes(g.class_name));

  // Column layout: one class per pair of columns (S1, S2)
  const classCols = classesInGroup.map(cls => ({
    cls,
    short: cls.replace("Thanawiyyah ", "Th ").replace("'", "'"),
  }));
  const totalCols = classCols.length * 2;

  // Fixed column widths
  const subjectWidth = 170;
  const cellWidth = `calc((100% - ${subjectWidth}px) / ${totalCols})`;

  return (
    <div className="report-block transcript cert-doc">
      <div className="cert-doc-inner">
        <div className="cert-head-block">
          <img src="/logo.svg" alt="" className="cert-head-logo" />
          <div className="cert-head-school">{CONFIG.name}</div>
          <div className="cert-head-title">Student Transcript</div>
          <div className="cert-head-subtitle">{groupName}</div>
        </div>

        <div className="cert-fields">
          <div className="f"><div className="fl">Student</div><div className="fv">{s.name}</div></div>
          <div className="f"><div className="fl">Reg. No.</div><div className="fv mono">{s.reg_no}</div></div>
          <div className="f"><div className="fl">Current Class</div><div className="fv">{s.class_name}</div></div>
          <div className="f"><div className="fl">Date Issued</div><div className="fv">{today}</div></div>
        </div>

        {groupSemesters.length === 0 ? (
          <div className="empty" style={{ padding: "40px 0" }}><div className="t">No completed semesters yet</div></div>
        ) : (
          <table className="cert-transcript">
            <colgroup>
              <col style={{ width: subjectWidth }} />
              {Array.from({ length: totalCols }).map((_, i) => (
                <col key={i} style={{ width: cellWidth }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="left" rowSpan={2}>Subject</th>
                {classCols.map(c => (
                  <th key={c.cls} colSpan={2} className="group">{c.short}</th>
                ))}
              </tr>
              <tr>
                {classCols.flatMap(c => ([
                  <th key={`${c.cls}-s1`}>S1</th>,
                  <th key={`${c.cls}-s2`}>S2</th>,
                ]))}
              </tr>
            </thead>
            <tbody>
              {CONFIG.subjects.map(subject => (
                <tr key={subject}>
                  <td className="left">{subject}</td>
                  {classCols.flatMap(c => ([1, 2] as const).map(sem => {
                    const g = groupSemesters.find((x: any) => x.class_name === c.cls && x.semester === sem);
                    const r = g?.results.find((y: any) => y.subject === subject);
                    const v = r && !r.pending ? r.final : null;
                    return <td key={`${c.cls}-${sem}`}>{v != null ? v.toFixed(1) : "—"}</td>;
                  }))}
                </tr>
              ))}
              <tr className="emph-row">
                <td className="left">Average</td>
                {classCols.flatMap(c => ([1, 2] as const).map(sem => {
                  const g = groupSemesters.find((x: any) => x.class_name === c.cls && x.semester === sem);
                  return <td key={`${c.cls}-${sem}`} className="emph">{g?.avg != null ? g.avg.toFixed(1) : "—"}</td>;
                }))}
              </tr>
              <tr className="emph-row">
                <td className="left">Grade</td>
                {classCols.flatMap(c => ([1, 2] as const).map(sem => {
                  const g = groupSemesters.find((x: any) => x.class_name === c.cls && x.semester === sem);
                  return <td key={`${c.cls}-${sem}`} className="emph">{g?.avg != null ? gradeFor(g.avg).code : "—"}</td>;
                }))}
              </tr>
            </tbody>
          </table>
        )}

        <div className="cert-scale">
          <span><b>A</b>Distinction · 75+</span>
          <span><b>B</b>Credit · 60–74</span>
          <span><b>C</b>Pass · 50–59</span>
          <span><b>D</b>Fail · below 50</span>
        </div>

        <div className="cert-signs">
          <div className="s">Class Teacher</div>
          <div className="s">Head of School</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */

function Admission({ s, today }: any) {
  return (
    <div className="report-block admission cert-doc">
      <div className="cert-doc-inner">
        <div className="cert-head-block">
          <img src="/logo.svg" alt="" className="cert-head-logo" />
          <div className="cert-head-school">{CONFIG.name}</div>
          <div className="cert-head-title">Admission Letter</div>
          <div className="cert-head-subtitle">Official Record</div>
        </div>

        <div className="cert-letter">
          <p>
            This is to certify that <strong>{s.name}</strong>, bearing Reg. No.{" "}
            <span className="mono"><strong>{s.reg_no}</strong></span>, was admitted into{" "}
            <strong>{s.class_name}</strong> at {CONFIG.name} as a{" "}
            {s.mode === "online" ? "online" : "physical"} student on{" "}
            <strong>{new Date(s.joined).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.
          </p>
          <p>
            The registration number above is the student's permanent identifier and does not change on promotion,
            repetition, or advancement to a new section.
          </p>
        </div>

        <div className="cert-fields" style={{ marginTop: 28, borderTop: "1px solid var(--line)", borderBottom: "none", paddingTop: 22, paddingBottom: 0 }}>
          <div className="f"><div className="fl">Date Issued</div><div className="fv">{today}</div></div>
          <div className="f"><div className="fl">Status</div><div className="fv">{s.status === "active" ? "Active" : s.status}</div></div>
        </div>

        <div className="cert-signs">
          <div className="s">Registrar</div>
          <div className="s">Head of School</div>
        </div>
      </div>
    </div>
  );
}
