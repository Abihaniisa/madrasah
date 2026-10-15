import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SECTIONS } from "../../lib/config";
import { classAverage, buildReport, loadSchool, type SchoolData } from "../../lib/data";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I } from "../../components/Layout";
import { DelayedSkeleton } from "../../components/Skeleton";
import AssessmentSheet from "../../components/AssessmentSheet";
import ExamSheet from "../../components/ExamSheet";

export default function ClassPage() {
  const ready = useRequireAuth();
  const { cls: clsRaw } = useParams<{ cls: string }>();
  const cls = decodeURIComponent(clsRaw || "");
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [sheet, setSheet] = useState<"none" | "assessment" | "exam">("none");
  const [subject, setSubject] = useState<string | undefined>(undefined);

  useEffect(() => { loadSchool().then(setData); }, []);

  const sec = SECTIONS.find(s => s.classes.includes(cls));

  if (!ready) return <div className="body"><div className="wrap"><DelayedSkeleton ready={false} rows={4} /></div></div>;
  if (!sec) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Class not found</div></div></div></div>;

  const students = data?.students.filter(s => s.class_name === cls) ?? [];
  const avg = data ? classAverage(cls, data.students, data.assessments, data.marks, data.exams) : null;

  function closeSheet() {
    setSheet("none");
    loadSchool().then(setData);
  }

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap">
          <div className="crumb">
            <Link to="/admin">Students</Link>
            <span>/</span>
            <span>{sec.name}</span>
            <span>/</span>
            <span className="current">{cls}</span>
          </div>

          <div className="phead">
            <div>
              <h1>{cls}</h1>
              <p className="sub">
                {students.length} {students.length === 1 ? "student" : "students"} · Class average {avg != null ? avg + "%" : "—"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link className="btn btn-secondary btn-sm" to={`/admin/sheet/${encodeURIComponent(cls)}`}>
                {I.print} Class sheet
              </Link>
              {mode === "manage" && sheet === "none" && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setSubject(undefined); setSheet("assessment"); }}>
                    {I.plus} Enter marks
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => { setSubject(undefined); setSheet("exam"); }}>
                    {I.plus} Enter exam marks
                  </button>
                </>
              )}
            </div>
          </div>

          {!data ? (
            <DelayedSkeleton ready={!!data} rows={6} />
          ) : sheet === "assessment" ? (
            <AssessmentSheet cls={cls} students={students} initialSubject={subject} onClose={closeSheet} />
          ) : sheet === "exam" ? (
            <ExamSheet cls={cls} students={students} initialSubject={subject} onClose={closeSheet} />
          ) : students.length === 0 ? (
            <div className="card"><div className="empty"><div className="t">No students in this class</div></div></div>
          ) : (
            <div className="slist">
              {[...students]
                .sort((a, b) => {
                  if (!data) return a.name.localeCompare(b.name);
                  const ra = buildReport(a, data.assessments, data.marks, data.exams).avg ?? -1;
                  const rb = buildReport(b, data.assessments, data.marks, data.exams).avg ?? -1;
                  return rb - ra;
                })
                .map(s => {
                  const r = data ? buildReport(s, data.assessments, data.marks, data.exams) : null;
                  return (
                    <Link key={s.id} className="srow" to={`/admin/student/${s.id}`} style={{ display: "grid" }}>
                      <div className="avatar">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="name">{s.name}</div>
                        <div className="id">{s.reg_no}</div>
                      </div>
                      <div className="stat-mini">{r?.avg != null ? r.avg + "%" : "—"}</div>
                      <div style={{ color: "var(--ink-4)" }}>{I.arrow}</div>
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
