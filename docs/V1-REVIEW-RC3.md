# Courvix V1.0-rc.3 — product review and acceptance

## Changes implemented

- Every account has a shared profile: portrait, display name, profession, bio, phone, city, sport, country, language, and time zone. Accounts need not have a club before editing a profile. Portraits are cropped/resized in the browser and stored privately in R2; D1 stores the object reference. The member/coach operational profile remains separately permission scoped.
- Staff see portraits beside roster/search results; the platform user directory shows real signed-in accounts, distinct from manually recorded member profiles. Account display names do not rewrite historical invoices or legal roster names.
- The Courvix owner gets a dashboard with KPIs, six-month registration history, sports distribution, active-member leaderboard, subscription review queue, club/trainer directory and details, user directory and profiles, support, audit activity, and configuration readiness. The leaderboard is explicitly a member-count ranking, not a sporting-performance ranking. Subscription run rate is not presented as cash received.
- An owner can manage organizations and locations. Headquarters totals and access are restricted to the actual owner; each branch retains separate membership, trial/subscription, records, payments, coaches, and invitations. Opening a branch changes the active workspace. Existing unlinked owned clubs can be attached without moving records. Ownership transfer detaches the branch from its previous organization and removes the previous owner's headquarters visibility for that branch.
- Club and private trainer workspaces share stable operational modules. Trainer workspaces use classes/private groups, personal members, sessions, attendance, plans, invoices, and reminders. An individual private session can use a Private group for that client.
- 52 sports, structured positions/disciplines, skill levels, age groups, training objectives, experience bands and general license levels. Free text remains appropriate for names, venues, federation/license issuer and notes. Legacy values remain visible; new club/team sport names are canonicalized.
- 249 country/territory codes, IANA time zones, 47 currencies and currency-specific monetary precision. Workspace currency is fixed at registration. No foreign-exchange conversion is performed. Headquarters totals are separated by currency. Courvix subscription invoices remain IDR.
- Inter is self-hosted under its OFL license. The supplied circular Courvix mark is reproduced as a scalable vector; the lockup uses Inter lettering. Light/dark preferences and language persist on the current device.
- Indonesian and English operational interface strings; ten additional core-navigation dictionaries (Malay, Spanish, French, German, Portuguese, Arabic, Japanese, Korean, Chinese, Hindi). Arabic enables RTL. These ten languages are deliberately labeled `core UI`; remaining strings fall back to English where mapped or the original language. User-written content is not automatically translated. Country choice does not claim full native-language support for every country.
- The existing browser-local demo upgrades without clearing completed journeys. It includes two club locations and a private trainer workspace, profiles, headquarters, platform metrics and the original invitation/payment/reminder journey. The demo uses an injected transport and never sends photo uploads, user edits, invites or payments to live APIs.

## Remaining gaps and priority

### Required before accepting real customers

1. Configure a verified email sender and the actual subscription receiving bank. Test one real invitation, reminder, payment submission and verification with independent accounts. The application honestly blocks unconfigured email/subscription payment flows.
2. Confirm ChatGPT login for the operator address `courvix.id@gmail.com`; identity still comes from Sites. Visitors need a ChatGPT account with the email invited by their club. A standalone email/OTP or OIDC adapter is needed if broader sign-in is a launch requirement.
3. Complete visual/mobile/keyboard acceptance on real devices. Browser-control infrastructure was unavailable in this execution; builds and API tests cannot establish visual acceptance.
4. Establish infrastructure recovery: encrypted D1 backups, isolated restore, and separate R2 object backup/versioning. D1 exports include avatar references but not the R2 image bytes. Retention/privacy and access deletion must cover both stores.
5. Pilot one club and one trainer: create organization/location, group/class, member, invitation, session, attendance, invoice, reminder, renewal decision, transfer review and export. Verify business terms, support capacity, prices and operational response times.

### Next product priorities

- Full translation and native review for the first target markets, including errors, outbound emails, terminology, privacy/terms and accessibility; the current core dictionaries are not a claim of complete localization.
- Trainer session-credit packs, individual appointment rescheduling, client self-booking, class capacity/waitlists, cancellations and package expiry. Current V1 uses group-based scheduling and recurring membership invoices.
- Organization-level delegated admins with explicitly scoped branch access. Current headquarters is owner-only; branch Admins remain branch-specific. No implicit cross-branch grant is made.
- Searchable large catalogs, federation-specific age/position/license registries, and sport-specific scoring, times, rankings and progression assessments. Current categories organize operations; they do not implement every sport's competition rules.
- Local payment providers, recurring billing, country-specific tax invoices and settlement. Changing currency formatting does not implement international banking or tax compliance.
- Larger-scale platform pagination, account lifecycle controls and analytics retention. The initial platform overview computes from current stored records and is intended for early V1 volumes.

## Review paths

- `/` → demo → select one of five roles.
- `/demo?role=Platform` → platform dashboard, subscription reviews, directories and own profile.
- `/demo?role=Owner&module=Network` → headquarters, branch switch and organization/branch forms.
- `/demo?role=Owner&workspace=demo-nusa` → private trainer, classes, personal members, schedules.
- Any operational role → Profile / avatar button → upload a sample portrait and edit profile.
- Toolbar → English / core language / theme; reload to verify preferences.
- Live `/login`, `/profile`, `/hub`, `/dashboard`, `/operator` retain server authorization.

## Validation

`npm test`, `npx tsc --noEmit`, production build and release checks. API suites run against a migrated local D1/R2 Worker with test-only identity and bank fixtures. The network suite covers portrait read/write/delete, authentication and cross-user restrictions, canonical sports, currency precision, owner-only headquarters, invitation-scoped branch isolation, platform aggregates and ownership transfer. The original full V1 lifecycle and reminder suite is retained. Backups are restored into an isolated D1 instance and counts compared, including organizations and account profiles.
