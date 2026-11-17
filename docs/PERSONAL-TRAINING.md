# Courvix Personal Training — V1.0-rc.5

Courvix now has two separate products. **Club Management** retains its member, team, attendance, recurring dues and reminder workflow. **Personal Training** has a dedicated workspace, client portal, offers, checkout, appointments, class capacity, session credit ledger and training progress. Workspace type is selected at business registration; the products do not share a generic editing/payment surface.

## Business and client journeys

Business: choose Personal Training → sign in → register the business and choose a Courvix workspace plan → add trainers, offers, policies and receiving bank details → add/invite clients → review actual client transfers → schedule training → record completion/progress → review balances and follow up.

Client: accept the email-bound invitation → complete the shared account profile → choose a single visit or a session pack → transfer to the training business and submit the reference → administrator verifies receipt → credits activate → request a private appointment or reserve a published class → trainer records completion → see remaining sessions and progress → choose another pack when ready.

The business pays Courvix for its workspace subscription. Client training purchases are separate and go directly to the business. A client invitation does not require a club team. Owners may invite additional admins; branch access remains separate.

## Offers and balances

- A single visit gives one session. The demo includes 4-, 8- and 16-session packs; businesses may configure a custom integer count of 1–200 sessions.
- Each offer has a price in the workspace currency, duration (15–240 minutes), validity (1–730 calendar days) and description.
- Orders snapshot the offer name, price, count, duration and validity. Editing an offer does not change purchased order terms.
- Pending/Rejected → payment submission → Review → administrator Paid/Rejected. A rejection requires a reason. Unsubmitted unpaid orders can be cancelled; submitted transfers must be reviewed.
- Paid activation grants credits once and records the expiry date. Duplicate/concurrent approvals cannot grant credits twice.
- Credits remaining = immutable purchase/usage/correction ledger sum. Available = unexpired remaining credits minus Requested/Scheduled reservations. Past appointments still await a trainer outcome; credits are not silently discarded.
- Packs are purchased explicitly. They do not renew, debit cards or generate recurring club invoices automatically.

## Appointments and classes

- Private bookings reserve one available paid credit. Client requests start as Requested and require confirmation; administrators book as Scheduled.
- Check the trainer/client overlap, business hours, future start, exact purchased duration, package validity and active client/trainer.
- Published classes have a trainer, date, time, venue and 2–50 places. Each participant reserves a credit from their own package with matching duration. Duplicate participant bookings and capacity overflow are blocked.
- Completion is allowed only after the scheduled end, uses one credit exactly once, and records progress notes. Only the assigned trainer or an admin closes the appointment.
- No-show follows the displayed business policy (charge one credit or release the reservation). Default: charge one credit.
- Every new booking snapshots cancellation notice and no-show charging policy. Rescheduling preserves these terms. Existing legacy appointments are pinned to the current policy before the next successful mutation, including a settings change; an unsaved legacy view labels its fallback. Future changes apply to new bookings only.
- Default free-cancellation notice: 12 hours; owners/admins can configure 0–168 hours. Clients outside that window contact their trainer. Staff provide a reason for late cancellation; admins can explicitly record a charge.
- Eligible cancellation releases reserved credit. Class cancellation releases all upcoming participant reservations. Closed/charged appointments cannot be reopened silently.
- An admin can restore a charged session with a reason of at least ten characters. A compensating credit entry is added and the original entry is preserved. This does not move or refund money.

## Access, persistence and reminders

- Owners/admins see workspace clients, offers, purchases, payments, ledgers and operations.
- Trainers see assigned clients, their own appointments/classes and related progress. Payment amounts, orders and credit ledgers are omitted from their response.
- Clients see their own orders, sessions, credits and progress, plus available offers/classes. Class availability reveals counts without other client identities.
- All mutations use the existing D1 record storage and transactional workspace revision guard. Generic workspace updates and the club-payment endpoint reject Trainer workspaces. Existing backups/history cover the new `PT*` record modules; no schema migration is needed.
- Old trainer membership invoices are retained in exports and do not grant session credits. They are not relabeled as session-pack purchases.
- Payment follow-ups use unpaid PT orders, pause under Review, and stop after Paid/Cancelled. They never issue a new monthly club invoice. The existing daily scheduler and sender configuration are retained. Without sender configuration delivery is Blocked, never falsely Sent.
- Account photos remain privately stored in R2. Assigned trainers can view authorized client portraits; identity documents remain disabled.

## English-only interface

English is the sole interface language. There is no language selector or active translation mode. Legacy stored locale values are ignored by the UI; new records use English. Theme, country, currency and time zone controls remain. User-authored names, notes and historical data are preserved rather than automatically translated.

## Demo and validation

`/demo?product=club` opens Club Management; `/demo?product=training&workspace=demo-nusa` opens Personal Training. Each has its own role labels and guided journey. Use +1 day to move beyond the end of a newly booked future appointment. A past example appointment can be completed immediately. Reset only replaces browser-local sample records.

Run `npm test`, TypeScript, the production build, `test:training`, `test:network`, `test:api`, and the isolated backup/restore check. The training API suite verifies durable checkout/credits/bookings, team-free invitations, concurrent verification, plan snapshots, role/product boundaries and platform totals. The pure domain suite covers completion, correction, cancellation/no-show, expiry, class capacity, overlap and DST validation.

Browser controls are unavailable in this environment, so visual/mobile acceptance remains unverified. Real launch still requires verified sender configuration, actual subscription bank instructions, independent real-account sign-in/invitation tests, infrastructure recovery and a pilot. No payment gateway, automatic refund, public anonymous booking, calendar sync or trainer medical-record system is implied.
