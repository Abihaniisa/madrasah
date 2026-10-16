import { CONFIG } from "./config";

export type BlockType = "teaching" | "exam" | "holiday" | "daura" | "ramadan";

export type Block = {
  type: BlockType;
  weeks: number;
  label: string;
};

export type Week = {
  num: number;
  blockType: BlockType;
  blockLabel: string;
  startDate: Date;
  endDate: Date;
  semester?: 1 | 2;
  teachingWeek?: number;
};

function buildWeeks(): Week[] {
  const start = new Date(CONFIG.calendar.sessionStart + "T00:00:00Z");
  const weeks: Week[] = [];
  let cursor = 1;
  let teachingCounter = 0;
  let semester: 1 | 2 = 1;

  for (const block of CONFIG.calendar.blocks) {
    for (let i = 0; i < block.weeks; i++) {
      const weekStart = new Date(start);
      weekStart.setUTCDate(start.getUTCDate() + (cursor - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

      let teachingWeek: number | undefined;
      let weekSemester: 1 | 2 | undefined;

      if (block.type === "teaching") {
        teachingCounter++;
        if (teachingCounter > 18) { teachingCounter = 1; semester = 2; }
        teachingWeek = teachingCounter;
        weekSemester = semester;
      }

      weeks.push({
        num: cursor,
        blockType: block.type,
        blockLabel: block.label,
        startDate: weekStart,
        endDate: weekEnd,
        semester: weekSemester,
        teachingWeek,
      });
      cursor++;
    }
  }
  return weeks;
}

let cached: Week[] | null = null;
export function allWeeks(): Week[] {
  if (!cached) cached = buildWeeks();
  return cached;
}

export function week(num: number): Week | undefined {
  return allWeeks().find(w => w.num === num);
}

export function totalWeeks(): number {
  return allWeeks().length;
}

/* Current week number (1-based). Returns 0 if the session has not started,
   or null if the session has ended. */
export function currentWeekNum(today = new Date()): number | null {
  const start = new Date(CONFIG.calendar.sessionStart + "T00:00:00Z");
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return 0;
  const n = Math.floor(diff / 7) + 1;
  if (n > totalWeeks()) return null;
  return n;
}

/* Format "28 Mar – 3 Apr 2026" or "28 Mar – 3 Apr 2026". */
export function formatRange(w: Week): string {
  const d = (x: Date) => x.getUTCDate();
  const m = (x: Date) => x.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  const y = (x: Date) => x.getUTCFullYear();
  if (w.startDate.getUTCMonth() === w.endDate.getUTCMonth()) {
    return `${d(w.startDate)}–${d(w.endDate)} ${m(w.startDate)} ${y(w.startDate)}`;
  }
  return `${d(w.startDate)} ${m(w.startDate)} – ${d(w.endDate)} ${m(w.endDate)} ${y(w.endDate)}`;
}

export function weeksOfType(type: BlockType): Week[] {
  return allWeeks().filter(w => w.blockType === type);
}

export function teachingWeeksOfSemester(sem: 1 | 2): Week[] {
  return allWeeks().filter(w => w.blockType === "teaching" && w.semester === sem);
}
