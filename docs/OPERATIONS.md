# Courvix operational acceptance and incident guide

This runbook describes work to perform, not infrastructure already operating. Record verified evidence in the operator's Launch & service readiness page. Do not store credentials, private customer details or recovery keys in evidence notes.

## Before paid onboarding

1. Confirm the business owner, selected product, number of separately billed workspaces, timezone and currency. Explain ChatGPT sign-in and manually verified transfers.
2. Confirm Courvix subscription receiving instructions and the business's separate receiving account with the actual account holder. Never invent bank data or approve based on a reference alone.
3. Agree Pro onboarding scope/appointment before payment. Assign who reviews transfers, answers support, handles refunds/data requests and responds to incidents. The app does not guarantee 24/7 staffing.
4. Verify sender DNS, invitation receipt, reminder delivery, authenticated schedule and actual job receipts. Keep the schedule paused until its current Site audience and credential flow have been verified.
5. Complete independent-account role/device acceptance and the Club/PT pilot. The demo uses local sample data and does not satisfy these tests.

## Monitoring

Use an external uptime monitor for the public `/api/health` endpoint. Expected body has `status: ok` and the release version. This is a basic DB liveness check; it does not establish mail, payments, R2 recovery or staff readiness. Never put operator/job credentials in a public monitor.

Review provider Worker errors, the operator support queue, payment reviews, scheduled-job receipt freshness and Failed/Blocked/Uncertain delivery states. Configure provider notifications where supported and assign a real incident owner. No external monitor or alert channel is silently assumed active.

## Incident response

Record the incident time, affected workspace/operation and a minimal non-sensitive reproduction. Check health and provider logs. For suspected unauthorized access, revoke the affected membership and use the identity provider's account-security process. Preserve audit evidence and avoid exporting unrelated customer data.

For interrupted sends, inspect provider delivery using the persisted reminder/idempotency reference before retrying. For payment/credit disputes, reconcile the receiving bank and ledger; append an explained correction, never erase original entries or claim a refund moved money.

Rollback code using the last known-good source/artifact only after considering data compatibility. Code rollback and restoring data are different operations.

## Production recovery

Obtain the hosting provider's actual D1 and R2 backup/recovery capabilities and retention. The optional GitHub D1 workflow is only applicable with authorized direct database access and configured encrypted-backup secrets; its existence does not mean it is enabled for Sites.

Perform a restore drill into a separate authorized environment. Compare users, memberships, billing, session-credit ledger, audit and invitation/reminder state. Recover R2 photo bytes as well as database object references and verify permission-scoped retrieval. Never overwrite customer production data to test a restore. Document recovery point, recovery time, lost writes and approval/communication ownership before any real replacement.

Data deletion requests require verified identity and workspace-owner authority. Consider both D1 references/history and R2 objects, and document any lawful retention of financial records and backup expiry. Do not promise a retention window the provider has not confirmed.
