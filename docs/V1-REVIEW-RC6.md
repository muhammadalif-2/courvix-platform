# Courvix rc.6 — Product-led presentation and contextual UX

## Public experience

Home, products, how-it-works and both product detail pages include a feature explorer: two product choices, four Club modules and five PT modules. Each module has a concrete illustrative screen, benefit, inspectable explanation and a direct link to its actual interactive demo module. Keyboard arrow/Home/End navigation works in the feature tab list. Preview records are explicitly sample data; they are not screenshots of real customer activity.

A separate application showcase explains the client portal, payment review and owner headquarters through visual examples. Product detail heroes now show a workspace preview rather than a decorative product icon. Copy and displayed journeys reflect existing capabilities and the contextual edits delivered in this release.

The presentation uses a stronger dark hero, orange brand highlights, a restrained grid/orb backdrop, product depth, reveal transitions, floating confirmation, hover feedback, sticky translucent navigation and premium pricing/contact/journal surfaces. Tabs remain user-controlled rather than auto-rotating. Reduced-motion preferences remove transitions/animation; content is visible without JavaScript. IntersectionObserver reveals run only with supported motion preferences, and print styles show all content. Feature inspection overlays stop ancestor reveal transforms so they cover the viewport correctly.

## In-product improvements

- Shared management search: Cmd/Ctrl+K, text filtering, arrow/Enter navigation, Escape close, focus handling. HQ/platform/profile search their page navigation; PT adds client, appointment, class and payment records already scoped by the API.
- PT client detail hub: overview, appointments, packs/payments and progress, with direct edit, invitation, book and assign-pack actions. Trainer roles retain their finance restrictions. Opening related records keeps a route back to the previous detail context.
- PT client/trainer invitation actions prefill the intended role and email. The user explicitly creates the invitation; missing sender setup is reported, and the single-use link can be copied manually. Demo invites stay simulated.
- Trainers can update an existing name/specialty. Invited email identity stays immutable; the API rejects an identity swap and non-admin updates.
- Upcoming classes have an inspectable detail view and admin edit form. Changes update reserved participant appointments together, retain their order/credit/policy, and reject capacity below reserved places, incompatible duration/expiry and scheduling conflicts. Closed or past classes cannot be edited. Editing does not claim to send a rescheduling email.
- Booking package choices follow the selected client. A private appointment’s end time follows the selected package duration. The server still performs authoritative credit, time, overlap and expiry validation.
- PT forms and Club create/edit forms show unsaved changes, guard closing/reloading and offer an explicit keep/discard choice. Failed saves preserve the draft. Successful contextual PT updates return to fresh related details; Club edits reopen the updated record.
- Club detail edit actions move to the top. Global search includes additional role-permitted modules and a keyboard shortcut. Club headquarters is filtered to the Club product. Numeric money inputs and validation use workspace currency precision. Calendar labels use the configured timezone.

## Verification and limits

Run the domain/demo/network/PT/release tests, TypeScript, production build, existing network/PT/V1 API suites, scheduler receipt test and public-route rendering checks. New regression tests cover trainer edits with identity protection, admin-only class changes, participant capacity, purchased duration and linked-booking credit/policy preservation. API tests additionally persist a class change and trainer edit through D1.

No schema migration is needed: edits use existing record JSON and transactional workspace revision checks. No dependencies were added. The original Club payment/attendance/role boundaries remain covered by the regression suite.

Browser controls are not available in this environment. HTTP rendering, CSS compilation and API tests do not establish visual/mobile, animation, keyboard or screen-reader acceptance; those require an actual browser/device review. The release remains a candidate. Sender, bank instructions, paused production schedule, real-account acceptance, recovery and pilots remain external launch gates as documented in RELEASE.md. This work does not fabricate them or send real test messages.
