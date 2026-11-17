# Courvix rc.5 — Design, copy and release controls

## Product and conversion work

The messaging plan in `MESSAGING.md` was written before the presentation redesign. The homepage leads with the operational problem: scattered people, schedules and payment records. Its promise is “More coaching. Less chasing.” It shows an explicitly illustrative product preview, a Club/PT selector, separate product journeys, concrete outcomes, pricing context, role boundaries and FAQ before asking visitors to register.

No customer endorsements, adoption statistics, guaranteed savings, false urgency or successful-enquiry simulations are used. The contact action opens an email draft. Demo numbers and payments are labelled sample data. Trial and payment copy discloses ChatGPT identity, manually verified transfers, per-location subscription and service-configuration requirements.

New product pages: `/clubs` and `/personal-training`. Products, platform, sports, pricing, journal, custom project, contact and policies use the same public visual system. The shared internal experience applies to Club, PT, platform administration, headquarters, profiles, invitations/registration, demo, forms, tables, modals, empty/error/loading states. Branding remains orange Courvix with Inter, light/dark themes, warm neutral surfaces and green operational accents. Mobile layouts, readable spacing, keyboard focus, reduced motion, active navigation and account context are defined in the shared styles.

## Corrections from the readiness review

- Remaining known live API errors, accessibility labels, delivery labels, demo messages and subscription copy were converted to English. Stable sport IDs and user-authored historical data are preserved.
- PT appointment cancellation/no-show policies are stored per booking. Changing settings cannot retroactively charge a booking or restrict its agreed free-cancellation window. Rescheduling preserves policy. Legacy records are pinned before a subsequent successful mutation; GET remains read-only.
- Display pricing is consistently Starter/Pro and per 30-day activated term. The historical `Club Pro` identifier is retained in storage for compatibility.
- Terms explain manual transfer verification, separate receiving businesses, credit corrections versus money refunds, support/refund requests and Pro onboarding scope.
- Operator configuration status says Configured/Missing rather than claiming services are proven live.
- Eight acceptance checks accept operator-only, current-release evidence with a required note. Evidence is appended to the existing audit log; reopening a check supersedes prior approval without deleting it. Future releases do not inherit unverified acceptance claims. Demo evidence stays local.
- Completed scheduled reminder calls record aggregate receipts in the audit log. Operators see recent receipt times and aggregate delivery states. These do not claim the hosting scheduler is enabled or the recipient received the email.
- Reminder and incident/recovery runbooks distinguish Site service access, application job authentication and provider recovery. No secrets are stored in source or checklist notes.

## Validation

Validation completed: `npm test`, TypeScript, production build, original V1/network/PT API suites, local scheduler-receipt API suite, and isolated backup/restore. Public-route HTTP rendering checks also passed. New regression coverage exercises policy preservation after settings changes and rescheduling, no-show credit behavior, current-release evidence, reopening checks, operator-only authorization and English request errors. New public routes are checked through the built server with read-only HTTP calls. No new schema migration: policy snapshots are stored in existing PT session JSON and release/job receipts in `cv_audit`.

Visual, interactive browser, mobile and assistive-device acceptance cannot be established without available browser controls. Static responsive CSS and HTTP rendering checks are not substitutes. This remains explicit rather than marking an unobserved test complete.

## External launch requirements still pending

Actual subscription bank instructions, verified email sender/DNS/secret, appropriate enabled scheduler, independent real-account journeys, production D1/R2 recovery, human support coverage and Club/PT pilot acceptance require real configuration or people. Do not fill in fictional credentials, bank accounts, reviews, backups or acceptance evidence. The scheduler remains in its existing paused state until its operational setup is verified. A successful preview deployment does not change these gates.
