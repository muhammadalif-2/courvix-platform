# Courvix rc.12 — Interactive explanations and a shared responsive experience

Prepared 18 November 2026 (Asia/Jakarta). Orange, Inter, existing photography, two separate products and all business workflows remain. This is an interface update; the production activation and legal gaps in [rc.11](REVIEW-RC11.md) remain open.

## Page coverage

| Page | Interactive explanation |
| --- | --- |
| Home `/` | Existing hero scenes, feature explorer, connected operations and journeys, plus a role-specific workday preview linking to the app demo |
| Products `/products` | Choose dues versus visits/session packs to find the appropriate product |
| How it works `/platform` | Step through account creation, a shared role link, approval and permitted workspace entry |
| Clubs `/clubs` | Before/during/after a training day, with a local sample check-in roster |
| Personal Training `/personal-training` | Select 1/4/8/16 sessions, reserve, complete or release credits, and inspect the balance |
| Sports `/sports` | Pick a canonical sport and inspect its profile choices |
| Pricing and both product pricing pages | Estimate separate Club/PT workspace subscriptions with current Starter/Pro prices |
| Compare `/compare` | Existing product selector and connected/separate operations animation |
| Trust `/trust` | Inspect illustrative Owner/Admin/Coach/Member record boundaries |
| Help `/help` | Choose invitation, payment or session-balance issues and filter the real help articles |
| Contact `/contact`, custom `/custom` | Build a product/location/help brief and open a populated email draft |
| Club life `/club-life` | Interactive training preparation checklist and progress |
| Terms, policies | Choose a subscription, business-payment or personal-data issue and follow the responsibility path |
| Privacy, Indonesian review companion | Select access, correction or deletion and inspect the manual request process; English UI remains separate from Indonesian legal text |

Examples are explicitly illustrative and remain in component state. They do not create bookings, grant access, submit payments or send messages. Real account forms, the waiting room, invitations and dashboard actions continue to use their existing transports and permissions. Examples do not claim new capabilities such as instant erasure, gateways, dedicated rules for every sport, or device push.

## Shared visual design

The root experience sheet provides warm paper/charcoal surfaces, orange accents, bundled Inter, common card radii, button shapes, typography and spacing. Both Club and management shells use these styles, covering platform owner, organization owner, admin, coach/trainer and member/client views. Existing permission-dependent content and semantic payment/status colors remain.

Responsive rules collapse public navigation at 1100px, make management navigation an off-canvas drawer at 900px, stack public explanatory layouts and device previews at 680px, and simplify controls further at 480px. Dense data tables retain their own horizontal scrolling. Forms use 16px text and touch-friendly controls on small screens; dialogs have viewport bounds. The dashboard drawer locks background scrolling, traps focus, restores focus, closes with Escape and clears when returning to desktop width.

Smooth scrolling uses native anchor/section scrolling and a return-to-top link with reading progress. Scroll listeners are passive and animation-frame throttled; wheel/touch events are not intercepted. Reduced-motion preferences disable the smooth movement and new transitions. Physical wheel/touch behavior remains under the browser and operating system.

## Verification and remaining acceptance

TypeScript, domain/demo/access/personal-training tests, new pure interaction-model tests, production build and release artifact checks are required. The interaction tests verify credit invariants and exhaustion, current price calculations and workspace caps, and safe enquiry choices. Public HTTP smoke checks cover 21 routes, their expected explanatory content, invalid pricing routes and referenced assets.

A browser/computer renderer is unavailable in this execution environment. Therefore these checks do **not** prove client hydration, rendered viewport overflow, drawer focus or visual acceptance. Before paid launch, review 320/375/390/430px phones, 768/1024px tablets and 1280/1440px desktops, both themes and reduced motion. On `/demo`, exercise every role for both products, every module, record details/edit dialogs, tables, profiles and navigation. Review real authenticated roles separately; a local sample preview is not evidence that real access works.

The current release identifier is rc.12 so older release acceptance records cannot automatically certify this changed source.
