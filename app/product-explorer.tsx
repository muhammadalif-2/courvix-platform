"use client";
import { useState, useRef, type KeyboardEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  CalendarDays,
  Wallet,
  Ticket,
  Activity,
  Layers,
  Check,
  ShieldCheck,
  Search,
  ChevronRight,
  X,
  MapPin,
  Clock3,
  FileText,
  CheckCircle2,
  Dumbbell,
} from "lucide-react";
import {useScene,AnimatedNumber} from "./scene-motion";
import { BrandLogo } from "@/components/brand";
import { useModalKeyboard } from "./modal-keyboard";
import "./product-explorer.css";
type Product = "club" | "training";
type Feature = {
  id: string;
  label: string;
  icon: any;
  title: string;
  text: string;
  outcome: string;
  module: string;
  points: string[];
};
const features: Record<Product, Feature[]> = {
  club: [
    {
      id: "control",
      label: "Club control room",
      icon: Activity,
      title: "The full club picture. One page.",
      text: "Combine members, teams, training, attendance and payment records. Select a member to see their related records together, then open or edit in context.",
      outcome: "A connected view without opening every module one by one.",
      module: "ControlRoom",
      points: [
        "Whole-workspace operations and attention items",
        "Member 360 with related records shown together",
        "Role-scoped finance and source-record actions",
      ],
    },
    {
      id: "people",
      label: "Members & teams",
      icon: Users,
      title: "Know the person behind the roster.",
      text: "Keep member profiles, teams and coach assignments together. Open the detail you need, then make the next update in context.",
      outcome: "One shared roster. A clear view for each role.",
      module: "Members",
      points: [
        "Profiles and account photos",
        "Training groups and coach assignments",
        "Invitations with scoped access",
      ],
    },
    {
      id: "schedule",
      label: "Training & attendance",
      icon: CalendarDays,
      title: "From the training plan to who showed up.",
      text: "Connect the time, place and coach with attendance records. Open a session instead of reconstructing the plan from a chat thread.",
      outcome: "The next session and its attendance, connected.",
      module: "Schedule",
      points: [
        "Session details and venue",
        "Coach and group context",
        "Role-scoped attendance records",
      ],
    },
    {
      id: "payments",
      label: "Dues & payments",
      icon: Wallet,
      title: "Make payment conversations specific.",
      text: "See what is unpaid, what has been submitted and what has been verified. Approval belongs to your administrator, after checking the actual transfer.",
      outcome: "Payment status that members and staff can understand.",
      module: "Invoices",
      points: [
        "Recurring member dues",
        "Transfer submission and manual review",
        "Corrections that preserve history",
      ],
    },
    {
      id: "locations",
      label: "Locations & reports",
      icon: Layers,
      title: "A wider view. Separate branch access.",
      text: "Owners can oversee their locations without mixing branch records. Open the workspace that needs attention and work from its own data.",
      outcome:
        "Owner oversight without giving every branch access to everything.",
      module: "Network",
      points: [
        "Owner-only headquarters",
        "Separate workspace records and access",
        "Currency-aware totals and scoped exports",
      ],
    },
  ],
  training: [
    {
      id: "control",
      label: "Training control room",
      icon: Activity,
      title: "Every client. The full training context.",
      text: "Bring client goals, appointments, packs, balances, progress and payment reviews into one page, with direct access to the source record when you need to act.",
      outcome: "See the situation, then take the next action.",
      module: "ControlRoom",
      points: [
        "Client 360 with no detail-tab switching",
        "Appointment, package and progress context",
        "Trainer workload and role-scoped financial records",
      ],
    },
    {
      id: "people",
      label: "Client workspace",
      icon: Users,
      title: "Every client. More context. Fewer clicks.",
      text: "Bring a client’s goal, appointments, purchases and progress into one detail view. Move from understanding the situation to the right action.",
      outcome: "A clearer conversation before the next session.",
      module: "Members",
      points: [
        "Client overview and assigned trainer",
        "Linked appointments, packs and progress",
        "Client details and quick invitations",
      ],
    },
    {
      id: "packs",
      label: "Visits & session packs",
      icon: Ticket,
      title: "A training offer that fits your coaching.",
      text: "Sell a visit or a 4-, 8- or 16-session pack, or set a custom count. Give every purchase a clear price, duration and expiry.",
      outcome: "Your client knows what they bought and what remains.",
      module: "PTOffers",
      points: [
        "Per-visit and flexible session counts",
        "Terms captured at purchase",
        "Credits activated after verified payment",
      ],
    },
    {
      id: "schedule",
      label: "Appointments & classes",
      icon: CalendarDays,
      title: "A paid session. A place in the calendar.",
      text: "Reserve a session from an available pack, check trainer/client conflicts and manage private appointments or published small-group classes.",
      outcome: "A reservation connects to a real session balance.",
      module: "PTBookings",
      points: [
        "Private requests and confirmation",
        "Small-group capacity controls",
        "Rescheduling and recorded booking policies",
      ],
    },
    {
      id: "credits",
      label: "Credits & progress",
      icon: Activity,
      title: "Show what changed after the session.",
      text: "A booking reserves a credit. Completion uses it once. Record the outcome and next focus where clients can see their training journey.",
      outcome: "Less guesswork about the balance and the next focus.",
      module: "PTProgress",
      points: [
        "Available, reserved and used credits",
        "Completion and no-show outcomes",
        "Progress notes with traceable corrections",
      ],
    },
    {
      id: "payments",
      label: "Payment review",
      icon: Wallet,
      title: "Verify the payment. Activate the plan.",
      text: "Clients transfer directly to your business and submit a reference. Your administrator checks receipt before activating session credits.",
      outcome: "Clear payment states before training is booked.",
      module: "PTPayments",
      points: [
        "Dedicated training checkout",
        "Pending, review and verified states",
        "Follow-ups that pause during review",
      ],
    },
  ],
};
const demoLink = (product: Product, module: string, role = "Owner") =>
  "/demo?product=" +
  product +
  "&role=" +
  role +
  (product === "training" ? "&workspace=demo-nusa" : "") +
  "&module=" +
  encodeURIComponent(module);
