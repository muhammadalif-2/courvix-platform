"use client";
import { useRef, useState, type ReactNode, type KeyboardEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Users,
  Dumbbell,
  CalendarDays,
  Wallet,
  ShieldCheck,
  Check,
  Layers,
  Pause,
  CheckCircle2,
  Clock3,
  MapPin,
} from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { ProductExplorer, ProductOverviewPreview } from "./product-explorer";
import { DemoVideo } from "./media-showcase";
import "./reference-home.css";

type Product = "club" | "training";
const demo = (product: Product, role = "Owner", module = "ControlRoom") =>
  product === "training"
    ? `/demo?product=training&workspace=demo-nusa&role=${role}&module=${module}`
    : `/demo?product=club&role=${role}&module=${module}`;
const scenes = [
  {
    image: "/landing/club-coaching.webp",
    alt: "Basketball coach guiding a team during practice",
    label: "FOR CLUBS & ACADEMIES",
    title: ["Less admin.", "More game."],
    text: "Connect your people, training and payment records. Make more room for the sport that brought you together.",
    product: "club" as Product,
  },
  {
    image: "/landing/personal-training.webp",
    alt: "Personal trainer guiding a client through a rope exercise",
    label: "FOR TRAINERS & STUDIOS",
    title: ["Your clients.", "Their next step."],
    text: "From the first paid visit to a full session pack, keep bookings, balances and progress connected.",
    product: "training" as Product,
  },
  {
    image: "/courvix-track.webp",
    alt: "Athlete training on an outdoor running track",
    label: "FOR THE PEOPLE BEHIND THE PROGRESS",
    title: ["Every session.", "More connected."],
    text: "Give owners, coaches and members a clear view of the work that belongs to them, from one workspace.",
    product: "club" as Product,
  },
];
const journeys = {
  club: [
    {
      title: "Give your club a home.",
      text: "Choose your sport, currency and time zone. Organize your teams and coaches around the way your club trains.",
      label: "01 / SET UP",
      action: "Set up a club",
      href: "/register?product=club",
      icon: Layers,
      rows: [
        ["Workspace", "Club Management"],
        ["People", "Members, teams & coaches"],
        ["Your settings", "Sport, location & time zone"],
      ],
    },
    {
      title: "Bring your people together.",
      text: "Invite staff and members with the email they use for ChatGPT. Their profile and role connect them to the right records.",
      label: "02 / INVITE",
      action: "Explore member management",
      href: demo("club", "Owner", "Members"),
      icon: Users,
      rows: [
        ["Owner & admin", "Operations and payment review"],
        ["Coach", "Assigned people and sessions"],
        ["Member", "Their own activity and records"],
      ],
    },
    {
      title: "Run the next session with clarity.",
      text: "Keep schedules, attendance and dues together. Review payment references against actual receipts, then record verification.",
      label: "03 / MANAGE",
      action: "Open the club control room",
      href: demo("club"),
      icon: CalendarDays,
      rows: [
        ["Before training", "Time, venue and coach"],
        ["After training", "Attendance and related records"],
        ["Dues", "Unpaid, under review or verified"],
      ],
    },
  ],
  training: [
    {
      title: "Create an offer that fits your coaching.",
      text: "Sell a single visit or a 4-, 8- or 16-session pack. Set the price, validity and booking terms before the client buys.",
      label: "01 / CREATE YOUR OFFER",
      action: "Explore training offers",
      href: demo("training", "Owner", "PTOffers"),
      icon: Dumbbell,
      rows: [
        ["Single visit", "One paid session"],
        ["Session packs", "4 / 8 / 16 sessions"],
        ["Clear terms", "Price, expiry and booking policy"],
      ],
    },
    {
      title: "A verified payment becomes a booking.",
      text: "The client submits a reference. You verify the actual receipt to activate credits. A confirmed booking reserves one available session.",
      label: "02 / VERIFY & RESERVE",
      action: "Explore payment review",
      href: demo("training", "Owner", "PTPayments"),
      icon: Wallet,
      rows: [
        ["Payment", "Submitted for manual review"],
        ["After verification", "Paid session credits activated"],
        ["At booking", "One available credit reserved"],
      ],
    },
    {
      title: "Finish the session. Keep the context.",
      text: "Record the outcome and progress. Completion uses the reserved credit once, with the client's goals and next step in view.",
      label: "03 / TRAIN & RECORD",
      action: "Explore appointments",
      href: demo("training", "Owner", "PTBookings"),
      icon: CheckCircle2,
      rows: [
        ["Training", "Appointment or small-group class"],
        ["Completion", "One reserved credit used"],
        ["Next session", "Goals, notes and balance together"],
      ],
    },
  ],
};
function SectionTitle({
  n,
  label,
  title,
  text,
}: {
  n: string;
  label: string;
  title: ReactNode;
  text?: string;
}) {
  return (
    <div className="r-section-title">
      <div>
        <span className="r-kicker">
          <i>{n}</i>
          {label}
        </span>
        <h2>{title}</h2>
      </div>
      {text && <p>{text}</p>}
    </div>
  );
}
function ProductSwitch({
  product,
  change,
  label,
}: {
  product: Product;
  change: (p: Product) => void;
  label: string;
}) {
  return (
    <div className="r-product-switch" role="group" aria-label={label}>
      {(["club", "training"] as const).map((p) => (
        <button key={p} aria-pressed={product === p} onClick={() => change(p)}>
          {p === "club" ? <Users size={17} /> : <Dumbbell size={17} />}
          {p === "club" ? "Club Management" : "Personal Training"}
        </button>
      ))}
    </div>
  );
}
export default function ReferenceHome({
  header,
  footer,
  faq,
}: {
  header: ReactNode;
  footer: ReactNode;
  faq: ReactNode;
}) {
  const [scene, setScene] = useState(0),
    [product, setProduct] = useState<Product>("club"),
    [step, setStep] = useState(0),
    [paused, setPaused] = useState(false);
  const steps = useRef<HTMLDivElement>(null);
  const hero = scenes[scene],
    journey = journeys[product][step];
  function change(p: Product) {
    setProduct(p);
    setStep(0);
  }
  function jump(p: Product) {
    change(p);
    document.getElementById("feature-explorer")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
  function stepKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? 2
          : (index + (e.key === "ArrowLeft" ? -1 : 1) + 3) % 3;
    setStep(next);
    steps.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }
  return (
    <div
      className={
        "mkt cv-public reference-site" + (paused ? " r-motion-paused" : "")
      }
    >
      <a className="m-skip" href="#main-content">
        Skip to content
      </a>
      {header}
      <main id="main-content">
        <section className="r-hero r-container" aria-label="Meet Courvix">
          <div className="r-hero-image" data-story={scene} key={hero.image}>
            <img src={hero.image} alt={hero.alt} fetchPriority="high" />
          </div>
          <div className="r-hero-shade" />
          <div className="r-hero-top">
            <span>
              <span className="r-status-dot" /> THE SYSTEM BEHIND EVERY SESSION
            </span>
            <a href="/products">
              Two products. Your way to work. <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="r-hero-copy" key={scene}>
            <span className="r-eyebrow">{hero.label}</span>
            <h1>
              {hero.title[0]}
              <br />
              <em>{hero.title[1]}</em>
            </h1>
            <p>{hero.text}</p>
            <div className="r-hero-actions">
              <a className="r-button r-button-orange" href={demo(hero.product)}>
                Explore the {hero.product === "club" ? "club" : "training"} demo{" "}
                <ArrowUpRight size={18} />
              </a>
              <a className="r-button r-button-glass" href="#products">
                Find your product <ArrowRight size={17} />
              </a>
            </div>
            <span className="r-hero-trial">
              <Check size={14} />
              14-day initial trial <i />
              No automatic charges
            </span>
          </div>
          <div
            className="r-hero-slides"
            role="group"
            aria-label="Choose a sport story"
          >
            {scenes.map((s, i) => (
              <button
                key={s.image}
                aria-label={s.label}
                aria-pressed={scene === i}
                onClick={() => {
                  setScene(i);
                  change(s.product);
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
          <div className="r-hero-bottom">
            <span>YOUR SPORT. YOUR PEOPLE. YOUR COURVIX.</span>
            <a href="#product-film">
              <span className="r-play">
                <Play size={16} fill="currentColor" />
              </span>
              <span>
                See the workspace
                <br />
                <b>Watch the product tour</b>
              </span>
              <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <section
          className="r-intro-grid r-container"
          aria-label="Choose your Courvix product"
        >
          <a className="r-photo-card" href="/clubs">
            <img
              src="/landing/club-coaching.webp"
              alt="Coach preparing a basketball team"
              loading="lazy"
            />
            <span className="r-photo-kicker">01 / CLUBS & ACADEMIES</span>
            <div>
              <h2>
                Club
                <br />
                Management
              </h2>
              <span>
                One connected club.
                <i>
                  <ArrowUpRight size={18} />
                </i>
              </span>
            </div>
          </a>
          <a className="r-photo-card" href="/personal-training">
            <img
              src="/landing/personal-training.webp"
              alt="Trainer and client working together"
              loading="lazy"
            />
            <span className="r-photo-kicker">02 / TRAINERS & STUDIOS</span>
            <div>
              <h2>
                Personal
                <br />
                Training
              </h2>
              <span>
                Every session counts.
                <i>
                  <ArrowUpRight size={18} />
                </i>
              </span>
            </div>
          </a>
          <div className="r-intro-copy">
            <span className="r-eyebrow">MORE THAN A SESSION.</span>
            <h2>
              A clearer system.
              <br />A stronger
              <br />
              <em>connection.</em>
            </h2>
            <p>
              You take care of the people. Give the work around them a place to
              stay organized.
            </p>
            <div>
              <span>
                <Users size={19} />
                People
              </span>
              <span>
                <CalendarDays size={19} />
                Sessions
              </span>
              <span>
                <Wallet size={19} />
                Payments
              </span>
            </div>
          </div>
        </section>

        <section className="r-about r-container r-section" id="products">
          <SectionTitle
            n="01"
            label="BUILT AROUND YOUR BUSINESS"
            title={
              <>
                Different workflows.
                <br />
                One clear direction.
              </>
            }
            text="Club dues and personal training packs work differently. Courvix gives each business its own product, with the right records and next actions connected."
          />
          <div className="r-about-grid">
            <article className="r-purpose-card">
              <BrandLogo compact />
              <h3>
                The sport is your focus.
                <br />
                Clarity is ours.
              </h3>
              <p>
                From a member's profile to the next training session, keep the
                details close to the decision.
              </p>
              <a href="/platform">
                See how Courvix works <ArrowUpRight size={17} />
              </a>
            </article>
            <div className="r-coach-photo">
              <img
                src="/landing/club-coaching.webp"
                alt="A coach focused on the people in front of them"
                loading="lazy"
              />
              <span>
                <MapPin size={14} />
                Built for the way sports move.
              </span>
            </div>
            <article className="r-start-card">
              <span>START WITH YOUR WORKFLOW</span>
              <strong>
                2 products.
                <br />
                <em>Your choice.</em>
              </strong>
              <p>
                Choose a dedicated workspace for your club or personal training
                business.
              </p>
              <button onClick={() => jump(product)}>
                Look inside <ArrowUpRight size={17} />
              </button>
            </article>
          </div>
          <div className="r-fact-strip">
            <div>
              <strong>2</strong>
              <span>Focused products</span>
            </div>
            <div>
              <strong>14 days</strong>
              <span>Initial workspace trial</span>
            </div>
            <div>
              <strong>1 / 4 / 8 / 16</strong>
              <span>PT visit & session-pack options</span>
            </div>
            <div>
              <strong>Your people</strong>
              <span>Role-based access</span>
            </div>
          </div>
        </section>

        <section
          className="r-device-section r-section"
          aria-label="Connected product views"
        >
          <div className="r-device-inner r-container">
            <div className="r-device-copy">
              <span className="r-kicker">
                <i>02</i>A VIEW THAT PUTS YOU IN CONTROL
              </span>
              <h2>
                The whole picture.
                <br />
                <em>The next action.</em>
              </h2>
              <p>
                See the records that belong together. Open a person, understand
                the context, and keep moving.
              </p>
              <ProductSwitch
                product={product}
                change={change}
                label="Choose the workspace preview"
              />
              <a className="r-text-link" href={demo(product)}>
                Try the control room <ArrowUpRight size={18} />
              </a>
              <small>
                Illustrative product views. Explore the working app in the demo.
              </small>
            </div>
            <div className="r-device-stage">
              <div className="r-orbit r-orbit-one" />
              <div className="r-orbit r-orbit-two" />
              <div className="r-desktop">
                <div className="r-device-top">
                  <span />
                  <span />
                  <span />
                  <b>
                    COURVIX /{" "}
                    {product === "club"
                      ? "CLUB MANAGEMENT"
                      : "PERSONAL TRAINING"}
                  </b>
                </div>
                <ProductOverviewPreview
                  product={product}
                  onInspect={() => jump(product)}
                />
              </div>
              <div className="r-desktop-foot" />
              <a
                className="r-phone"
                href={demo(product, "Member", "Dashboard")}
                aria-label={
                  product === "club"
                    ? "Explore the member view"
                    : "Explore the training client view"
                }
              >
                <div className="r-phone-camera" />
                <div className="r-phone-logo">
                  <BrandLogo compact />
                  <span>MY {product === "club" ? "CLUB" : "TRAINING"}</span>
                </div>
                <span className="r-phone-avatar">JL</span>
                <h3>Hi, Jamie.</h3>
                <p>Your next session, clear.</p>
                <div className="r-phone-session">
                  <CalendarDays size={19} />
                  <span>NEXT SESSION</span>
                  <b>
                    {product === "club" ? "Team practice" : "Strength training"}
                  </b>
                  <small>
                    Tuesday · 16:00
                    <br />
                    Coach Alex · Studio A
                  </small>
                </div>
                <div className="r-phone-status">
                  <CheckCircle2 size={15} />
                  {product === "club"
                    ? "Your own activity & records"
                    : "5 available · 1 reserved"}
                </div>
                <span className="r-phone-link">
                  Explore this role <ArrowUpRight size={13} />
                </span>
                <small className="r-sample">SAMPLE MEMBER VIEW</small>
              </a>
              <button
                className="r-motion-button"
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={12} /> : <Pause size={12} />}
                {paused ? "Resume ambient motion" : "Pause ambient motion"}
              </button>
            </div>
          </div>
        </section>

        <div className="r-explorer-wrap r-container">
          <ProductExplorer
            key={product}
            product={product}
            onProductChange={change}
          />
        </div>

        <section
          className="r-journey r-container r-section"
          aria-label="Product workflow"
        >
          <SectionTitle
            n="03"
            label="FROM THE FIRST STEP TO THE NEXT SESSION"
            title={
              <>
                A workflow that
                <br />
                makes sense.
              </>
            }
            text="Choose your product to see how setup, people, payments and training connect. Each step has a clear place to go next."
          />
          <ProductSwitch
            product={product}
            change={change}
            label="Choose a product workflow"
          />
          <div className="r-journey-layout">
            <div
              className="r-journey-tabs"
              role="tablist"
              aria-label={`${product} journey steps`}
              ref={steps}
            >
              {journeys[product].map((j, i) => (
                <button
                  key={j.label}
                  role="tab"
                  id={`${product}-journey-${i}`}
                  aria-selected={step === i}
                  aria-controls="journey-detail"
                  tabIndex={step === i ? 0 : -1}
                  onClick={() => setStep(i)}
                  onKeyDown={(e) => stepKey(e, i)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <b>{j.title}</b>
                    <small>
                      {i === 0
                        ? "A clear starting point"
                        : i === 1
                          ? "People and payment context"
                          : "The work behind the progress"}
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
            <article
              className="r-journey-panel"
              role="tabpanel"
              id="journey-detail"
              aria-labelledby={`${product}-journey-${step}`}
            >
              <span className="r-eyebrow">{journey.label}</span>
              <h3>{journey.title}</h3>
              <p>{journey.text}</p>
              <div className="r-journey-record">
                <span>
                  <journey.icon size={23} />
                  {product === "club" ? "CLUB MANAGEMENT" : "PERSONAL TRAINING"}
                </span>
                {journey.rows.map(([a, b]) => (
                  <div key={a}>
                    <span>{a}</span>
                    <b>{b}</b>
                  </div>
                ))}
              </div>
              <a className="r-text-link" href={journey.href}>
                {journey.action}
                <ArrowUpRight size={16} />
              </a>
            </article>
          </div>
        </section>

        <div className="r-film-wrap r-container">
          <DemoVideo />
        </div>

        <section className="r-role-section r-container r-section">
          <SectionTitle
            n="04"
            label="THE RIGHT VIEW FOR EVERY ROLE"
            title={
              <>
                Shared work.
                <br />
                Personal perspective.
              </>
            }
            text="Give staff a clear plan and members a view of their own journey. Access follows the role and workspace they've been invited to."
          />
          <div className="r-role-grid">
            {[
              {
                n: "01",
                title: "Owner & administrator",
                text: "Connected operations, people and payment reviews. A wider view when you manage more than one location.",
                role: "Owner",
                icon: Layers,
              },
              {
                n: "02",
                title: "Coach & trainer",
                text: "Assigned people, upcoming sessions and recorded outcomes. The context needed to keep coaching moving.",
                role: "Coach",
                icon: Dumbbell,
              },
              {
                n: "03",
                title: "Member & client",
                text: "Their own sessions, payment status and personal progress. A clear starting point before the next visit.",
                role: "Member",
                icon: Users,
              },
            ].map((r) => (
              <article key={r.n}>
                <div>
                  <r.icon size={25} />
                  <span>{r.n}</span>
                </div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
                <a
                  aria-label={`Explore ${r.title} demo`}
                  href={demo(product, r.role, "Dashboard")}
                >
                  Explore this role <ArrowUpRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="r-pricing r-container r-section">
          <div className="r-price-card">
            <span>STARTER / YOUR CHOICE OF PRODUCT</span>
            <h2>
              A clear place
              <br />
              to get started.
            </h2>
            <div className="r-price">
              <span>IDR</span>
              <strong>250,000</strong>
              <span>
                / workspace
                <br />/ 30-day paid term
              </span>
            </div>
            <div className="r-price-tags">
              <span>
                <Check size={13} />
                Club or PT workspace
              </span>
              <span>
                <Check size={13} />
                14-day initial trial
              </span>
            </div>
            <a className="r-button r-button-white" href="/pricing">
              Explore the plans <ArrowUpRight size={17} />
            </a>
            <div className="r-price-ring">
              <BrandLogo compact />
            </div>
          </div>
          <div className="r-pricing-copy">
            <span className="r-kicker">
              <i>05</i>A WORKSPACE FOR YOUR BUSINESS
            </span>
            <h2>
              Choose your workflow.
              <br />
              <em>Choose your start.</em>
            </h2>
            <p>
              Set up with Starter, or explore Pro for scheduled setup and
              onboarding support. Each workspace has its own product and
              subscription.
            </p>
            <ul>
              <li>
                <CheckCircle2 size={17} />
                No per-dues or per-session platform fee
              </li>
              <li>
                <CheckCircle2 size={17} />
                No automatic subscription charges
              </li>
              <li>
                <CheckCircle2 size={17} />
                Clear access and separate branch records
              </li>
            </ul>
            <a className="r-text-link" href={`/register?product=${product}`}>
              Start your initial trial <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        <div className="r-faq-wrap r-container">{faq}</div>
        <section className="r-closing r-container">
          <img
            src="/landing/personal-training.webp"
            alt="A trainer supporting a client's workout"
            loading="lazy"
          />
          <div className="r-closing-shade" />
          <div>
            <span className="r-eyebrow">LESS ADMINISTRATION. MORE GAME.</span>
            <h2>
              Your next session.
              <br />
              <em>A clearer system.</em>
            </h2>
            <p>
              See the work from every role. Find the product that fits your
              people.
            </p>
            <div className="r-closing-actions">
              <a className="r-button r-button-orange" href={demo(product)}>
                Explore the demo <ArrowUpRight size={18} />
              </a>
              <a className="r-button r-button-glass" href="/contact">
                Talk about your workflow <ArrowUpRight size={17} />
              </a>
            </div>
            <small>Sample records · Simulated demo payments and emails</small>
          </div>
        </section>
      </main>
      {footer}
    </div>
  );
}
