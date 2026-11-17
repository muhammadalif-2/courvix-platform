import { PublicHeader, PublicFooter } from "../marketing";
export const metadata = { title: "Privacy & terms — Courvix" };
export default function Policies() {
  return (
    <div className="mkt cv-public">
      <PublicHeader />
      <main id="main-content">
        <section className="m-page-hero">
          <span className="m-eyebrow">COURVIX / PRIVACY & TERMS</span>
          <h1>
            Clear expectations.
            <br />
            Shared responsibility.
          </h1>
          <p>
            How Courvix handles accounts, workspace records, subscriptions and
            your training journey.
          </p>
        </section>
        <article className="policy-article">
          <p className="policy-meta">COURVIX V1.0 · UPDATED 16 NOVEMBER 2026</p>
          <div className="policy-summary">
            <p>
              Club Management and Personal Training have distinct workflows.
              Your business receives its own member/client payments. Courvix
              supplies the workspace; bank transfers are reviewed manually.
            </p>
          </div>
          <h2 id="privacy">Products and records</h2>
          <p>
            Courvix provides Club Management and Personal Training. Club
            workspaces manage members, teams, schedules, attendance and dues.
            Training workspaces manage clients, visits/session packs,
            appointments, credit balances and progress notes. Contact:{" "}
            <a href="mailto:courvix.id@gmail.com">courvix.id@gmail.com</a>.
          </p>
          <p>
            We process your verified account identity, optional profile/photo and
            contact details, workspace records, training schedules, payment
            references and activity history. Email sign-in uses a securely hashed password; social sign-in uses the provider’s authorization flow. We do not request your Google, Microsoft, or ChatGPT password. Provide only information needed for
            operations; identity-document uploads are unavailable in V1.0.
          </p>
          <h2>Purpose and access</h2>
          <p>
            Records support workspace operations, account permissions, payment
            verification, support and service reliability. Owners/admins manage
            their workspace. Coaches access their assigned groups; personal
            trainers access assigned clients and appointments. Members/clients
            access their own records. Organization-wide oversight is owner-only;
            a branch invitation does not grant access to other locations.
          </p>
          <p>
            The Courvix operator can access account/workspace directories,
            operational summaries, subscriptions and support requests through
            privileged access. Profile photos are stored privately and displayed
            only to authorized users. You can replace or remove your photo in My
            profile. Owners must have an appropriate basis for collecting
            participant information, including parent/guardian consent where
            needed for children.
          </p>
          <h2>Service providers</h2>
          <p>
            Hosting, D1 records and R2 photo storage use Cloudflare through
            Sites or your selected Cloudflare deployment. Account authentication uses Better Auth. Google and Microsoft are optional sign-in providers when enabled; Sites identity is an optional hosting integration. If configured, Resend delivers verification, recovery, invitations and payment reminders. Processing may involve
            infrastructure outside your country. We do not sell member/client
            records.
          </p>
          <h2 id="terms">Workspace subscriptions</h2>
          <p>
            Courvix workspace subscriptions are separate from member dues and
            training package purchases. Starter costs IDR 250,000 and Pro costs
            IDR 500,000 per 30-day activated term, following an initial 14-day
            trial. Pro includes setup/onboarding support by appointment. Each
            location has its own subscription; headquarters has no extra
            platform charge. Subscriptions use manually verified bank transfers
            and do not charge automatically. V1.0 adds no per-dues or
            per-session platform fee.
          </p>
          <h2>Training purchases, reservations and cancellations</h2>
          <p>
            Training businesses set their own per-visit and 4-, 8- or 16-session
            pack prices, session duration and validity. Order terms are recorded
            at purchase. Session credits activate only after the business
            administrator verifies payment. Validity starts on activation;
            expiry is shown in the client portal.
          </p>
          <p>
            Booking reserves one available paid credit. Completed sessions
            consume one credit. A chargeable no-show or late cancellation may
            consume one credit under the displayed business policy. Eligible
            cancellations release reserved credit. Businesses control the
            cancellation notice period, opening hours and no-show policy. Each
            booking retains its cancellation/no-show terms; later changes apply
            to new bookings. Older appointments retain the policy captured when
            their records are upgraded. Clients should review the displayed
            terms before booking. Packs do not renew or create monthly dues
            automatically.
          </p>
          <p>
            Transfers go directly to the club/training business receiving
            account. Submitting a reference does not prove payment. Courvix
            records verification and credit activity; it does not move funds or
            automatically refund them. Corrections append audit entries.
            Payment, cancellation and refund disputes should be raised with the
            relevant business; Courvix subscription questions go to support.
          </p>
          <h2>Retention, exports and deletion</h2>
          <p>
            Authorized users can export their permitted records. An expired
            workspace retains read/export access; records are not deleted solely
            because the trial ends. Credit and payment history is retained for
            operational traceability.
          </p>
          <p>
            Send correction/deletion requests from your registered email to
            support. Workspace deletion requires verified owner authorization.
            Certain financial/activity records may be retained as needed for
            applicable obligations and dispute resolution. Restricted backups
            follow their retention cycle. Photo references and image objects are
            separate stores and must both be considered in recovery/deletion
            requests.
          </p>
          <h2>Account security and acceptable use</h2>
          <p>
            Use your own account and revoke access when staff leave. Do not
            access other workspaces without permission, upload records you are
            not entitled to share, or disrupt the service. Report suspected
            unauthorized access to support. Keep training notes relevant to
            coaching; avoid unnecessary medical or identity information.
          </p>
          <h2>Manual payments, refunds and support</h2>
          <p>
            Check the recipient and amount before transferring. A transfer
            reference alone does not establish receipt. Staff verify the
            receiving account before approving a payment. If an instruction is
            missing, contact support instead of transferring to an unconfirmed
            account.
          </p>
          <p>
            For a Courvix subscription dispute or refund request, email support
            from the registered owner account with the workspace and invoice
            reference. For training purchases or club dues, contact the
            receiving business first. Requests are reviewed individually under
            the applicable terms and law; no automatic refund is implied. Do not
            send bank credentials or unnecessary financial documents.
          </p>
          <p>
            Starter provides the core workspace for self-managed setup. Pro adds
            scheduled setup/onboarding support; scope and appointment are agreed
            before payment. Continuous live support and a guaranteed response
            time are not included unless separately agreed. Report service
            interruptions, access incidents and data requests to the support
            address.
          </p>
          <h2>Help and changes</h2>
          <p>
            Contact{" "}
            <a href="mailto:courvix.id@gmail.com">courvix.id@gmail.com</a> for
            access, billing, data or privacy requests. Material pricing or terms
            changes will be communicated before they apply to a future period.
          </p>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
