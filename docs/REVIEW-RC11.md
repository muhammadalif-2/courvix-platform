# Courvix rc.11 — Public experience, pricing, trust and legal review

Prepared 18 November 2026 (Asia/Jakarta). This update keeps Courvix’s orange, bundled Inter, existing sport photography, account/workspace flows, and two-product model. It does not activate a sender, Google/Microsoft credentials, bank instructions, reminder scheduling, or browser/device push.

## Reference and design

The user confirmed https://ecomflow.com/ as the reference. Its public site was inspected for narrative and interaction: confident typography, generous spacing, connected operations, an interactive connected/separate comparison and product visibility. The uploaded MP4 exceeded the 32 MiB tool transfer limit and was not inspected; the confirmed URL provided the accessible reference. No ecomflow assets, customer logos, results or claimed savings are reused as Courvix evidence.

The existing homepage gains a product-specific connected-operations illustration, connected/separate state toggle, explicit sample labeling, animation pause control and reduced-motion behavior. Trust/help/policy links form a new decision-support section. The existing hero, sport cards, device views, feature explorer, journeys, narrated tour and role demos remain.

`/pricing`, `/pricing/club` and `/pricing/personal-training` explain benefits, Starter/Pro inclusions, core-feature parity, scheduled Pro onboarding, per-workspace billing, 14-day trial and 30-day activated paid terms. Prices remain Starter IDR 250,000 / Pro IDR 500,000 for both products. No new plan limits, annual discounts, extra capabilities or commercial support promises are invented. Comparison tables describe separate-tool handoffs versus Courvix; they do not assert vendor-specific prices, infer that every competitor lacks a feature, or fabricate savings.

New pages: `/compare`, `/trust`, `/help`, `/terms`, `/privacy`, `/legal/id`. `/policies` remains the policy entry point and preserves the old `#terms`/`#privacy` navigation targets. Help search and topic filters operate locally over explicit V1 answers. Marketing no longer describes ChatGPT as the sole account option. Account form policy links point to the separate documents.

## Notification audit — answer to the user’s question

**Browser/phone push is not implemented.** No service worker/push subscription, Web Push/VAPID service, FCM/APNs integration or general event-notification delivery pipeline was found. The workspace bell was an aggregate of currently loaded invoices/schedules, with an unconditional dot. It is now labeled an in-app summary, exposes expanded state, shows a dot only with relevant records and explains that it is not browser/phone push.

- Email-bound invitations: waiting-room record and conditional email outbox; sender configuration required.
- Shared role-link requests/approval: in-app request state; no general approval/request email automation.
- Dues/PT purchases: in-app state and generated reminder history. Scheduled email follow-ups need sender, preferences and a working scheduler.
- Announcements, appointments and payment/subscription status: viewable records, not universal email/push delivery.
- A provider `Sent` response is not evidence of inbox delivery, reading or every user receiving information. Real recipient acceptance and provider delivery monitoring remain pending.

The selected private review Site has one allowed account, no attached schedule, and no configured Resend sender, native auth secret or OAuth provider keys in its current environment revision. This audit does not silently change any of those settings.

## Legal review — limits and improvements

The user supplied the operator identity and authorized its use for legal pages: Muhammad Alif, individual operator in Indonesia, with a correspondence address in Kota Bogor, Jawa Barat 16112. The full supplied address is in `lib/service-info.ts`, not duplicated here.

Terms/privacy now identify the operator and contact, distinguish the software subscription from business training payments, preserve mandatory rights, avoid blanket no-refund/total-liability waivers, describe complaint routes, account authority, expiry/export behavior, booking-policy snapshots, data purposes, child/guardian obligations, provider/cross-border considerations and incident obligations. An Indonesian review companion is separate from the English-only application interface.

These are **pre-launch review drafts, not legal certification**. The Indonesian companion is a review summary, not a representation that a final equivalent bilingual contract has been completed. Before commercial use obtain qualified Indonesian legal review, approve final equivalent language texts, determine controller/processor arrangements, applicable business/system registration duties, retention schedule, data-transfer conditions, incident process and refund/support handling.

Native signup currently has a required front-end terms checkbox, but no durable, versioned server record proving that each account accepted a particular terms/privacy text. Workspace registration checks its terms boolean, but does not replace a full consent/acceptance evidence process. Guardian consent is not collected or proven by a standard invitation. Those legal/implementation gaps remain explicit launch work; this public-page update does not claim to have solved them.

Backup scope also remains the previously identified release blocker: `scripts/backup.mjs` does not yet include the newly added durable auth/role-default/join tables. Complete backup and isolated restoration acceptance before customer onboarding. Runtime configuration and legal wording are not substitutes for these operational controls.

Primary legal references inspected:
- Consumer Protection Law No. 8/1999, including Article 18: https://jdih.kemenkeu.go.id/api/download/fulltext/1999/8TAHUN~1999UU.htm
- Personal Data Protection Law No. 27/2022, including Articles 24–25, 46 and transfer/processing responsibilities: https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang%2Bnomor%2B27%2Btahun%2B2022
- Language Law No. 24/2009, Article 31: https://berkas.dpr.go.id/jdih/document/uu/UU_2009_24.pdf

## Validation

The first full asset smoke check found missing JavaScript preloads for shared CSS-only chunks (`onboarding` and `access`). Those styles, together with the new public style sheet, are imported once from the root layout. This preserves their rules while avoiding duplicate/empty client chunks. Release checks now verify that every client-reference JS/CSS asset physically exists. This is a build compatibility repair, not a claim of browser visual acceptance.

Run TypeScript, existing regression tests, build and release packaging checks. The public HTTP smoke suite checks rendered new routes and referenced assets, old login/signup pages and invalid pricing-product denial. It does not prove client-side interaction, mobile visual quality, legal sufficiency, real email receipt or OAuth acceptance. Supported browser tools remain unavailable; do not report those checks as passed.

The legal review should also assess applicable business permissions and PSE registration using the current official criteria: https://pse.komdigi.go.id/panduan/kriteria-pendaftaran-pse-lingkup-privat . No registration or approval is asserted by the website.
