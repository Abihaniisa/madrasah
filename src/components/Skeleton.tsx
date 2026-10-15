import { useEffect, useState } from "react";

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skel" style={{ width: `${60 + ((i * 13) % 35)}%` }} />
      ))}
    </div>
  );
}

/* Show a skeleton only if the wait is longer than `delay` ms.
   Instant fetches show nothing, so no flash. */
export function DelayedSkeleton({
  ready,
  rows = 4,
  delay = 150,
}: {
  ready: boolean;
  rows?: number;
  delay?: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (ready) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [ready, delay]);

  if (ready || !show) return null;
  return <Skeleton rows={rows} />;
}
