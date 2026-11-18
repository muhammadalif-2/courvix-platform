# Courvix rc.13 — Feature clarity, an exploratory Home and first-club guidance

Prepared 18 November 2026 (Asia/Jakarta). Branding remains orange and Inter. Club Management and Personal Training retain separate workflows. No production sender, banking instructions, OAuth provider, notification channel or payment integration is activated by this update.

## Feature interface

Club navigation is grouped by the job: Start here, People, Training, Club finance and Workspace. Each existing Club and PT feature has a purpose sentence and an expandable three-step “How to use this page” explanation with an outcome or relevant limitation. Platform operator pages have their own guidance. The shared UI identifies a permitted view, available changes or an expired read-only workspace; actual authority still comes from existing API checks.

Generic Club list actions now name the record being created (“Add member”, “Create membership plan”, “Create invoice”, etc.), and details use an explicit “View details” action. Creation controls follow existing feature-write permissions and the read-only subscription state. Selecting a Club navigation item closes the mobile drawer. Search/filter empty-state copy explains the appropriate next action. Settings has links to workspace, receiving bank, subscription, invitations, access roles and invitation history, so the owner need not scan the entire page.

## Home narrative and interaction

The reference https://ecomflow.com/ was inspected for its public narrative: connected operations, an explorable workspace, a visible journey and contextual stage previews. Courvix uses original domain-specific examples rather than ecomflow’s assets, claims, customer logos or numerical results.

- Hero: selectable story plus a compact next-action preview.
- Product section: choosing Club/PT changes the membership or purchase relationship and linked workflow.
- Connected operation: selectable people/training/payment/next-action nodes reveal their context, with connected/separate states and the existing animation control.
- Workspace: a purpose-built interactive people list, selected profile, contextual records, sample attendance, invoice review state, session ledger and expandable session/invoice details. The PT view explains paid, reserved and available sessions.
- Feature explorer: the existing feature-specific previews remain with consistent controls and cards.
- Journey: step-specific scenes show group assignment, role invitations and attendance for Club, versus offer counts, purchase/credit stages and outcomes for PT.
- Tour: existing narrated video and chapter controls remain.
- Roles: role preview sits within its own section and links to the correct product demo.
- Pricing: select Starter/Pro and workspace count with current public prices; the estimate never creates a payment.
- Decision support: access, payment responsibilities and first steps have a contextual preview, followed by help/policy links and FAQ accordions.

Examples are visibly labeled, use in-memory state, and never update customer records, verify money, grant a role or send a message. Layouts stack on small screens, bound their own scrolling, and respect reduced motion. New scene movement is short, initiated by a selection, and disabled under reduced motion.

## Owner/admin first-use tutorial

`/getting-started` is an English public 12-step tutorial with Owner/Admin reading modes and links into the working demo. It is linked from the footer and Home. The Club sidebar has a permanent **Getting started** page; Overview displays a setup summary and a direct entry to the guide after workspace creation or subscription.

The sequence covers subscription access, account identity, owner-controlled receiving details, membership plans, coach profiles, groups, member assignments, role invitations, the first session, attendance, invoices/receipt review and a daily routine. It explains that the software subscription and club dues are different payments, that recording a profile does not invite an account, and that an invitation link does not establish delivery or acceptance.

The in-app guide derives six record milestones from the currently selected club and visible feature data. It checks linked records for coach/group/member/schedule milestones. Another club’s records cannot complete the guide. Hidden dependencies are not inferred. Owner tasks remain locked for a non-owner admin. Subscription/bank review, invitation acceptance and operational checks stay “Review required”; clicking through the guide cannot certify them. “Records found” is not a claim of launch readiness. No artificial payments or messages are created to finish a checklist.

## Verification

TypeScript, the existing domain/demo/permission/PT tests, new guidance-domain tests, production build and asset/release checks are used. Guidance tests cover workspace isolation, linked records, ownership boundaries, restricted dependencies and manual-review tasks. Public HTTP smoke covers 22 public/account routes, Home interaction content, the setup tutorial, invalid pricing routes and referenced assets.

The managed environment has no supported browser renderer/control tools, so visual viewport, hydration, keyboard interaction and real-device acceptance remain unverified. Before launch, test the new Home at 320–430px phone, 768/1024px tablet and 1280/1440px desktop widths, both themes and reduced motion. In the demo, try Owner and Admin, switch workspaces, open Getting started and follow every link. Independently test real accounts with restricted feature permissions; public examples and server-rendered HTML are not evidence of real access acceptance.

Outstanding operational, legal/consent, backup, configuration and paid-launch gates from [rc.11](REVIEW-RC11.md) remain. The release version changes to rc.13 so prior release evidence does not automatically certify this source.
