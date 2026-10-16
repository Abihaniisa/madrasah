import type { Fee, FeePayment } from "./types";
import { CONFIG } from "./config";

export type FeeStatus = "unpaid" | "partial" | "paid" | "scholarship";

export function feeFor(student_id: string, fees: Fee[]): Fee | undefined {
  return fees.find(f => f.student_id === student_id && f.year === CONFIG.regYear);
}

export function paymentsFor(student_id: string, payments: FeePayment[]): FeePayment[] {
  return payments
    .filter(p => p.student_id === student_id && p.year === CONFIG.regYear)
    .sort((a, b) => a.paid_on.localeCompare(b.paid_on));
}

export function computeFee(student_id: string, fees: Fee[], payments: FeePayment[]) {
  const fee = feeFor(student_id, fees);
  const amount = fee?.amount ?? CONFIG.registrationFee;
  const baseStatus = fee?.status ?? "unpaid";

  if (baseStatus === "scholarship") {
    return { amount, paid: 0, balance: 0, status: "scholarship" as FeeStatus, payments: [] as FeePayment[] };
  }

  const list = paymentsFor(student_id, payments);
  const paid = list.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, amount - paid);
  const status: FeeStatus = paid === 0 ? "unpaid" : paid >= amount ? "paid" : "partial";
  return { amount, paid, balance, status, payments: list };
}

export function fmtNGN(n: number): string {
  return "\u20A6" + Number(n).toLocaleString("en-NG");
}

export function methodLabel(m: FeePayment["method"]): string {
  return m === "cash" ? "Cash" : m === "transfer" ? "Bank transfer" : m === "pos" ? "POS" : "Other";
}
