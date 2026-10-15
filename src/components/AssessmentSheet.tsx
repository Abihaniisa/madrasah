import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { CONFIG } from "../lib/config";
import { amISuperAdmin } from "../lib/access";
import type { Assessment, Mark, Student } from "../lib/types";

type Props = {
  cls: string;
  students: Student[];
  initialSubject?: string;
  onClose: () => void;
};

export default function AssessmentSheet({ cls, students, initialSubject, onClose }: Props) {
  const [subject, setSubject] = useState<string>(initialSubject || CONFIG.subjects[0]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, number | null>>({});
  const [ready, setReady] = useState(false);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => { amISuperAdmin().then(setIsSuper); }, []);

  async function load() {
    setReady(false);
    const { data } = await supabase
      .from("assessments")
      .select("*")
      .eq("class_name", cls)
      .eq("subject", subject)
      .order("created_at");
    const list = (data as Assessment[]) ?? [];
    setAssessments(list);
    const last = list[list.length - 1];
    setActiveId(last?.id ?? null);
    if (!last) { setMarks({}); setReady(true); return; }
    const { data: mData } = await supabase.from("marks").select("*").eq("assessment_id", last.id);
    const map: Record<string, number | null> = {};
    for (const m of (mData as Mark[]) ?? []) map[m.student_id] = m.value;
    setMarks(map);
    setReady(true);
  }

  useEffect(() => { load(); }, [cls, subject]);

  async function loadMarksFor(id: string) {
    setReady(false);
    const { data } = await supabase.from("marks").select("*").eq("assessment_id", id);
    const map: Record<string, number | null> = {};
    for (const m of (data as Mark[]) ?? []) map[m.student_id] = m.value;
    setMarks(map);
    setActiveId(id);
    setReady(true);
  }

  const active = assessments.find(a => a.id === activeId) || null;
  const sorted = useMemo(() => [...students].sort((a, b) => a.name.localeCompare(b.name)), [students]);
  const recordedCount = useMemo(() => sorted.filter(s => marks[s.id] != null).length, [sorted, marks]);

  async function addNew() {
    const label = "Assessment " + (assessments.length + 1);
    const { data, error } = await supabase
      .from("assessments")
      .insert({
        class_name: cls,
        subject,
        label,
        max_marks: CONFIG.assessmentMax,
        session_label: CONFIG.sessionLabel,
        semester: 1,
      })
      .select()
      .single();
    if (error || !data) return;
    const a = data as Assessment;
    setAssessments(prev => [...prev, a]);
    setActiveId(a.id);
    setMarks({});
  }

  async function deleteActive() {
    if (!active || !isSuper) return;
    const ok = window.confirm(
      `Delete "${active.label}" for ${cls} — ${subject}?\n\nThis will permanently remove all ${sorted.length} student marks recorded for this assessment.`
    );
    if (!ok) return;
    await supabase.from("assessments").delete().eq("id", active.id);
    await load();
  }

  async function commitMark(sid: string, value: number | null) {
    if (!active) return;
    await supabase.from("marks").upsert(
      { assessment_id: active.id, student_id: sid, value },
      { onConflict: "assessment_id,student_id" }
    );
  }

  function onInput(sid: string, raw: string) {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 3);
    const max = active?.max_marks ?? CONFIG.assessmentMax;
    let num: number | null = digits === "" ? null : parseInt(digits, 10);
    if (num != null && num > max) num = max;
    setMarks(prev => ({ ...prev, [sid]: num }));
  }

  async function onBlur(sid: string) {
    await commitMark(sid, marks[sid] ?? null);
  }

  function jump() {
    const el = document.querySelector(".asheet-body .arow.pending input.mark") as HTMLInputElement | null;
    if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => el.focus(), 260); }
  }

  function filter(q: string) {
    const v = q.toLowerCase().trim();
    document.querySelectorAll<HTMLElement>(".asheet-body .arow").forEach(r => {
      r.style.display = !v || (r.dataset.name ?? "").includes(v) ? "" : "none";
    });
  }

  if (!ready && assessments.length === 0) {
    return <div className="asheet"><div className="empty"><div className="t">Loading…</div></div></div>;
  }

  if (!active) {
    return (
      <div className="asheet">
        <div className="asheet-head">
          <div className="row1">
            <select className="input" style={{ maxWidth: 200 }} value={subject} onChange={e => setSubject(e.target.value)}>
              {CONFIG.subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="empty" style={{ padding: "44px 20px" }}>
          <div className="t">No assessments yet</div>
          <div className="d" style={{ marginBottom: 14 }}>
            Create the first assessment for {subject} — {cls}. Marks are out of {CONFIG.assessmentMax}.
          </div>
          <button className="btn btn-primary" onClick={addNew}>Create Assessment 1</button>
        </div>
        <div className="asheet-foot">
          <div />
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="asheet">
      <div className="asheet-head">
        <div className="row1">
          <div className="chips">
            <select className="input" style={{ maxWidth: 150 }} value={subject} onChange={e => setSubject(e.target.value)}>
              {CONFIG.subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {assessments.map(a => (
              <button
                key={a.id}
                className={"chip-a " + (a.id === activeId ? "active" : "")}
                onClick={() => loadMarksFor(a.id)}
              >
                {a.label}
              </button>
            ))}
            <button className="chip-a add" onClick={addNew}>+ New</button>
            {isSuper && (
              <button
                className="chip-a"
                onClick={deleteActive}
                title="Delete this assessment"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
              >
                Delete
              </button>
            )}
          </div>
          <div className="sub" style={{ fontSize: 12, marginLeft: "auto" }}>
            Out of <strong>{active.max_marks}</strong>
          </div>
        </div>
      </div>

      <div className="asheet-sub">
        <div className="search" style={{ maxWidth: 260 }}>
          <input placeholder="Find a student" onChange={e => filter(e.target.value)} />
        </div>
        <button className="jump" onClick={jump}>Jump to first pending</button>
        <div className="prog"><span className="num">{recordedCount}</span> of {sorted.length} recorded</div>
      </div>

      <div className="asheet-body">
        {sorted.map(s => {
          const v = marks[s.id];
          const filled = v != null;
          return (
            <div key={s.id} className={"arow " + (filled ? "recorded" : "pending")} data-name={s.name.toLowerCase()}>
              <div className="avatar">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
              <div style={{ minWidth: 0 }}>
                <div className="sname">{s.name}</div>
                <div className="sid">{s.reg_no}</div>
              </div>
              <input
                className="mark"
                type="text"
                inputMode="numeric"
                maxLength={3}
                value={v == null ? "" : String(v)}
                placeholder="—"
                onChange={e => onInput(s.id, e.target.value)}
                onBlur={() => onBlur(s.id)}
                onFocus={e => e.currentTarget.select()}
              />
            </div>
          );
        })}
      </div>

      <div className="asheet-foot">
        <div className="sub" style={{ fontSize: 12 }}>Marks save as you type.</div>
        <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