function Screen({
  feature,
  product,
  onInspect,
}: {
  feature: Feature;
  product: Product;
  onInspect: () => void;
}) {
  const training = product === "training";
  return (
    <div className="fx-screen">
      <div className="fx-screen-bar">
        <span className="fx-window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>
          courvix / {training ? "personal-training" : "club-management"}
        </span>
        <span>Sample workspace</span>
      </div>
      <div className="fx-screen-body">
        <aside className="fx-mini-nav">
          <BrandLogo compact />
          {[Users, CalendarDays, Wallet, Activity, Layers].map((Icon, i) => (
            <span
              className={
                i === features[product].indexOf(feature) ? "active" : ""
              }
              key={i}
            >
              <Icon size={17} />
            </span>
          ))}
        </aside>
        <div className="fx-screen-content">
          <div className="fx-screen-heading">
            <div>
              <span>
                {training ? "PACE TRAINING STUDIO" : "NORTHSIDE SPORTS CLUB"}
              </span>
              <h3>{feature.label}</h3>
            </div>
            <button onClick={onInspect} aria-label="Inspect sample detail">
              <Search size={15} />
              <span>Inspect</span>
            </button>
          </div>
          {feature.id === "control" ? (
            <>
              <div className="fx-balance-stats">
                {[
                  [training ? "Clients" : "Members", training ? "24" : "128"],
                  ["Upcoming", training ? "6" : "4"],
                  ["To review", training ? "2" : "5"],
                ].map(([label, n]) => (
                  <div key={label}>
                    <strong>{n}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
              <div className="fx-summary">
                <span>
                  {training ? "CLIENT 360" : "MEMBER 360"} / JAMIE LEE
                </span>
                <b>
                  {training
                    ? "Goal, appointments and session balances"
                    : "Team, attendance and dues in context"}
                </b>
                <p>
                  {training
                    ? "5 sessions available · 1 reserved · Progress recorded"
                    : "U-16 Basketball · Coach Alex · Attendance and invoices linked"}
                </p>
              </div>
              <div className="fx-booking-note">
                <ShieldCheck size={16} />
                <p>
                  Connected records appear together. Open details or update with
                  the permissions of your role.
                </p>
              </div>
              <button className="fx-inline-action" onClick={onInspect}>
                Inspect the control room <ArrowUpRight size={14} />
              </button>
            </>
          ) : feature.id === "people" ? (
            <>
              <div className="fx-roster-tools">
                <span>
                  <Search size={13} />
                  Search your people…
                </span>
                <span>
                  Active <ChevronRight size={12} />
                </span>
              </div>
              <div className="fx-person">
                <span className="fx-portrait">JL</span>
                <div>
                  <b>Jamie Lee</b>
                  <small>
                    {training
                      ? "Client · Strength & consistency"
                      : "Member · U-16 Basketball"}
                  </small>
                </div>
                <span className="fx-pill">Active</span>
              </div>
              <div className="fx-profile-grid">
                <div>
                  <small>
                    {training ? "Assigned trainer" : "Assigned coach"}
                  </small>
                  <b>Alex Morgan</b>
                </div>
                <div>
                  <small>{training ? "Experience" : "Training group"}</small>
                  <b>{training ? "Intermediate" : "U-16 Academy"}</b>
                </div>
              </div>
              <div className="fx-summary">
                <span>
                  {training ? "THE NEXT STEP" : "NEXT TRAINING SESSION"}
                </span>
                <b>
                  {training
                    ? "Build consistency, one session at a time."
                    : "Tuesday · 16:00 · Court 1"}
                </b>
                <p>
                  {training
                    ? "Review appointments, session packs and progress from this client’s detail view."
                    : "The roster, training schedule and member’s payment record stay connected."}
                </p>
              </div>
              <button className="fx-inline-action" onClick={onInspect}>
                Open {training ? "client" : "member"} details{" "}
                <ArrowUpRight size={14} />
              </button>
            </>
          ) : feature.id === "schedule" ? (
            <>
              <div className="fx-week-strip">
                {["MON", "TUE", "WED", "THU", "FRI"].map((d, i) => (
                  <span className={i === 1 ? "active" : ""} key={d}>
                    <small>{d}</small>
                    <b>{12 + i}</b>
                  </span>
                ))}
              </div>
              <div className="fx-session">
                <time>09:00</time>
                <div>
                  <b>
                    {training ? "Private strength session" : "U-16 Basketball"}
                  </b>
                  <small>
                    <MapPin size={11} />
                    {training ? "Studio A · Jamie Lee" : "Court 1 · Coach Alex"}
                  </small>
                </div>
                <span className="fx-pill">
                  {training ? "Confirmed" : "Scheduled"}
                </span>
              </div>
              <div className="fx-session">
                <time>11:00</time>
                <div>
                  <b>
                    {training ? "Small-group conditioning" : "Junior Academy"}
                  </b>
                  <small>
                    <Users size={11} />
                    {training ? "4 / 6 places reserved" : "Group roster linked"}
                  </small>
                </div>
                <span className="fx-pill neutral">
                  {training ? "2 places left" : "Attendance"}
                </span>
              </div>
              <div className="fx-booking-note">
                <ShieldCheck size={17} />
                <p>
                  {training
                    ? "A booking reserves one paid credit. Its cancellation/no-show policy stays with the appointment."
                    : "Open a training session to see its group, coach, venue and attendance context."}
                </p>
              </div>
              <button className="fx-inline-action" onClick={onInspect}>
                Inspect a sample session <ArrowUpRight size={14} />
              </button>
            </>
          ) : feature.id === "packs" ? (
            <>
              <div className="fx-pack-banner">
                <Ticket size={25} />
                <div>
                  <small>YOUR TRAINING OFFER</small>
                  <b>8-session strength pack</b>
                </div>
              </div>
              <div className="fx-profile-grid">
                <div>
                  <small>Session duration</small>
                  <b>60 minutes</b>
                </div>
                <div>
                  <small>Validity after activation</small>
                  <b>60 days</b>
                </div>
              </div>
              <div className="fx-credit-tracks">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i}>
                    <Check size={14} />
                  </span>
                ))}
              </div>
              <div className="fx-summary">
                <span>PER VISIT OR A SESSION PACK</span>
                <b>1 · 4 · 8 · 16 · Custom</b>
                <p>
                  Set your own price and terms. Purchased terms stay fixed when
                  you edit future offers.
                </p>
              </div>
              <button className="fx-inline-action" onClick={onInspect}>
                See the purchase journey <ArrowUpRight size={14} />
              </button>
            </>
          ) : feature.id === "payments" ? (
            <>
              <div className="fx-money">
                <span>{training ? "8-session pack" : "Member dues"}</span>
                <strong>Payment under review</strong>
                <small>
                  Transfer reference submitted · receipt not yet verified
                </small>
              </div>
              <ol className="fx-payment-timeline">
                {[
                  "Order created",
                  "Reference submitted",
                  "Administrator verification",
                ].map((x, i) => (
                  <li className={i === 2 ? "current" : ""} key={x}>
                    <span>{i < 2 ? <Check size={12} /> : "3"}</span>
                    <div>
                      <b>{x}</b>
                      <small>
                        {
                          [
                            "Terms and amount recorded",
                            "No credits activated yet",
                            "Check the actual receiving account",
                          ][i]
                        }
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
              <button className="fx-inline-action" onClick={onInspect}>
                Inspect the review steps <ArrowUpRight size={14} />
              </button>
            </>
          ) : feature.id === "credits" ? (
            <>
              <div className="fx-balance-stats">
                {[
                  ["Available", "5"],
                  ["Reserved", "1"],
                  ["Completed", "2"],
                ].map(([label, v]) => (
                  <div key={label}>
                    <strong>{v}</strong>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
              <div className="fx-credit-tracks">
                {Array.from({ length: 8 }, (_, i) => (
                  <span
                    key={i}
                    className={i < 2 ? "used" : i === 2 ? "reserved" : ""}
                  >
                    {i < 2 ? (
                      <Check size={14} />
                    ) : i === 2 ? (
                      <Clock3 size={14} />
                    ) : null}
                  </span>
                ))}
              </div>
              <div className="fx-summary">
                <span>LATEST PROGRESS · ALEX MORGAN</span>
                <b>Stronger movement. A clear next focus.</b>
                <p>
                  Improved squat control. Next session: steady tempo and
                  consistent bracing.
                </p>
              </div>
              <button className="fx-inline-action" onClick={onInspect}>
                Inspect progress & credit history <ArrowUpRight size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="fx-hq-total">
                <span>YOUR ORGANIZATION</span>
                <strong>
                  Two locations.
                  <br />
                  One owner’s overview.
                </strong>
              </div>
              {[
                ["Northside Central", "86 members", "Active"],
                ["Northside East", "42 members", "Trial"],
              ].map(([name, count, status]) => (
                <div className="fx-location" key={name}>
                  <span>
                    <Layers size={16} />
                  </span>
                  <div>
                    <b>{name}</b>
                    <small>{count} · Separate workspace</small>
                  </div>
                  <span className="fx-pill">{status}</span>
                </div>
              ))}
              <div className="fx-booking-note">
                <ShieldCheck size={16} />
                <p>
                  Owner-only oversight. Each location keeps separate membership
                  access and its own subscription.
                </p>
              </div>
              <button className="fx-inline-action" onClick={onInspect}>
                Inspect branch oversight <ArrowUpRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="fx-screen-footer">
        <span>
          <ShieldCheck size={11} />
          Role-based access
        </span>
        <span>Illustrative sample data</span>
      </div>
    </div>
  );
}
export function ProductOverviewPreview({
  product,
  onInspect,
}: {
  product: Product;
  onInspect: () => void;
}) {
  return (
    <Screen
      feature={features[product][0]}
      product={product}
      onInspect={onInspect}
    />
  );
}

export function ProductExplorer({
  product: controlled,
  onProductChange,
  locked = false,
}: {
  product?: Product;
  onProductChange?: (p: Product) => void;
  locked?: boolean;
}) {
  const [local, setLocal] = useState<Product>("club"),
    [active, setActive] = useState("control"),
    [inspect, setInspect] = useState(false);
  const product = controlled || local,
    list = features[product],
    feature = list.find((f) => f.id === active) || list[0];
  const tabs = useRef<HTMLDivElement>(null);
  useModalKeyboard(inspect, () => setInspect(false));
  function change(p: Product) {
    onProductChange ? onProductChange(p) : setLocal(p);
    setActive("control");
  }
  function tabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = [
      "ArrowRight",
      "ArrowDown",
      "ArrowLeft",
      "ArrowUp",
      "Home",
      "End",
    ];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? list.length - 1
          : (index +
              (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) +
              list.length) %
            list.length;
    setActive(list[next].id);
    tabs.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  }
  return (
    <section className="m-section premium-explorer" id="feature-explorer">
      <div className="premium-section-heading">
        <span className="m-eyebrow">
          DON’T JUST READ ABOUT IT. LOOK INSIDE.
        </span>
        <h2>
          Meet the workspace
          <br />
          behind the next session.
        </h2>
        <p>
          Explore the details that connect your people, training and payments.
          Then try the real workflow in the demo.
        </p>
      </div>
      <div
        className="fx-product-switch"
        role="group"
        aria-label="Product feature explorer"
      >
        {!locked ? (
          <>
            <button
              aria-pressed={product === "club"}
              onClick={() => change("club")}
            >
              <Users size={17} />
              Club Management
            </button>
            <button
              aria-pressed={product === "training"}
              onClick={() => change("training")}
            >
              <Dumbbell size={17} />
              Personal Training
            </button>
          </>
        ) : (
          <span>
            {product === "club" ? <Users size={17} /> : <Dumbbell size={17} />}{" "}
            {product === "club" ? "Club Management" : "Personal Training"} ·
            Feature walkthrough
          </span>
        )}
        <small>01 / EXPLORE YOUR PRODUCT</small>
      </div>
      <div className="fx-layout">
        <div
          className="fx-feature-list"
          ref={tabs}
          role="tablist"
          aria-label={product + " features"}
        >
          {list.map((f, i) => (
            <button
              id={product + "-tab-" + f.id}
              aria-controls={product + "-feature-panel"}
              role="tab"
              aria-selected={feature.id === f.id}
              tabIndex={feature.id === f.id ? 0 : -1}
              key={f.id}
              onClick={() => setActive(f.id)}
              onKeyDown={(e) => tabKey(e, i)}
            >
              <f.icon size={18} />
              <span>{f.label}</span>
              <ChevronRight size={14} />
            </button>
          ))}
          <a
            className="fx-list-link"
            href={product === "club" ? "/clubs" : "/personal-training"}
          >
            See product overview <ArrowUpRight size={14} />
          </a>
        </div>
        <div
          className="fx-panel"
          role="tabpanel"
          id={product + "-feature-panel"}
          aria-labelledby={product + "-tab-" + feature.id}
          key={product + feature.id}
        >
          <div className="fx-panel-copy">
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </div>
          <Screen
            feature={feature}
            product={product}
            onInspect={() => setInspect(true)}
          />
          <div className="fx-panel-bottom">
            <p>
              <CheckCircle2 size={17} />
              {feature.outcome}
            </p>
            <a href={demoLink(product, feature.module)}>
              Try this feature <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>
      <p className="fx-disclaimer">
        Previews use illustrative sample records. Demo payments and emails are
        simulated; live transfers require manual verification.
      </p>
      {inspect && (
        <div className="fx-inspect-backdrop" onClick={() => setInspect(false)}>
          <section
            className="fx-inspect-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-inspect-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="fx-inspect-close"
              aria-label="Close feature detail"
              onClick={() => setInspect(false)}
            >
              <X size={20} />
            </button>
            <span className="m-eyebrow">
              INSIDE{" "}
              {product === "club" ? "CLUB MANAGEMENT" : "PERSONAL TRAINING"}
            </span>
            <h2 id="feature-inspect-title">{feature.title}</h2>
            <p>{feature.text}</p>
            <ul>
              {feature.points.map((p) => (
                <li key={p}>
                  <Check size={16} />
                  {p}
                </li>
              ))}
            </ul>
            <div className="fx-inspect-outcome">
              <CheckCircle2 size={20} />
              <span>{feature.outcome}</span>
            </div>
            <a className="m-button" href={demoLink(product, feature.module)}>
              Open this feature in the demo <ArrowUpRight size={17} />
            </a>
            <small>This preview makes no changes to a live workspace.</small>
          </section>
        </div>
      )}
    </section>
  );
}
export function ExperienceShowcase() {
  const clientScene=useScene(3,7500),reviewScene=useScene(3,8500),hqScene=useScene(2,9500);
  return (
    <section className="m-section premium-experiences">
      <div className="premium-section-heading">
        <span className="m-eyebrow">THE EXPERIENCE ON BOTH SIDES</span>
        <h2>
          A clear view for the owner.
          <br />A clear next step for the client.
        </h2>
        <p>
          Less hunting through screens. More context where decisions happen.
        </p>
      </div>
      <div className="experience-bento">
        <article className="experience-client" ref={clientScene.ref} data-scene={clientScene.step}>
          <div>
            <span>01 / THE CLIENT PORTAL</span>
            <h3>
              “What’s next?”
              <br />
              Right there.
            </h3>
            <p>
              Upcoming appointments, progress and the sessions left in a paid
              pack.
            </p>
            <a href={demoLink("training", "Dashboard", "Member")}>
              See the client’s view <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="experience-phone">
            <div className="phone-notch" />
            <div className="phone-top">
              <BrandLogo compact />
              <span>JL</span>
            </div>
            <small>HELLO, JAMIE</small>
            <h4>
              Keep showing up.
              <br />
              Keep moving forward.
            </h4>
            <div className="phone-balance">
              <strong><AnimatedNumber value={5} animate={clientScene.animated}/></strong>
              <span>
                sessions available
                <br />
                <small>{clientScene.step===2?"0 reserved · outcome recorded":"1 more reserved"}</small>
              </span>
            </div>
            <div className="phone-session">
              <span>{["NEXT APPOINTMENT","IN SESSION / EXAMPLE","RECORDED OUTCOME"][clientScene.step]}</span>
              <b>Strength & conditioning</b>
              <p>
                <Clock3 size={11} />
                Tuesday · 09:00–10:00
              </p>
              <small>Alex Morgan · Studio A</small>
            </div>
            <a href={demoLink("training", "PTBookings", "Member")}>
              Open appointments <ArrowRight size={12} />
            </a>
          </div>
          <div className="as-card-stage-controls" role="group" aria-label="Client portal example stages">{["Upcoming","Training","Outcome"].map((label,i)=><button key={label} aria-pressed={clientScene.step===i} onClick={()=>clientScene.choose(i)}><i>{i+1}</i>{label}</button>)}</div>
        </article>
        <article className="experience-review" ref={reviewScene.ref} data-scene={reviewScene.step}>
          <span>02 / PAYMENT CLARITY</span>
          <h3>
            A reference isn’t a receipt.
            <br />
            Keep the difference visible.
          </h3>
          <p>
            Review a submitted transfer before approving a payment or activating
            training credits.
          </p>
          <div className="experience-review-card">
            <span className="fx-portrait">JL</span>
            <div>
              <b>Jamie Lee</b>
              <small>8-session training pack</small>
            </div>
            <span className="fx-pill neutral">{["Under review","Receipt check","Verified example"][reviewScene.step]}</span>
          </div>
          <div className="experience-review-steps as-review-steps" role="group" aria-label="Sample payment review stage">{["Reference received","Check bank receipt","Activate credits"].map((label,i)=><button key={label} aria-pressed={reviewScene.step===i} onClick={()=>reviewScene.choose(i)}>{i===0?<Check size={14}/>:i===1?<Search size={14}/>:<Ticket size={14}/>}<span>{label}</span></button>)}</div>
          <p className="as-review-note">{["A submitted reference is waiting for an authorized review.","The actual bank receipt must be checked before approval.","Illustrative result after verification: the purchased credits activate."][reviewScene.step]}</p>
          <a href={demoLink("training", "PTPayments")}>
            Explore payment review <ArrowUpRight size={16} />
          </a>
        </article>
        <article className="experience-hq" ref={hqScene.ref} data-branch={hqScene.step}>
          <div>
            <span>03 / OWNER OVERSIGHT</span>
            <h3>
              Zoom out.
              <br />
              Then open the right location.
            </h3>
            <p>
              Keep branch operations separate while owners see the wider
              picture.
            </p>
            <a href={demoLink("club", "Network")}>
              Explore headquarters <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="experience-branches">
            <div>
              <Layers size={20} />
              <b>Northside Sports</b>
              <small>Owner headquarters</small>
            </div>
            <span />
            <div>
              {[{name:"Central",members:86},{name:"East",members:42}].map((branch,i)=><button key={branch.name} aria-pressed={hqScene.step===i} onClick={()=>hqScene.choose(i)}><MapPin size={14}/>{branch.name}<b>{branch.members} members</b></button>)}
              <div className="as-branch-detail" key={hqScene.step}><span>SELECTED LOCATION / SAMPLE</span><strong>{hqScene.step===0?"Central":"East"}</strong><p>{hqScene.step===0?86:42} member profiles · records and access stay separate from the other location.</p></div>
            </div>
          </div>
        </article>
      </div>
      <p className="fx-disclaimer">
        Illustrative sample data. Open the demo to explore permissions and the
        full workflow.
      </p>
    </section>
  );
}
