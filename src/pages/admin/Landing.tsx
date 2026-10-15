import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SECTIONS } from "../../lib/config";
import { classAverage, loadSchool, type SchoolData } from "../../lib/data";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { I } from "../../components/Layout";

export default function Landing() {
  const ready = useRequireAuth();
  const nav = useNavigate();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<{ cls: string; subject: string } | null>(null);

  useEffect(() => {
    loadSchool().then(setData);
    const r = localStorage.getItem("madrasah.recent");
    if (r) setRecent(JSON.parse(r));
  }, []);

  const matches = useMemo(() => {
    if (!data || !q.trim()) return null;
    const needle = q.toLowerCase().trim();
    return data.students
      .filter(s =>
        s.name.toLowerCase().includes(needle) ||
        s.reg_no.toLowerCase().includes(needle) ||
        s.class_name.toLowerCase().includes(needle)
      )
      .slice(0, 40);
  }, [data, q]);

  if (!ready) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Checking access…</div></div></div></div>;

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap">
          <div className="phead">
            <div>
              <h1>Students</h1>
              <p className="sub">Browse by section and class, or search directly.</p>
            </div>
            <div className="search">
              <span className="icon">{I.search}</span>
              <input
                placeholder="Search by name, registration, or class"
                value={q}
                onChange={e => setQ(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {recent && !q && (
            <button
              className="recent"
              style={{ width: "100%", textAlign: "left" }}
              onClick={() => nav(`/admin/class/${encodeURIComponent(recent.cls)}`)}
            >
              <div className="icon-wrap">▸</div>
              <div className="txt">
                <div className="l">Continue</div>
                <div className="v">{recent.cls} · {recent.subject}</div>
              </div>
            </button>
          )}

          {matches && (
            <div className="slist" style={{ marginTop: 8 }}>
              {matches.length === 0 ? (
                <div className="empty">
                  <div className="t">No matches</div>
                  <div className="d">Try a different name, registration number, or class.</div>
                </div>
              ) : (
                matches.map(s => (
                  <Link key={s.id} className="srow" to={`/admin/student/${s.id}`} style={{ display: "grid" }}>
                    <div className="avatar">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="name">{s.name}</div>
                      <div className="id">{s.reg_no} · {s.class_name}</div>
                    </div>
                    <div className="stat-mini">—</div>
                    <div style={{ color: "var(--ink-4)" }}>{I.arrow}</div>
                  </Link>
                ))
              )}
            </div>
          )}

          {!q && data && (
            <div>
              {SECTIONS.map(sec => {
                const secStudents = data.students.filter(s => s.section === sec.id);
                return (
                  <div key={sec.id} className="sec-block">
                    <div className="sec-head">
                      <h2>
                        {sec.name}
                        {sec.inactive && <span className="pill pill-neutral" style={{ marginLeft: 8 }}>Opening soon</span>}
                      </h2>
                      <span className="meta">{secStudents.length} {secStudents.length === 1 ? "student" : "students"}</span>
                    </div>
                    <div className="class-list">
                      {sec.classes.map(c => {
                        const count = data.students.filter(s => s.class_name === c).length;
                        const avg = sec.inactive ? null : classAverage(c, data.students, data.assessments, data.marks, data.exams);
                        if (sec.inactive) {
                          return (
                            <div key={c} className="crow" style={{ opacity: 0.55, cursor: "default" }}>
                              <div><div className="cname">{c}</div><div className="cmeta">Not yet active</div></div>
                              <div className="stats-cell"><div className="cnt">—</div><div className="lbl">Students</div></div>
                              <div className="stats-cell"><div className="cnt">—</div><div className="lbl">Average</div></div>
                              <div />
                            </div>
                          );
                        }
                        return (
                          <Link key={c} className="crow" to={`/admin/class/${encodeURIComponent(c)}`} style={{ display: "grid" }}>
                            <div><div className="cname">{c}</div><div className="cmeta">{sec.name}</div></div>
                            <div className="stats-cell"><div className="cnt">{count}</div><div className="lbl">Students</div></div>
                            <div className="stats-cell"><div className="cnt">{avg != null ? avg + "%" : "—"}</div><div className="lbl">Average</div></div>
                            <div style={{ color: "var(--ink-4)" }}>{I.arrow}</div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!q && !data && (
            <div className="card"><div className="empty"><div className="t">Loading…</div></div></div>
          )}
        </div>
      </div>
    </div>
  );
}
