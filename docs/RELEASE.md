# Courvix V1 release runbook

The current code is a release candidate for internal review. Production acceptance requires real identities on the selected hosted Site, configured delivery/payment instructions, infrastructure access, and a pilot. Local tests do not replace those gates.

Read [rc.10 account onboarding and activation](ACCOUNT-ONBOARDING.md) first, then the historical [rc.9 design](V1-REVIEW-RC9.md), [rc.6 product and UX changes](V1-REVIEW-RC6.md), [rc.5 design and acceptance changes](V1-REVIEW-RC5.md) and [Personal Training scope](PERSONAL-TRAINING.md) for the two products, English-only UI, session-credit behavior and current acceptance limits. The rc.3 review is historical. The operator Launch & service readiness page distinguishes configuration from current-release acceptance evidence. A verified operator statement is not an automatic infrastructure test.

## Implemented application scope

- Verified email/password accounts via Better Auth, optional configured Google/Microsoft, waiting room, and server-side shared workspace memberships. Separate role links with approval, role defaults and individual feature permissions.
- Empty club onboarding, 14-day trial, groups, schedules, coach attendance and linked profiles.
- Email-bound single-use seven-day invitations, additional Admins, revocation, owner transfer.
- Normalized per-record D1 persistence, transactional revision checks, historical versions and audit trail.
- Manual member payment submission, Admin approval/rejection, immutable payment entries and compensating corrections. No payment gateway or per-payment fee.
- Owner-requested subscription invoices; only the configured Courvix operator verifies and activates a 30-day paid term.
- Period filters, reports, scoped export, privacy/terms, disabled sensitive uploads, support queue and operator responses.

## Hosting identity boundary

The new portable project uses native Better Auth verification and sessions. Configure the auth origin, persistent secret, sender, and optional provider credentials as documented in [ACCOUNT-ONBOARDING.md](ACCOUNT-ONBOARDING.md). Raw Sites identity headers are ignored unless the optional Sites bridge is explicitly enabled behind its dispatcher. Do not enable that bridge on an unprotected Worker origin.

`COURVIX_LOCAL_AUTH=1` is a local-only development facility. The flag, synthetic sessions and captured mail must never be enabled on production. Secrets, fixtures, local database files and backups are excluded from source and release artifacts.

## Production values

Configure through the selected Site's environment settings. Do not put secrets in hosting.json, Git, chat or client code.

- `COURVIX_ADMIN_EMAILS=courvix.id@gmail.com`
- `COURVIX_SUPPORT_EMAIL=courvix.id@gmail.com`
- `RESEND_API_KEY`: provider secret, entered in hosting settings.
- `COURVIX_FROM_EMAIL`: sender on a verified domain.
- `COURVIX_BANK_NAME`, `COURVIX_BANK_ACCOUNT`, `COURVIX_BANK_HOLDER`: actual subscription receiving account.

Each club Owner separately enters the club's receiving bank account. These two accounts serve different purposes. Missing subscription instructions lock submission in the UI/API; missing mail configuration produces an honest delivery status and allows manual sharing of the invitation link. The operator screen reports configuration readiness, not successful live email delivery or successful bank receipt.

## Migration and release

1. Back up the selected production database and verify access to restore before migration.
2. Use separate Site IDs, D1 bindings, users and secrets for staging and production. Do not copy local runtime state.
3. Apply SQL migrations in `drizzle/` in order using the hosting platform's migration process. V1 uses new `cv_*` tables and leaves old visitor demos untouched; demo data is not customer data and is not migrated automatically.
4. Run `npm ci`, `npm test`, `npx tsc --noEmit`, `COURVIX_TEST_URL=<local-url> npm run test:api`, `COURVIX_TEST_URL=<local-url> npm run test:network`, `npm run build`, `npm run release:check`.
5. Package built `dist/` including `.openai/hosting.json`, server, client assets and migrations. Source commit and built artifact must match.
6. Review the privacy/terms, prices, plan support commitments and receiving account with the business owner.
7. Publish a staging version. Test verified email sign-in and every configured OAuth provider from independent real accounts, accepting an invitation from another device, email delivery, attendance, manual payment approval, access revocation, expiry and export.
8. Publish the reviewed commit/artifact to production without changing audience unexpectedly. Configure DNS/HTTPS, then repeat a real sign-in + read/write + email smoke check.
9. Enable uptime monitoring of `/api/health` and operator notifications. Monitor runtime errors and usage; never log tokens, email bodies or full request payloads.
10. Start with 2–3 pilot clubs. A successful deployment is not evidence that an external pilot or email acceptance test has occurred.

## Backup and recovery

`npm run setup:local` prepares a local-only database configuration. `npm run backup:local` exports the V1 `cv_*` tables as a local SQL backup (legacy visitor demo snapshots and ephemeral local sessions are intentionally excluded) into ignored `work/backups`. `node tests/backup-restore.mjs` exports and restores into a separate disposable local D1 database, then compares record counts. It never overwrites the live development database.

For a directly accessible production D1 database, `.github/workflows/backup.yml` provides an opt-in daily 02:15 WIB encrypted backup, retained 14 days as encrypted artifacts. Configure `wrangler.production.json` with the real binding ID, account-scoped credentials, `COURVIX_BACKUP_KEY` (random 32-byte base64 key stored separately), and repository variables. Enable `COURVIX_BACKUPS_ENABLED=true` only after a manual export/decrypt/restore drill. The workflow is not enabled by source code alone. If Sites does not expose D1 credentials, arrange backup/recovery through the provider instead; do not pretend this workflow is operating against a provider-managed database.

Remote exports are AES-256-GCM encrypted before upload; plaintext temporary files remain only on the ephemeral runner. Never upload plaintext customer backups to this public source repository. Store the encryption key in a secure place outside the backup location. Configure failure notifications and access to backup artifacts.

Recovery: decrypt into a restricted scratch directory, import into an isolated D1 database, compare counts and test access/ledger state, then plan a controlled database replacement. Restore only after considering writes since the backup. Code rollback and database rollback are separate operations; do not reverse migrations automatically.

## Explicit external release gates

- Real operator email login verified on the hosted Site.
- Real receiving bank account supplied and checked.
- Sender domain DNS verification, Resend secret, real invitation received.
- Hosted D1 migration verified; provider backup/recovery access established.
- Production domain/audience reviewed; preview browser/real-device acceptance completed.
- Backup schedule activated and failure notification tested.
- Pilot users actually complete the workflow; their feedback resolved.

These external gates must be reported as pending until demonstrated. They cannot be inferred from localhost tests.
