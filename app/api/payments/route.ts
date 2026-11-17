import { requireFeature } from "@/lib/access-control-server";
import {
  loadStore,
  commitStore,
  ApiError,
  body,
  limit,
  writable,
  admin,
  clean,
  uid,
  now,
  json,
  failure,
} from "@/lib/v1";
import { scoped } from "@/lib/access-policy";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await body(req);
    await limit(req, "payments", 40);
    const s = await loadStore(req);
    writable(s.club);
    requireFeature(s.identity,"Invoices",s.identity.role === "Admin");
    if (s.club.workspace_type === "Trainer")
      throw new ApiError(
        409,
        "Use Personal Training checkout and payment review.",
      );
    if (b.revision !== s.revision)
      throw new ApiError(
        409,
        "Records changed. Refresh before processing this payment.",
      );
    const next = structuredClone(s.data),
      i = next.records.Invoices.find((r) => r.id === b.id);
    if (!i) throw new ApiError(404, "Invoice unavailable.");
    if (
      s.identity.role !== "Admin" &&
      !(s.identity.role === "Member" && s.identity.member === i.member)
    )
      throw new ApiError(403, "This invoice is unavailable to this account.");
    let action = "";
    if (b.action === "submit") {
      if (!["Pending", "Rejected", "Expired"].includes(i.status))
        throw new ApiError(409, "This invoice cannot be submitted.");
      if (!s.club.bank_name || !s.club.bank_account || !s.club.bank_holder)
        throw new ApiError(
          422,
          "The owner has not entered the receiving bank details.",
        );
      if (clean(b.reference).length < 4)
        throw new ApiError(
          422,
          "Enter a transfer reference of at least four characters.",
        );
      i.status = "Review";
      i.reference = clean(b.reference);
      i.paymentNote = clean(b.note, 1000);
      i.submittedAt = now();
      i.submittedBy = s.identity.email;
      action = "Dues payment submitted";
    } else if (b.action === "approve" || b.action === "reject") {
      admin(s.identity);
      if (i.status !== "Review")
        throw new ApiError(409, "This payment is no longer awaiting review.");
      if (b.action === "reject" && !clean(b.note))
        throw new ApiError(422, "Enter a rejection reason.");
      i.status = b.action === "approve" ? "Paid" : "Rejected";
      i.reviewNote = clean(b.note, 1000);
      i.verifiedBy = s.identity.email;
      i.verifiedAt = now();
      i.method = "Transfer bank";
      i.fee = 0;
      i.gateway = 0;
      if (b.action === "approve") {
        i.paymentDate = now();
        next.records.Payments.unshift({
          id: uid(),
          club: s.club.id,
          invoice: i.id,
          member: i.member,
          name: i.name,
          amount: i.amount,
          total: i.amount,
          fee: 0,
          gateway: 0,
          method: "Transfer bank",
          status: "Paid",
          reference: i.reference,
          date: now(),
          verifiedBy: s.identity.email,
        });
      }
      action =
        b.action === "approve"
          ? "Dues payment verified"
          : "Dues payment rejected";
    } else if (b.action === "reverse") {
      admin(s.identity);
      if (i.status !== "Paid")
        throw new ApiError(409, "Only a paid transaction can be corrected.");
      if (clean(b.note).length < 10)
        throw new ApiError(
          422,
          "Explain the correction in at least ten characters.",
        );
      const paid = [...next.records.Payments].find(
        (p) => p.invoice === i.id && p.status === "Paid",
      );
      if (!paid) throw new ApiError(409, "Payment transaction unavailable.");
      // Keep original payment immutable; append a compensating ledger entry.
      next.records.Payments.unshift({
        id: uid(),
        club: s.club.id,
        invoice: i.id,
        member: i.member,
        name: i.name,
        amount: -i.amount,
        total: -i.amount,
        fee: 0,
        gateway: 0,
        status: "Reversed",
        method: "Koreksi administrasi",
        reference: paid.id,
        note: clean(b.note, 1000),
        date: now(),
        verifiedBy: s.identity.email,
      });
      i.status = "Pending";
      i.correctionNote = clean(b.note, 1000);
      i.reference = "";
      i.paymentDate = null;
      i.correctedAt = now();
      action = "Payment correction recorded; no funds moved";
    } else throw new ApiError(404, "Action unavailable.");
    const revision = await commitStore(s, next, action + " · " + i.id);
    return json({ ok: true, data: scoped(next, s.identity), revision });
  } catch (e) {
    return failure(e);
  }
}
