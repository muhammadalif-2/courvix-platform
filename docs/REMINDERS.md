# Demo and payment reminders

## Interactive demo

The landing page opens `/demo`. Choose Club Management or Personal Training, then a role. Invitations and reminder emails appear in the simulated inbox; +1/+3-day controls advance the local clock. The demo uses injected transport and browser-local sample state. It sends no live invitations, payments, photos or reminder emails. Existing saved demo content is retained; Reset demo → Load complete examples refreshes sample records only.

Club follows recurring member dues and renewal choices. PT follows unpaid package orders; it never creates a monthly club invoice or auto-renews a session pack.

## Delivery policy

Owner/Admin enables workspace rules explicitly. Default Club cadence is three days before due date, due date, and one follow-up slot every three days after due date, using the workspace calendar/time zone. Unique invoice/order + slot keys prevent duplicate reminders.

Review pauses follow-ups. Paid/Cancelled stops them. Club Stop ends automated follow-up and future invoices for the chosen period without erasing existing debt. Continue retains eligible follow-up. PT clients can cancel unsubmitted unpaid orders; paid packs are purchased explicitly.

In-app history is persistent. Email requires `RESEND_API_KEY` and `COURVIX_FROM_EMAIL` on a verified domain. Missing configuration is Blocked, never Sent. Uncertain sends require provider inspection, not blind retry. Delivery history is not proof the recipient read or received a message.

## Unattended endpoint and service boundary

`POST /api/reminders/run` requires `X-Courvix-Job-Key`, compared against the server-side `COURVIX_REMINDER_JOB_KEY`. Public Site access alone cannot authorize this writer. Private Site access additionally requires a supported Site service credential in `OAI-Sites-Authorization`; dispatcher access does not supply visitor identity.

Never put either credential in Git, a browser, schedule prompt, logs or checklist notes. Do not change audience to make scheduling work. Future tasks must acquire supported current credentials without relying on the authoring session. If the current supported credential cannot satisfy both required boundaries, stop and report the configuration issue; do not rotate credentials or attempt anonymous writes.

The existing linked review task was configured for an earlier owner-private Site. It must be reconciled with the current public audience and independently verified job authentication before enabling it. Keep its paused state until configured. A scheduled automation record is not proof of a successful run. Do not create duplicates.

The processor takes a ten-minute D1 lease and attempts at most 50 sends per run. Payment/renewal state is rechecked immediately before send. Provider idempotency keys use persisted reminder IDs. An interrupted Sending state becomes Uncertain for provider inspection. A successful unattended endpoint call appends a `Reminder scheduler run` audit receipt with counts only; the operator Launch & service readiness page shows receipts and delivery totals. There is no claim that the schedule is active merely because a key or old receipt exists.

## Acceptance

Test a real invitation and reminder to independent accounts after sender setup. Verify Paid/Review/Cancelled/Stop behavior, deduplication, unauthorized job denial, the intended schedule time and recovery after a provider failure. Check the hosting schedule and last completed receipt separately. Tests should use synthetic local data, missing/fixture sender config and a local-only job key; never send to real customers for a test.
