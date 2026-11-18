# Courvix rc.14 — Annotated public experience and scoped dashboard detail

Prepared 19 November 2026 (Asia/Jakarta). Implements the 15 site annotations while preserving the existing Site, its audience, orange/Inter branding, English interface, source history and separate Club/PT products. No commercial plan prices, feature entitlements, production credentials, payment instructions or customer records are changed.

## Annotation coverage

| Comment | Implementation |
| --- | --- |
| 1 · Club hero preview | A visible animated sample day with counted metrics, before/during/after states, an agenda record and a direct demo link replaces the static preview. It is explicitly illustrative, never a claim of live customer data. |
| 2 · Sports below Club hero | Searchable/filterable catalogue shows all 52 configured sports, their categories and a selected sport’s profile choices. It explains operational coverage separately from dedicated scoring/federation engines. |
| 3 · Club flow | Numbered, selectable steps with matching icons, an animated record path and an explicit outcome. |
| 4 · Unclear sports animation | Abstract sport SVGs are replaced with a training-day story: schedule, attendance/outcome, then related next action. Setting selectors change the example. |
| 5 · Platform benefit cards | Situation selectors and a before/connected-record example show what each benefit means in practice. |
| 6 · Separate product flows | Club and PT each have a separate flow card, step vocabulary, payment relationship, record path and links into the corresponding demo. |
| 7 · Experience cards | Existing client/payment/HQ compositions remain; each gains controlled scene changes. Client balance preserves correct credit arithmetic; review stages are illustrative; branch selection changes the sample scope. |
| 8 · Starter/Pro differentiation | Product-specific setup agenda, an intent selector and a direct setup-experience matrix explain Pro’s scheduled onboarding. Pro is visually prominent and the price difference is explicit. Core features remain equal; no popularity, savings, SLA or service-hour claims are invented. |
| 9 · Billing detail cards | Three compact facts (trial, workspace, activated term), a numbered payment path and expandable V1 scope replace the dense four-card explanation. |
| 10 · More comparison detail | Both products now have 12 concrete workflow comparison rows, including assignments, payments, corrections/terms, connected records, scope and exports where applicable. This compares handoffs, not unverifiable vendor prices. |
| 11 · Compare interaction/pause label | Connected/separate toggle, product choice, selectable workflow nodes and record trails replace the abstract graph. Decorative connection motion continues without the “Pause animation” text; reduced motion is respected. |
| 12 · Outcome cards | Clear situation/connected-result blocks and a scope card replace the dense outcome grid. |
| 13 · Scroll-aware header | A passive, animation-frame-throttled threshold adds a bordered floating surface, shadow and soft transition across public pages. Native scrolling remains in control. |
| 14 · Demo contrast | Explicit paired backgrounds, borders and text colors for toolbar, theme control, date controls and reset in both appearances. |
| 15 · Detailed dashboards | Role-scoped attendance, calendar, group, invoice, appointment, purchase, credit and platform-distribution charts. Currency values wrap, card columns adapt to their actual content container, and remaining dashboard copy is English. |

## Data and animation behavior

Public examples use component state, not business APIs. Automatic scene progression runs only while the scene is visible, the tab is visible, and reduced motion is disabled. Choosing a stage keeps it under the visitor’s control. Continuous connection motion is decorative CSS. Scene hooks clean up observers, media listeners, timers and animation frames. Automatic changes do not use live screen-reader announcements.

The public preview does not poll a customer dashboard. “Animated sample” and illustrative captions distinguish examples from customer evidence. A reference is not a receipt; no UI animation approves a real payment or grants access.

Dashboard insights derive actual visible records. Club summaries apply `scoped` plus the current workspace, selected month and explicit next-seven-day window. Unknown attendance is not counted as present. Financial charts are omitted for coaches and when the financial feature is unavailable. PT summaries recheck workspace, client/trainer assignment and feature scope. Empty periods remain empty; there are no fabricated trend percentages. Platform distributions use the authorized operator response.

Fresh browser-local demos include synthetic past sessions, attendance and upcoming sessions so these charts can be explored by Owner, Admin, Coach and Member. Existing saved demo edits remain intact. To load the new fixture set, visitors can use the existing **Reset demo** confirmation; no real workspace is seeded or reset.

Pricing keeps Starter IDR 250,000 and Pro IDR 500,000 per workspace per activated 30-day term, with an initial 14-day trial. Pro’s additional value is scheduled setup/onboarding within an agreed scope. The contact brief now retains a validated product and Starter/Pro preference from the pricing link. It only opens an email draft; it does not send a message or create a charge.

## Verification and limits

TypeScript, domain/demo/PT/access/guidance tests, new dashboard-domain tests, production build and release artifact checks are used. New tests cover same-workspace counts, role/feature denial, member-only records, trainer assignments, synthetic attendance, empty periods and complete status distributions. Public HTTP smoke checks the existing 22 public/account routes and referenced assets, plus the new Club catalogue, separate flows, setup comparison and absence of the removed pause label.

Supported browser/computer tools and `cua_repl.js` remain unavailable, so visual viewport acceptance, hydration, actual timer behavior, focus and real-device interaction are **not verified**. Review the annotated routes at 320–430px, 768/1024px and 1119/1440px, both themes and reduced motion; specifically verify long currency strings, the sample phone/control spacing, the sports filters, independent flow cards, Pro contact context, scrolled navigation and each role’s data boundaries.

Existing legal/consent, full-backup, email/OAuth/banking/scheduler and paid-launch acceptance gates remain open as documented in earlier reviews. rc.14 invalidates older release-readiness evidence for this changed source.
