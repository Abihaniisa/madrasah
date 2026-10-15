import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRequireAuth } from "../../lib/auth";
import { useMode } from "../../lib/mode";
import { AdminTop } from "../../components/AdminTop";
import { DelayedSkeleton } from "../../components/Skeleton";
import { supabase } from "../../lib/supabase";

type DauraProgram = {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  weeks: number;
  status: "open" | "closed";
  subjects: string[];
};

export default function DauraProgrammePage() {
  const ready = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useMode();
  const [program, setProgram] = useState<DauraProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("daura_programs").select("*").eq("id", id).maybeSingle();
      setProgram((data as DauraProgram) ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (!ready || loading) return <div className="body"><div className="wrap"><DelayedSkeleton ready={!loading} rows={4} /></div></div>;
  if (!program) return <div className="body"><div className="wrap"><div className="empty"><div className="t">Programme not found</div></div></div></div>;

  return (
    <div>
      <AdminTop mode={mode} onMode={setMode} />
      <div className="body">
        <div className="wrap">
          <div className="crumb">
            <Link to="/admin">Portal</Link><span>/</span>
            <Link to="/admin/daura">Daura</Link><span>/</span>
            <span className="current">{program.name}</span>
          </div>
          <div className="phead">
            <div>
              <h1>{program.name}</h1>
              <p className="sub">
                {program.start_date || "no start"} {program.end_date ? `→ ${program.end_date}` : ""} · {program.weeks} weeks ·{" "}
                <span className={"pill pill-dot " + (program.status === "open" ? "pill-success" : "pill-neutral")}>
                  {program.status === "open" ? "Open" : "Closed"}
                </span>
              </p>
            </div>
          </div>

          <div className="card pad">
            <p className="sub" style={{ fontSize: 13, lineHeight: 1.7 }}>
              Participants, marks and reports for this programme will be built next. The schema and program creation are done.
              This page confirms the program saved correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
