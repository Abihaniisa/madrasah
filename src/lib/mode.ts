import { useEffect, useState } from "react";

const KEY = "madrasah.mode";
export type Mode = "view" | "manage";

let current: Mode = (localStorage.getItem(KEY) as Mode) || "view";
let listeners: Array<(m: Mode) => void> = [];

export function getMode() { return current; }

export function setMode(m: Mode) {
  current = m;
  localStorage.setItem(KEY, m);
  listeners.forEach(l => l(m));
}

export function useMode(): [Mode, (m: Mode) => void] {
  const [m, setM] = useState<Mode>(current);
  useEffect(() => {
    listeners.push(setM);
    return () => { listeners = listeners.filter(l => l !== setM); };
  }, []);
  return [m, setMode];
}
