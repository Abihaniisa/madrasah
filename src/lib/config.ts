import type { Section } from "./types";

export const CONFIG = {
  name: "Madrasatus Sahaba Li Tahfizul Qur'an",
  short: "Madrasatus Sahaba",
  sub: "Li Tahfizul Qur'an",
  code: "MS",
  founded: "2020",
  founder: "Sheikh Abdullahi Babayo",
  founderRole: "Founder & Spiritual Guide",
  whatsapp: "2348000000000",
  assessmentMax: 10,
  examMax: 100,
  assessmentWeight: 0.30,
  examWeight: 0.70,
  regYear: "2026",
  registrationFee: 5000,
  sessionLabel: "2025/2026",
  semesterLabel: "Semester 1",
  sessionStartISO: "2026-11-02",
  semesterWeeks: 18,
  builder: {
    name: "Abihani Isa",
    fullName: "Isa Yahya Bayero",
    phone: "2347013927783",
    email: "abihaniisa@gmail.com",
    site: "https://abihaniexpress.com.ng",
    role: "Founder, Abihaniexpress",
    bio: "A student at Madrasatus Sahaba Li Tahfizul Qur'an and the founder of Abihaniexpress. I build fast, clean web tools for schools and small businesses.",
    regNo: "2026-MS-0001",
  },
  grades: [
    { min: 75, label: "Distinction", tone: "success" },
    { min: 60, label: "Merit",       tone: "primary" },
    { min: 50, label: "Pass",        tone: "info"    },
    { min: 0,  label: "Fail",  tone: "danger"  },
  ],
  subjects: ["Qur'an", "Hadith", "Fiqh", "Arabic", "Tajweed"],
};

export const SECTIONS: Section[] = [
  { id: "foundation", name: "Foundation", classes: ["Tamhid", "I'idad"], desc: "Reading, writing, and Qur'anic foundations." },
  { id: "secondary", name: "Secondary", classes: ["Thanawiyyah 1","Thanawiyyah 2","Thanawiyyah 3","Thanawiyyah 4","Thanawiyyah 5","Thanawiyyah 6"], desc: "Six years of structured study." },
  { id: "higher", name: "Higher", classes: ["Aliyyah 1","Aliyyah 2","Aliyyah 3","Aliyyah 4"], desc: "Advanced study. Opening when the school authorises it.", inactive: true },
];

export const ALL_CLASSES = SECTIONS.filter(s => !s.inactive).flatMap(s => s.classes);

export const CALENDAR = (() => {
  const start = new Date(CONFIG.sessionStartISO + "T00:00:00Z");
  const blocks = [
    { label: "First semester", kind: "teaching", from: 1, to: 18 },
    { label: "First semester exam", kind: "exam", from: 19, to: 19 },
    { label: "First semester holiday", kind: "holiday", from: 20, to: 20 },
    { label: "Second semester", kind: "teaching", from: 21, to: 38 },
    { label: "Second semester exam", kind: "exam", from: 39, to: 39 },
    { label: "Second semester holiday", kind: "holiday", from: 40, to: 40 },
    { label: "Daura", kind: "daura", from: 41, to: 46 },
    { label: "Post-Daura holiday", kind: "holiday", from: 47, to: 48 },
    { label: "Flexible", kind: "flexible", from: 49, to: 52 },
  ] as const;
  const weekDate = (weekNum: number) => {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + (weekNum - 1) * 7);
    return d;
  };
  return { blocks, weekDate };
})();

export function formatWeekDate(weekNum: number): string {
  const d = CALENDAR.weekDate(weekNum);
  const day = d.getUTCDate();
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day} ${month}`;
}
