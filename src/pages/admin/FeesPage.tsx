import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CONFIG, SECTIONS, ALL_CLASSES } from "../../lib/config";
import { loadSchool, type SchoolData } from "../../lib/data";
import { fmtN } from "../../lib/calc";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { supabase } from "../../lib/supabase";
import { I, waLink } from "../../components/Layout";
import { AdminTop } from "../../components/AdminTop";
import { DelayedSkeleton } from "../../components/Skeleton";

export default function FeesPage() {
  const ready = useRequireAuth();
  const [mode, setMode] = useMode();
  const [data, setData] = useState<SchoolData | null>(null);
  const [scope, setScope] = useState<string>("all");
  const [inClass, setInClass] = useState<string | null>(null);

  useEffect(() => { loadSchool().then(setData); }, []);

  if (!ready) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Checking access…</div></div></div></div>;
  if (!data) return <div className="body"><div className="wrap"><DelayedSkeleton ready={!!data} rows={5} /></div></div>;

  if (inClass) {
    return <ClassDetail cls={inClass} data={data} onBack={() => setInClass(null)} onRefresh={() => loadSchool().then(setData)} mode={mode} onMode={setMode} />;
  }

  const scopes = [
    { id: "all", label: "All" },
    { id: "foundation", label: "Foundation" },
    { id: "secondary", label: "Secondary" },
    { id: "higher", label: "Higher" },
  ];
  const classesToShow = scope === "all" ? ALL_CLASSES : (SECTIONS.find(s => s.id === scope)?.classes ?? []);

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap">
          <div className="crumb"><Link to="/admin">Portal</Link><span>/</span><span className="current">Fees</span></div>
          <div className="phead">
            <div>
              <h1>Fees</h1>
              <p className="sub">Registration fee · {CONFIG.sessionLabel} · {fmtN(CONFIG.registrationFee)} per student</p>
            </div>
          </div>

          <div className="chip-line">
            {scopes.map(sc => (
              <button key={sc.id} className={"chip-f " + (scope === sc.id ? "active" : "")} onClick={() => setScope(sc.id)}>{sc.label}</button>
            ))}
          </div>

          <div className="fee-sum">
            {classesToShow.map(cls => {
              const students = data.students.filter(s => s.class_name === cls);
              if (students.length === 0) return null;
              const paid = students.filter(s => {
                const f = data.fees.find(x => x.student_id === s.id && x.year === CONFIG.regYear);
                return f && f.status === "paid";
              }).length;
              const unpaid = students.length - paid;
              const tone = unpaid === 0 ? "paid" : paid === 0 ? "due" : "mixed";
              return (
                <button key={cls} className="fee-sum-row" onClick={() => setInClass(cls)}>
                  <div>
                    <div className="cname">{cls}</div>
                    <div className="cmeta">{students.length} students</div>
                  </div>
                  <div className={"stat " + tone}>
                    <div className="num">{paid}</div>
                    <div className="lbl">Paid</div>
                  </div>
                  <div className={"stat " + (unpaid === 0 ? "paid" : "due")}>
                    <div className="num">{unpaid}</div>
                    <div className="lbl">Unpaid</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClassDetail({
  cls, data, onBack, onRefresh, mode, onMode,
}: {
  cls: string;
  data: SchoolData;
  onBack: () => void;
  onRefresh: () => void;
  mode: "view" | "manage";
  onMode: (m: "view" | "manage") => void;
}) {
  const students = data.students.filter(s => s.class_name === cls);
  const order: Record<string, number> = { unpaid: 0, partial: 1, scholarship: 2, paid: 3 };
  const sorted = [...students].sort((a, b) => {
    const fa = data.fees.find(x => x.student_id === a.id && x.year === CONFIG.regYear);
    const fb = data.fees.find(x => x.student_id === b.id && x.year === CONFIG.regYear);
    const oa = fa ? order[fa.status] ?? 0 : 0;
    const ob = fb ? order[fb.status] ?? 0 : 0;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name);
  });

  const paidCount = students.filter(s => {
    const f = data.fees.find(x => x.student_id === s.id && x.year === CONFIG.regYear);
    return f && f.status === "paid";
  }).length;

  async function setStatus(sid: string, status: "unpaid" | "partial" | "paid" | "scholarship") {
    const existing = data.fees.find(x => x.student_id === sid && x.year === CONFIG.regYear);
    if (existing) {
      await supabase.from("fees").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("fees").insert({
        student_id: sid,
        year: CONFIG.regYear,
        amount: CONFIG.registrationFee,
        paid: status === "paid" ? CONFIG.registrationFee : 0,
        status,
      });
    }
    onRefresh();
  }

  return (
    <div>
      <AdminTop mode={mode} onMode={onMode} />
      <div className="body">
        <div className="wrap">
          <div className="crumb">
            <Link to="/admin">Portal</Link><span>/</span>
            <button onClick={onBack} style={{ color: "inherit", font: "inherit", padding: 0 }}>Fees</button>
            <span>/</span>
            <span className="current">{cls}</span>
          </div>
          <div className="phead">
            <div>
              <h1>{cls}</h1>
              <p className="sub">{paidCount} paid · {students.length - paidCount} unpaid · {CONFIG.sessionLabel}</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onBack}>{I.back} All classes</button>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            {sorted.map(s => {
              const f = data.fees.find(x => x.student_id === s.id && x.year === CONFIG.regYear);
              const status = f?.status ?? "unpaid";
              const amount = f?.amount ?? CONFIG.registrationFee;
              const paid = f?.paid ?? 0;
              const balance = amount - paid;
              const tone = status === "paid" ? "success" : status === "partial" ? "warning" : status === "scholarship" ? "info" : "danger";
              const label = status === "paid" ? "Paid" : status === "partial" ? "Partial" : status === "scholarship" ? "Scholarship" : "Unpaid";
              const showRemind = status !== "paid" && status !== "scholarship";
              return (
                <div key={s.id} className="fee-student">
                  <div className="avatar">{(s.name[0] ?? "") + (s.name.split(/\s+/)[1]?.[0] ?? "")}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="sname">{s.name}</div>
                    <div className="sid">{s.reg_no}</div>
                  </div>
                  <div className="num">{fmtN(paid)}<span className="lbl">Paid</span></div>
                  <div className="num" style={{ color: balance > 0 ? "var(--warning)" : undefined }}>{fmtN(balance)}<span className="lbl">Balance</span></div>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                    <span className={"pill pill-dot pill-" + tone}>{label}</span>
                    {showRemind && (
                      <a
                        className="btn btn-wa btn-sm"
                        href={waLink(CONFIG.whatsapp, `As-salamu alaykum. A reminder about the registration fee for ${s.name} (${s.reg_no}).`)}
                        target="_blank" rel="noopener noreferrer"
                      >
                        {I.whatsapp} Remind
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
