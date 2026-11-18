export const RELEASE_VERSION = "1.0.0-rc.11";
export const RELEASE_CHECKS = [
  {
    id: "identity",
    title: "Real-account access",
    help: "Test the operator, owner, admin, coach/trainer and member/client with independent verified Courvix accounts (email and each configured OAuth provider). Include invite expiry, revocation and cross-workspace denial.",
  },
  {
    id: "payments",
    title: "Real payment acceptance",
    help: "Confirm both subscription and business receiving instructions. Test transfer submission, rejection, approval and the resulting term or session credits.",
  },
  {
    id: "email",
    title: "Invitation and reminder receipt",
    help: "Verify sender DNS and delivery to an independent recipient. Check blocked/failed delivery and that paid or cancelled orders stop follow-ups.",
  },
  {
    id: "scheduler",
    title: "Unattended reminder job",
    help: "Verify the enabled hosting schedule, current Site audience and authenticated endpoint. Inspect a scheduled run and confirm deduplication; a configured job key alone is not proof.",
  },
  {
    id: "recovery",
    title: "Production data recovery",
    help: "Confirm the provider backup arrangement. Restore D1 to an isolated environment and recover R2 photo objects as well as their database references.",
  },
  {
    id: "devices",
    title: "Browser and device acceptance",
    help: "Complete signup, invitation, booking, payment, profile and export on desktop and mobile. Include keyboard focus, modal closing, dark mode and form errors.",
  },
  {
    id: "operations",
    title: "Commercial and support process",
    help: "Confirm published pricing, onboarding scope, payment-review ownership, refund/deletion handling, monitoring and the incident response owner.",
  },
  {
    id: "pilot",
    title: "Club and training pilot",
    help: "One club and one training business finish the real journey from invitation to payment, training and reporting. Resolve blocking feedback before general sale.",
  },
] as const;
export function releaseReadiness(rows: any[], release = RELEASE_VERSION) {
  return RELEASE_CHECKS.map((check) => {
    const latest = rows.find((r) => {
      try {
        const d =
          typeof r.detail === "string" ? JSON.parse(r.detail) : r.detail;
        return d?.gate === check.id && d.release === release;
      } catch {
        return false;
      }
    });
    let entry: any = null;
    try {
      entry =
        latest &&
        (typeof latest.detail === "string"
          ? JSON.parse(latest.detail)
          : latest.detail);
    } catch {}
    return {
      ...check,
      verified: entry?.verified === true,
      note: entry?.note || "",
      checkedAt: latest?.created_at || latest?.date || null,
      checkedBy: latest?.actor || null,
    };
  });
}
export function validateReleaseEvidence(b: any) {
  if (
    !RELEASE_CHECKS.some((c) => c.id === b.gate) ||
    typeof b.verified !== "boolean"
  )
    return "Choose a release check and a valid result.";
  const note = typeof b.note === "string" ? b.note.trim() : "";
  if (note.length < 20 || note.length > 600)
    return "Record 20–600 characters of evidence or the reason this check remains pending. Do not include secrets or customer data.";
  if (
    JSON.stringify({
      gate: b.gate,
      verified: b.verified,
      note,
      release: RELEASE_VERSION,
    }).length > 1000
  )
    return "Shorten the evidence note or remove repeated escape characters so the complete audit record can be saved.";
  return null;
}
