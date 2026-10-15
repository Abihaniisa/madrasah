import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CONFIG, SECTIONS } from "../../lib/config";
import { buildReport, loadSchool, type SchoolData } from "../../lib/data";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I } from "../../components/Layout";

export default function SheetPage() {
  const ready = useRequireAuth();
  const { cls: clsRaw } = useParams<{ cls: string }>();
  const cls = decodeURIComponent(clsRaw || "");
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);

  useEffect(() => { loadSchool().then(setData); }, []);

  if (!ready) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Checking access…</div></div></div></div>;
  if (!data) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Loading…</div></div></div></div>;

  const sec = SECTIONS.find(s => s.classes.includes(cls));
  const students = [...data.students.filter(s => s.class_name === cls)].sort((a, b) => {
    const ra = buildReport(a, data.assessments, data.marks, data.exams).avg ?? -1;
    const rb = buildReport(b, data.assessments, data.marks, data.exams).avg ?? -1;
    return rb - ra;
  });

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const classAvg = (() => {
    const vals = students.map(s => buildReport(s, data.assessments, data.marks, data.exams).avg).filter((v): v is number => v != null);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
  })();

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap">
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <Link className="btn btn-ghost btn-sm" to={`/admin/class/${encodeURIComponent(cls)}`}>{I.back} Back to class</Link>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>{I.print} Print / Save as PDF</button>
          </div>

          <div className="rc" style={{ maxWidth: 900 }}>
            <div className="rc-head">
              <div className="s">{CONFIG.name}</div>
              <h2>Class Result Sheet</h2>
              <div className="sub" style={{ marginTop: 4, fontSize: 12 }}>{cls} · {CONFIG.sessionLabel} · {CONFIG.semesterLabel}</div>
            </div>

            <table className="rt" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 34 }}>#</th>
                  <th style={{ width: "32%" }}>Student</th>
                  <th>Registration</th>
                  <th style={{ textAlign: "right" }}>Semester</th>
                  <th style={{ textAlign: "right" }}>Cumulative</th>
                  <th style={{ textAlign: "right" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const r = buildReport(s, data.assessments, data.marks, data.exams);
                  const grade = r.results.find(x => x.final != null)?.grade.label ?? "—";
                  return (
                    <tr key={s.id}>
                      <td className="n" style={{ color: "var(--ink-3)" }}>{i + 1}</td>
                      <td className="s">{s.name}</td>
                      <td className="n" style={{ fontSize: 11, fontFamily: "var(--mono)", textAlign: "left" }}>{s.reg_no}</td>
                      <td className="n" style={{ fontWeight: 600 }}>{r.avg != null ? r.avg + "%" : "—"}</td>
                      <td className="n" style={{ fontWeight: 600 }}>{r.avg != null ? r.avg + "%" : "—"}</td>
                      <td className="n" style={{ fontFamily: "var(--sans)", fontSize: 11.5 }}>{grade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="rc-foot">
              <div>Class average: {classAvg != null ? classAvg + "%" : "—"} · {students.length} students · Issued {today}</div>
              <div className="rc-sign">
                <div>Class Teacher</div>
                <div>Head of School</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
