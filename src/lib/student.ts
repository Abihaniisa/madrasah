import { supabase } from "./supabase";

export type StudentPortalData = {
  ok: boolean;
  error?: string;
  student?: any;
  marks?: any[];
  exams?: any[];
  assessments?: any[];
  fees?: any[];
  fee_payments?: any[];
  daura_participations?: any[];
};

const KEY = "madrasah.student";

export function saveStudentSession(nin: string, reg_no: string) {
  sessionStorage.setItem(KEY, JSON.stringify({ nin, reg_no }));
}

export function getStudentSession(): { nin: string; reg_no: string } | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearStudentSession() {
  sessionStorage.removeItem(KEY);
}

export async function fetchStudentPortal(nin: string, reg_no: string): Promise<StudentPortalData> {
  const { data, error } = await supabase.rpc("student_portal", { p_nin: nin, p_reg_no: reg_no });
  if (error) return { ok: false, error: error.message };
  return data as StudentPortalData;
}
