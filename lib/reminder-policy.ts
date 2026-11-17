import type { Row } from "./courvix";
export type RenewalChoice = "Undecided" | "Continue" | "Stop";
export type ReminderPreference = {
  enabled: boolean;
  emailEnabled: boolean;
  leadDays: number;
  intervalDays: number;
};
export const defaultReminderPreference: ReminderPreference = {
  enabled: false,
  emailEnabled: false,
  leadDays: 3,
  intervalDays: 3,
};
export function reminderSlot(
  invoice: Row,
  member: Row | undefined,
  choice: RenewalChoice,
  today: string,
  p: ReminderPreference,
): string | null {
  if (
    !p.enabled ||
    !member ||
    member.status !== "Active" ||
    choice === "Stop" ||
    !["Pending", "Rejected", "Expired"].includes(invoice.status)
  )
    return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(invoice.due || "")) return null;
  const offset = Math.floor(
    (Date.parse(today + "T00:00:00Z") -
      Date.parse(invoice.due + "T00:00:00Z")) /
      86400000,
  );
  if (!Number.isFinite(offset) || offset < -p.leadDays) return null;
  return offset < 0
    ? "before"
    : offset < p.intervalDays
      ? "due"
      : "late-" + Math.floor(offset / p.intervalDays);
}
export function reminderText(
  invoice: Row,
  clubName: string,
  currency = "IDR",
  locale = "en",
) {
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number(invoice.amount));
  return `${clubName} payment reminder: your ${invoice.planName || invoice.period || ""} ${invoice.planName ? "training package order" : "invoice"} of ${amount} is due on ${invoice.due}. Already transferred? Submit your payment for review. ${invoice.planName ? "You can cancel an unpaid order if you do not wish to continue." : "You can also choose to continue or stop your membership."}`;
}
export function stopReason(invoice: Row, choice: RenewalChoice) {
  return invoice.status === "Paid"
    ? "Paid"
    : invoice.status === "Review"
      ? "Menunggu verifikasi admin"
      : choice === "Stop"
        ? "Member declined renewal"
        : invoice.status === "Cancelled"
          ? "Invoice cancelled"
          : null;
}
