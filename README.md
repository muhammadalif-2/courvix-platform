# courvix-platform

**Courvix Platform — V1.0 rc.10**

Club and private trainer operations for Owner, Admin, Coach and Member. React/Vinext, Cloudflare D1/R2 and Better Auth accounts, with optional configured social providers. The landing page opens a separate interactive demo at `/demo` with five roles, an invitation inbox, simulated time, and payment reminders. Real accounts continue to use `/login`.

Current implementation: [rc.10 accounts, waiting room and feature access](docs/ACCOUNT-ONBOARDING.md). Previous design: [rc.9 landing](docs/V1-REVIEW-RC9.md).

Current scope: [Personal Training and the two-product model](docs/PERSONAL-TRAINING.md). English is the only interface language. Club Management remains a separate product with its existing workflow.

## Local setup

Node 22.13+:

```sh
npm ci
npm run setup:local
npm run dev
```

Open the printed local URL at `/register`. Native email signup requires verification. Local verification/reset emails are captured, never sent. Read [accounts and onboarding](docs/ACCOUNT-ONBOARDING.md) for testing and production activation. `/waiting-room` gathers invitations and workspaces; `/create-workspace` creates an owner workspace.

Local fixtures require `COURVIX_LOCAL_AUTH=1` and a local hostname; never enable them in hosted production. Production email accounts require a persistent auth secret, HTTPS auth origin and a verified transactional sender. Google/Microsoft are conditional on real OAuth credentials. An optional Sites identity bridge requires explicit `COURVIX_SITES_AUTH=1`; raw identity headers are otherwise ignored.

Clubs start empty. Setup sequence: membership plan → coach and group → members → schedule → invitations. Member profiles can exist before an account is invited.

## Money and access

- Starter Rp250,000 / Club Pro Rp500,000 per 30-day paid term; initial trial 14 days.
- Subscription paid by club to Courvix; operator verification required.
- Member dues paid directly to the club; club Admin verification required.
- No gateway and no per-dues platform fee in V1.0. No simulated successes or automatic refunds.
- Ledger corrections append compensating entries; original payment entries remain immutable.
- An expired club can still read/export data. Writes require an active trial/subscription.
- Private documents/identity uploads are disabled. The old visitor demo snapshots are not reused as real club data.

## Verification

```sh
npm test
npx tsc --noEmit
COURVIX_TEST_URL=http://localhost:5180 npm run test:onboarding
COURVIX_TEST_URL=http://localhost:5180 npm run test:api
COURVIX_TEST_URL=http://localhost:5174 npm run test:network
COURVIX_TEST_URL=http://localhost:5174 npm run test:training
# Optional scheduler receipt test against synthetic local data only:
COURVIX_TEST_URL=http://localhost:5174 COURVIX_TEST_JOB_KEY=local-only-your-fixture-key npm run test:jobs
node tests/backup-restore.mjs
npm run build
npm run release:check
```

The API suite requires the migrated local server with the local test identity flag, a local operator account, and clearly synthetic bank fixtures for subscription verification. Never configure the local fixtures on a hosted Site. It creates isolated synthetic clubs, not real payments. Historical demo tests in `tests/legacy` describe the previous version and are not the V1 release suite.

Application routes: `/products`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/waiting-room`, `/create-workspace?product=club`, `/create-workspace?product=training`, `/join?code=...`, `/dashboard`, `/profile`, `/hub`, `/operator`, `/policies`. Health: `/api/health`. Export: `/api/export` (authenticated, permission scoped).

## Deployment

Read [docs/RELEASE.md](docs/RELEASE.md) for production settings, identity boundary, migration, preview acceptance, encrypted backups, restore and rollback. A successful local build does not mean mail/DNS/banking/pilot acceptance is complete.

See [docs/REMINDERS.md](docs/REMINDERS.md) for the isolated demo, reminder cadence, member renewal decisions and authenticated scheduler.
