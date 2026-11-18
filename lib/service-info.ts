export const serviceInfo = {
  brand: "Courvix",
  operator: "Muhammad Alif",
  operatorType: "Individual operator",
  country: "Indonesia",
  address: "Jl. Cemara Kipas 2 No. 34, Taman Yasmin Sektor 2, Kota Bogor, Jawa Barat 16112, Indonesia",
  support: "courvix.id@gmail.com",
  policyVersion: "2026-11-18-review",
  policyDate: "18 November 2026",
  legalReviewComplete: false,
} as const;
export const notificationCoverage = [
  {event:"Direct email invitation",inApp:"Matching invitations appear in the personal waiting room.",email:"Available when the invitation sender is configured; inspect delivery status.",push:"Not implemented"},
  {event:"Shared-link access request",inApp:"The requester sees review status; authorized staff review it in People & access.",email:"No general request/approval email automation in V1.",push:"Not implemented"},
  {event:"Unpaid dues or training purchase",inApp:"Payment state and generated follow-up history are available in the workspace.",email:"Requires an enabled sender, workspace preferences and a running scheduler.",push:"Not implemented"},
  {event:"Schedules, bookings & announcements",inApp:"Records are visible within the user’s role and refresh with workspace data.",email:"No general email delivery for every record change in V1.",push:"Not implemented"},
  {event:"Payment review & subscription status",inApp:"Status is shown in the relevant payment, purchase or business screen.",email:"No general email delivery for every status change in V1.",push:"Not implemented"},
] as const;
