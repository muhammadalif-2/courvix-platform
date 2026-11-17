# Courvix rc.10 — Accounts, invitations, and workspace access

This is a fresh portable source project in `/workspace/courvix-platform`, initialized on `main`. The previous Courvix review Site and its source are preserved. A separate owner-private Sites review is registered as `appgprj_6afc772916888191be9bde44cf42c68e`; its hosting source remote is independent of the requested GitHub repository. It is not a replacement GitHub repository. The private review enables the Sites identity bridge; native email/OAuth activation remains conditional on real configuration. A GitHub App is connected as `muhammadalif-2`, but its repository-creation permission is denied by GitHub (`Resource not accessible by integration`, REST and GraphQL). A new private GitHub repository has **not** been created or pushed. Create an empty **private** `courvix-platform` repository with no README/template, grant this integration access to it, then verify its privacy and emptiness before adding it as the GitHub remote. Never push this project into `0xmugi/Courvix` as a substitute.

## User journey

1. The landing page leads to `/register`. A Club/PT CTA retains its selected product. An invitation retains its `/join?...` return path through signup/login.
2. Email signup requires a full name, unique password (12–128 characters), and agreement to terms in the form. A verification email is required before any account identity is accepted. Google and Microsoft are enabled only when their real credentials are configured. Google/Microsoft passwords never pass through Courvix.
3. Verified users arrive at `/waiting-room`: edit a profile/photo, see matching email invitations, track access requests, and open existing workspaces. There is no automatic workspace membership from account creation. Business owners can create a Club or Personal Training workspace from here.
4. `/create-workspace?product=club|training` retains the established empty-workspace setup, 14-day initial trial, separate subscription billing, and owner-only organization oversight.
5. Owner/authorized Admin opens **Settings → People & access** (Club) or **Business & access → People & access** (Personal Training).
6. Create a role link for Admin, Coach/Trainer, or Member/Client. Club Coach/Member links require a group; PT links do not. Choose expiry (1–30 days), approval cap (1–500), and feature access. Only a hash is stored. Copy the full URL at creation: it cannot be recovered from the listing. Revoke and replace a lost link.
7. A recipient opens the link, creates/signs into their personal account, and requests access. An authorized administrator reviews their name/email before approval. Link possession alone never grants access. Approved requests appear as workspaces in the waiting room; declined requests show a reason. Refresh is available, with background refresh every 20 seconds while visible.
8. Direct email invitations remain available. They are bound to one verified email, single use, expire after seven days, and can be accepted from the email link or the recipient’s waiting room. Sharing one does not let another email join.
9. The owner sets role defaults; individual access can override those defaults or revert to inheritance. Feature levels are No access, View, Edit, limited by the role’s existing ceiling and row privacy. An Owner always retains control. Admins cannot edit themselves, Owners, or other Admins; only the Owner can manage other Admins or delegate Admin invitations. Administrators cannot grant greater access than they hold.
10. Account logout clears native and local sessions plus workspace selection. Password recovery revokes previous native sessions; reset tokens are single use.

## Authentication and security boundaries

Better Auth 1.7.25 handles password hashing, signed HttpOnly cookies, verification/reset tokens, OAuth state/callback handling, origin validation and database-backed rate limiting. Sessions last seven days. Session caching is disabled so feature access is loaded from membership on each API request. The trusted IP header is `cf-connecting-ip`: deploy behind Cloudflare, which supplies/overwrites this header. Another hosting proxy must explicitly configure a trustworthy equivalent rather than accepting arbitrary browser forwarding headers.

Verified account email maps to the existing canonical Courvix user ID, preserving existing memberships. Unverified accounts cannot enter the waiting room or claim an invited email. Automatic linking between different native sign-in providers is disabled. Use the original provider for an existing account unless account linking is deliberately implemented and reviewed. Google and Microsoft are prepared but require live provider acceptance tests; local tests cannot prove provider configuration.

Raw Sites identity headers are ignored on portable hosting. `COURVIX_SITES_AUTH=1` explicitly enables the optional Sites dispatcher bridge and must only be used behind its sanitized identity boundary. Local fixture sessions and captured mail require both `COURVIX_LOCAL_AUTH=1` and an allowed local host; never enable this in production. `/api/auth-testing-mail` additionally only reads `.test` addresses and returns 404 outside local mode. No captured verification/reset URLs, local identities, secrets or database files belong in Git or release archives.

Permission enforcement covers scoped workspace records and mutations, specialised payment/training APIs, profile/directory access, invitations, reminders and exports. Approval consumes link capacity and creates membership within one atomic D1 batch with revision guards. Approved/used/revoked/expired requests cannot be replayed. Memberships remain confined to the invited workspace; a branch role never grants organization-wide oversight.

## Local development

Node 22.13+:

```sh
npm ci --include=dev --include=optional
npm run setup:local
npm run dev -- --port 5180
```

Setup generates an ignored random `COURVIX_AUTH_SECRET` and applies all D1 migrations locally. Register with a synthetic `.test` email. Local verification mail is captured instead of sent. API tests retrieve it from the guarded fixture endpoint. For manual testing, open the returned verification URL in the same browser. Existing synthetic identities remain available only on the local create-workspace screen; they are not the production signup flow.

```sh
COURVIX_TEST_URL=http://localhost:5180 npm run test:onboarding
```

This test covers email verification and unverified denial, forged identity headers, waiting rooms, email-bound invitation acceptance, general role approval, max-use enforcement, replay/revocation, individual/default access, API denials, delegated administrator invitations, Club/PT isolation, reset/session revocation and logout. It only runs against localhost and uses `.test` identities. Legacy API suites additionally require clearly synthetic local bank values and the local operator email. They never move funds or send real emails.

## Production activation

Enter secrets directly in your hosting provider’s settings, never chat or tracked files:

| Setting | Purpose |
| --- | --- |
| `COURVIX_AUTH_SECRET` | Cryptographically random secret, at least 32 characters; retain it across releases |
| `COURVIX_AUTH_URL` | Exact HTTPS application origin, e.g. `https://app.your-domain.com` |
| `RESEND_API_KEY` | Transactional sender secret |
| `COURVIX_FROM_EMAIL` | Sender on a domain with verified DNS |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional Google web OAuth client |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` | Optional Microsoft web OAuth client |
| `COURVIX_ADMIN_EMAILS` | `courvix.id@gmail.com` for the authorized Courvix operator |
| `COURVIX_SUPPORT_EMAIL` | `courvix.id@gmail.com` until a deliverable support-domain mailbox is provided |
| `COURVIX_BANK_NAME`, `COURVIX_BANK_ACCOUNT`, `COURVIX_BANK_HOLDER` | Actual Courvix subscription bank instructions; currently unavailable, so production submission remains blocked |

Register exact OAuth redirect URIs: `<COURVIX_AUTH_URL>/api/auth/callback/google` and `/api/auth/callback/microsoft`. Register the application domain and obtain provider production approval where required. Do not copy local fixture credentials into production. Each club/trainer separately configures its receiving account; it does not replace Courvix subscription instructions.

Before a paid public launch: configure the above, migrate the production D1 database, verify real email delivery and each configured OAuth provider, test independent users in a real browser/mobile, confirm subscription/dues/session payments, activate and inspect scheduled reminders, exercise backup/restore, and complete Club/PT pilots. This change is a tested local release candidate; it is **not evidence that those external activation tasks are complete**.
