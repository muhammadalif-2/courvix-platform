"use client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Menu,
  X,
  Users,
  Dumbbell,
  CalendarDays,
  ShieldCheck,
  Ticket,
  Wallet,
  Layers,
  Clock3,
  ChevronDown,
  Mail,
  Plus,
  Activity,
  LayoutDashboard,
  Play,
  Search,
  FileText,
} from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { PreferenceControls } from "./preferences";
import { SPORTS } from "@/lib/sports";
import "./marketing.css";
import "./marketing-modern.css";
import { ProductExplorer, ExperienceShowcase } from "./product-explorer";
import "./premium.css";
import { DemoVideo, SportsStory, SocialTeaser } from "./media-showcase";
import ReferenceHome from "./reference-home";
import PricingExperience from "./pricing-experience";
const clubDemo = "/demo?product=club&role=Owner";
const ptDemo = "/demo?product=training&workspace=demo-nusa&role=Owner";
const faqs = [
  [
    "Which product is right for my business?",
    "Choose Club Management for teams, groups, attendance and recurring member dues. Choose Personal Training for individual clients, visits, session packs, appointments and small-group classes. Each workspace has its own product and subscription.",
  ],
  [
    "Do my members and clients need an account?",
    "Yes. Each person uses a verified Courvix account and accepts an invitation or requests access. Email and social sign-in options depend on the enabled deployment. Each person sees the records permitted by their role.",
  ],
  [
    "How do payments work?",
    "Your members and clients transfer directly to your business. They submit a reference and your administrator verifies receipt. Your Courvix subscription is a separate bank transfer reviewed by Courvix. There is no automatic debit or payment gateway in V1.",
  ],
  [
    "Can I sell a single visit or a session pack?",
    "Yes. Personal Training supports single visits, 4-, 8- and 16-session packs, or a custom session count. You set the price, session duration and validity. Paid credits are reserved when booked and used when training is completed.",
  ],
  [
    "Can I manage more than one location?",
    "Yes. Owners can group locations under headquarters and open each workspace from one place. Each location has its own data, access and subscription. Branch staff do not automatically gain access to other locations.",
  ],
  [
    "Are payment reminders automatic?",
    "Courvix includes payment follow-up rules and delivery history. Email requires a verified sender, enabled workspace preferences and a working scheduler. Missing configuration is shown as blocked; a demo email is only a simulation.",
  ],
  [
    "What happens when my trial or subscription ends?",
    "Your initial trial lasts 14 days. An expired workspace keeps read and export access, while changes require an active subscription. Subscriptions do not renew or charge automatically.",
  ],
];
export function PublicHeader({ active = "" }: { active?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header">
      <a href="/" className="site-brand" aria-label="Courvix home">
        <BrandLogo />
      </a>
      <nav
        id="public-navigation"
        className={open ? "open" : ""}
        aria-label="Main navigation"
      >
        {[
          ["Products", "/products", "products"],
          ["How it works", "/platform", "platform"],
          ["Pricing", "/pricing", "pricing"],
          ["Why Courvix", "/compare", "compare"],
          ["Contact", "/contact", "contact"],
        ].map(([label, href, key]) => (
          <a
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
          >
            {label}
          </a>
        ))}
        <a href="/login" className="mobile-signin">
          Sign in
        </a>
      </nav>
      <div className="site-header-actions">
        <PreferenceControls />
        <a href="/login" className="site-signin">
          Sign in
        </a>
        <a className="m-button small" href="/demo">
          Explore demo <ArrowUpRight size={15} />
        </a>
        <button
          className="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="public-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <a href="/" aria-label="Courvix home">
            <BrandLogo />
          </a>
          <p>
            For the people
            <br />
            behind the progress.
          </p>
          <span className="footer-tag">
            CLUB MANAGEMENT + PERSONAL TRAINING
          </span>
        </div>
        <div>
          <b>Product</b>
          <a href="/clubs">Club Management</a>
          <a href="/personal-training">Personal Training</a>
          <a href="/platform">How it works</a>
          <a href="/pricing/club">Club pricing</a>
          <a href="/pricing/personal-training">Training pricing</a>
        </div>
        <div>
          <b>Explore</b>
          <a href="/demo">Interactive demo</a>
          <a href="/sports">Sports & disciplines</a>
          <a href="/club-life">The coaching journal</a>
          <a href="/compare">Compare the workflow</a>
          <a href="/trust">Data & trust</a>
          <a href="/help">Help center</a>
          <a href="/custom">Custom projects</a>
        </div>
        <div>
          <b>Let’s talk</b>
          <a href="mailto:courvix.id@gmail.com">
            courvix.id@gmail.com <ArrowUpRight size={13} />
          </a>
          <a href="/contact">Product & setup questions</a>
          <a href="/login">Open your workspace</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Courvix.</span>
        <span>Built around the way you coach.</span>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/policies">All policies</a>
      </div>
    </footer>
  );
}
export function ProductCards({ demo = false }: { demo?: boolean }) {
  return (
    <div className="m-products">
      {[
        {
          key: "club",
          label: "01 / CLUB MANAGEMENT",
          title: "Run a club that stays in sync.",
          text: "Give your members, coaches and teams one place to stay on top of training and club dues.",
          features: [
            "Members, coaches & team rosters",
            "Schedules, attendance & recurring dues",
            "Payment review & branch oversight",
          ],
          icon: Users,
          href: "/clubs",
          demo: clubDemo,
        },
        {
          key: "training",
          label: "02 / PERSONAL TRAINING",
          title: "Make every session count.",
          text: "Connect client goals, paid session packs and appointments in a dedicated training workspace.",
          features: [
            "Single visits & flexible session packs",
            "Private appointments & small-group classes",
            "Session balances, expiry & progress",
          ],
          icon: Dumbbell,
          href: "/personal-training",
          demo: ptDemo,
        },
      ].map((p) => (
        <article key={p.key} className={"m-product " + p.key}>
          <div className="m-product-top">
            <span>{p.label}</span>
            <p.icon size={25} />
          </div>
          <h3>{p.title}</h3>
          <p>{p.text}</p>
          <ul>
            {p.features.map((f) => (
              <li key={f}>
                <Check size={15} />
                {f}
              </li>
            ))}
          </ul>
          <a href={demo ? p.demo : p.href} className="m-button secondary">
            {demo
              ? "Open sample workspace"
              : "Explore " +
                (p.key === "club" ? "Club Management" : "Personal Training")}
            <ArrowUpRight size={16} />
          </a>
          <div className="m-product-caption">
            {p.key === "club"
              ? "FOR CLUBS, ACADEMIES & SPORTS COMMUNITIES"
              : "FOR INDEPENDENT TRAINERS & COACHING STUDIOS"}
          </div>
        </article>
      ))}
    </div>
  );
}
function ProductPreview({
  product,
  onChange,
}: {
  product: string;
  onChange: (p: string) => void;
}) {
  const pt = product === "training";
  return (
    <div className="product-stage">
      <div
        className="preview-product-tabs"
        role="group"
        aria-label="Sample product"
      >
        <button aria-pressed={!pt} onClick={() => onChange("club")}>
          <Users size={15} />
          Club Management
        </button>
        <button aria-pressed={pt} onClick={() => onChange("training")}>
          <Dumbbell size={15} />
          Personal Training
        </button>
      </div>
      <div className="preview-app" aria-label="Illustrative workspace preview">
        <div className="preview-side">
          <BrandLogo compact />
          <span className="preview-side-active">
            <LayoutDashboard size={16} />
          </span>
          <Users size={16} />
          <CalendarDays size={16} />
          <Wallet size={16} />
          <Activity size={16} />
        </div>
        <div className="preview-workspace">
          <div className="preview-topline">
            <span>{pt ? "PACE TRAINING STUDIO" : "NORTHSIDE SPORTS CLUB"}</span>
            <span className="preview-avatar">JD</span>
          </div>
          <div className="preview-greeting">
            <div>
              <small>YOUR WORKSPACE, AT A GLANCE</small>
              <h3>
                {pt
                  ? "Every session, accounted for."
                  : "A clear view of your club."}
              </h3>
            </div>
            <span className="preview-date">
              <CalendarDays size={13} />
              Today
            </span>
          </div>
          <div className="preview-stats">
            {(pt
              ? [
                  ["Active clients", "24", "On their training journey"],
                  ["Sessions today", "6", "Time to make progress"],
                  ["Payments to review", "2", "Ready for your attention"],
                ]
              : [
                  ["Active members", "128", "Across your training groups"],
                  ["Sessions today", "4", "Your coaches have the plan"],
                  ["Payments to review", "5", "Ready for your attention"],
                ]
            ).map(([label, value, note]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>
                  {value}
                  <i>
                    <ArrowUpRight size={14} />
                  </i>
                </strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
          <div className="preview-agenda">
            <div className="preview-block-heading">
              <b>{pt ? "Today’s appointments" : "Today’s training"}</b>
              <span>
                View schedule <ArrowRight size={12} />
              </span>
            </div>
            {(pt
              ? [
                  [
                    "09:00",
                    "Strength & conditioning",
                    "Alex Morgan · Private session",
                    "Confirmed",
                  ],
                  [
                    "11:00",
                    "Movement foundations",
                    "Jamie Lee · 8-session pack",
                    "Confirmed",
                  ],
                  [
                    "16:00",
                    "Small-group strength",
                    "Studio A · 4 / 6 places",
                    "Scheduled",
                  ],
                ]
              : [
                  [
                    "09:00",
                    "U-16 basketball",
                    "Coach Alex · Court 1",
                    "Scheduled",
                  ],
                  [
                    "11:00",
                    "Junior swimming",
                    "Coach Jamie · Pool A",
                    "Scheduled",
                  ],
                  [
                    "16:00",
                    "Evening badminton",
                    "Coach Sam · Hall 2",
                    "Scheduled",
                  ],
                ]
            ).map(([time, title, subtitle, status]) => (
              <div className="preview-appointment" key={time}>
                <time>{time}</time>
                <span className="preview-session-mark" />
                <div>
                  <b>{title}</b>
                  <small>{subtitle}</small>
                </div>
                <span className="preview-status">{status}</span>
              </div>
            ))}
          </div>
          <div className="preview-bottom">
            <span>
              <ShieldCheck size={13} />
              The right view for every role
            </span>
            <a href={pt ? ptDemo : clubDemo}>
              Try this workspace <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
      <div className="preview-floating">
        <span className="preview-check">
          <Check size={18} />
        </span>
        <div>
          <b>
            {pt
              ? "Session complete. Progress recorded."
              : "Payment reviewed. Records updated."}
          </b>
          <small>
            {pt
              ? "One credit used. Seven sessions to go."
              : "Your member can see the latest status."}
          </small>
        </div>
      </div>
      <p className="preview-disclosure">
        ILLUSTRATIVE SAMPLE DATA · EXPLORE THE INTERACTIVE DEMO
      </p>
    </div>
  );
}
function SectionHeading({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="m-section-heading">
      <span className="m-eyebrow">{label}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
function Workflow({ training = false }: { training?: boolean }) {
  const steps = training
    ? [
        [
          "Create your offers",
          "Set visit or session-pack prices, duration and validity.",
        ],
        [
          "Invite & activate",
          "Invite clients. Review their transfer before activating credits.",
        ],
        [
          "Book & coach",
          "Reserve a paid session for a private slot or published class.",
        ],
        [
          "Record & repeat",
          "Complete training, capture progress and review the remaining balance.",
        ],
      ]
    : [
        ["Build your roster", "Add coaches, members and training groups."],
        [
          "Invite your people",
          "Give admins, coaches and members their own access.",
        ],
        ["Run the session", "Share the schedule and record who attended."],
        [
          "Keep dues clear",
          "Review payments, follow up and see the next action.",
        ],
      ];
  return (
    <div className="m-workflow">
      {steps.map(([title, text], i) => (
        <article key={title}>
          <span>{"0" + (i + 1)}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}
function Faq() {
  return (
    <section className="m-section m-faq">
      <SectionHeading
        label="A FEW THINGS, MADE CLEAR"
        title="Good questions. Straight answers."
      />
      <div>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <Plus size={18} />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export default function Marketing({ page = "home" }: { page?: string }) {
  const [product, setProduct] = useState("club");
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (
      !node ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal", "visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.06 },
    );
    node.querySelectorAll<HTMLElement>(".m-section").forEach((section) => {
      if (section.getBoundingClientRect().top > innerHeight) {
        section.dataset.reveal = "waiting";
      }
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, [page]);
  const home = page === "home",
    training = page === "personal-training",
    club = page === "clubs",
    detail = training || club,
    contact = page === "contact" || page === "custom";
  if (home)
    return (
      <ReferenceHome
        header={<PublicHeader active="home" />}
        footer={<PublicFooter />}
        faq={<Faq />}
      />
    );
  if (page === "pricing") return <PricingExperience header={<PublicHeader active="pricing"/>} footer={<PublicFooter/>}/>;
  const title: Record<string, string> = {
    products: "Two ways to work. One less thing to juggle.",
    platform: "A clear next step. For everyone involved.",
    pricing: "A workspace for your business. A price you can plan around.",
    sports: "Different sports. Shared moving parts.",
    contact: "Tell us what’s getting in the way.",
    custom: "Your workflow needs something more?",
    "club-life": "Small habits. Stronger communities.",
    clubs: "Less club admin. More room to grow.",
    "personal-training":
      "Your clients. Their progress. Every session connected.",
  };
  const intro: Record<string, string> = {
    products:
      "Club dues and training packs need different workflows. Start with the product that fits your business.",
    platform:
      "From the first invitation to the next session, keep people, access and payment records connected.",
    pricing:
      "Choose your product, then choose how you want to get started. No per-dues or per-session platform fee.",
    sports:
      "Organize people, schedules and payments across 52 sport categories. Keep the workflow practical for the way you train.",
    contact:
      "Tell us about your club or training business, your current process and what you want to make simpler.",
    custom:
      "Talk through a website or a specific operational project. Scope, ownership, price and ongoing support are agreed before work begins.",
    "club-life":
      "Practical ideas for making the next session clearer, the next payment easier to discuss and progress easier to see.",
    clubs:
      "Keep members, teams, coaches, attendance and recurring dues in one place, with the right access for everyone.",
    "personal-training":
      "Sell visits or session packs. Connect verified payments to bookings, session balances and the progress your clients make.",
  };
  return (
    <div className="mkt cv-public premium-site" ref={root}>
      <a className="m-skip" href="#main-content">
        Skip to content
      </a>
      <PublicHeader active={detail ? "products" : page} />
      <main id="main-content">
        {home ? (
          <section className="m-hero">
            <div className="m-hero-copy">
              <a href="/products" className="m-announcement">
                <span />
                TWO PRODUCTS. BUILT AROUND YOUR BUSINESS.
                <ArrowRight size={13} />
              </a>
              <h1>
                More coaching.
                <br />
                <em>Less chasing.</em>
              </h1>
              <p>
                Bring your people, schedules and payment records into one clear
                workspace. Club Management and Personal Training, built around
                the way you run your business.
              </p>
              <div className="m-actions">
                <a className="m-button" href="/demo">
                  Explore the demo <ArrowUpRight size={17} />
                </a>
                <a className="m-button secondary" href="/products">
                  Find your product <ArrowRight size={17} />
                </a>
              </div>
              <div className="m-trial-note">
                <Check size={14} />
                14-day initial trial
                <span />
                No automatic charges
              </div>
              <a className="m-hero-film" href="#product-film">
                <Play size={14} />
                Watch the narrated product tour <ArrowRight size={13} />
              </a>
              <div className="m-built-for">
                <span>BUILT FOR THE PEOPLE BEHIND THE PROGRESS</span>
                <div>
                  <Users size={15} />
                  Clubs & academies
                  <i /> <Dumbbell size={15} />
                  Trainers & studios
                </div>
              </div>
            </div>
            <ProductPreview product={product} onChange={setProduct} />
          </section>
        ) : (
          <section
            className={"m-page-hero " + (detail ? "product-detail-hero" : "")}
          >
            <div>
              <span className="m-eyebrow">
                COURVIX / {page.replaceAll("-", " ").toUpperCase()}
              </span>
              <h1>{title[page] || title.platform}</h1>
              <p>{intro[page] || intro.platform}</p>
              {detail && (
                <div className="m-actions">
                  <a className="m-button" href={training ? ptDemo : clubDemo}>
                    Try the {training ? "training" : "club"} demo{" "}
                    <ArrowUpRight size={17} />
                  </a>
                  <a
                    className="m-button secondary"
                    href={
                      training
                        ? "/register?product=training"
                        : "/register?product=club"
                    }
                  >
                    Start a 14-day trial <ArrowRight size={16} />
                  </a>
                </div>
              )}
            </div>
            {detail && (
              <div className="detail-product-peek">
                <ProductPreview
                  product={training ? "training" : "club"}
                  onChange={(p) =>
                    location.assign(
                      p === "training" ? "/personal-training" : "/clubs",
                    )
                  }
                />
              </div>
            )}
          </section>
        )}
        {home && (
          <div className="m-capability-strip">
            {[
              [Users, "People, connected"],
              [CalendarDays, "Schedules, organized"],
              [Wallet, "Payments, visible"],
              [ShieldCheck, "Access, controlled"],
            ].map(([Icon, text]: any) => (
              <span key={text}>
                <Icon size={18} />
                {text}
              </span>
            ))}
          </div>
        )}
        {(home || detail || page === "products" || page === "platform") && (
          <ProductExplorer
            product={
              detail
                ? training
                  ? "training"
                  : "club"
                : (product as "club" | "training")
            }
            onProductChange={setProduct}
            locked={detail}
          />
        )}
        {(home || page === "platform" || page === "products") && <DemoVideo />}
        {(home || page === "platform") && (
          <section className="m-section m-problem">
            <SectionHeading
              label="THE WORK AROUND THE WORKOUT"
              title="The session is simple. Everything around it gets complicated."
              text="The roster is in a spreadsheet. Changes are in the group chat. Payment notes are somewhere else. Courvix brings the next action into view."
            />
            <div className="m-benefit-grid">
              {[
                [
                  Users,
                  "Know who belongs where.",
                  "Keep profiles, invitations and role-based access connected to your roster.",
                ],
                [
                  CalendarDays,
                  "Make the next session obvious.",
                  "Give your people a clear time, place and coach, with attendance or appointment records.",
                ],
                [
                  Wallet,
                  "Have clearer payment conversations.",
                  "Separate unpaid, under-review and verified payments so everyone knows the status.",
                ],
              ].map(([Icon, title, text]: any) => (
                <article key={title}>
                  <span>
                    <Icon size={23} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        {(home || page === "products" || page === "sports") && (
          <section className="m-section m-products-section" id="products">
            <SectionHeading
              label="CHOOSE HOW YOU WORK"
              title="Different businesses. Purpose-built workflows."
              text="Keep club operations and personal coaching distinct, under one Courvix account."
            />
            <ProductCards />
          </section>
        )}
        {(detail || page === "platform") && (
          <section className="m-section">
            <SectionHeading
              label="FROM FIRST INVITATION TO NEXT SESSION"
              title={
                training
                  ? "A paid pack becomes a plan."
                  : "Keep the whole journey connected."
              }
              text={
                training
                  ? "One balance connects the purchase, the booking and the completed session."
                  : "Your staff and members see the parts of the workflow that belong to them."
              }
            />
            <Workflow training={training} />
            {page === "platform" && (
              <>
                <div className="m-subheading">
                  <Dumbbell size={20} />
                  <h3>Personal Training has its own journey.</h3>
                </div>
                <Workflow training />
              </>
            )}
          </section>
        )}
        {detail && (
          <section className="m-section m-detail-features">
            <SectionHeading
              label="BUILT INTO YOUR WORKSPACE"
              title={
                training
                  ? "Coaching with a clear record."
                  : "Your club, without the scattered records."
              }
            />
            <div className="m-benefit-grid">
              {(training
                ? [
                    [
                      Ticket,
                      "Flexible offers",
                      "Sell a visit, a 4 / 8 / 16-session pack or a custom count. Set duration and validity.",
                    ],
                    [
                      Wallet,
                      "Credits you can explain",
                      "Verify a transfer, reserve a paid credit and use it once when training is complete.",
                    ],
                    [
                      CalendarDays,
                      "Appointments & small groups",
                      "Check trainer/client conflicts and available class places before reserving.",
                    ],
                    [
                      FileText,
                      "A policy at every booking",
                      "Booking records keep their cancellation and no-show terms, even when future policies change.",
                    ],
                    [
                      Activity,
                      "Progress after the session",
                      "Capture the outcome and next focus alongside the client’s training history.",
                    ],
                    [
                      Users,
                      "A dedicated client view",
                      "Let clients see their own purchases, bookings, progress and remaining sessions.",
                    ],
                  ]
                : [
                    [
                      Users,
                      "People & teams",
                      "Organize members, coaches and groups with shared profiles and private account photos.",
                    ],
                    [
                      CalendarDays,
                      "Training & attendance",
                      "Keep sessions, coach assignments and attendance connected to the roster.",
                    ],
                    [
                      Wallet,
                      "Dues & payment review",
                      "Record member dues, review submitted transfers and keep corrections traceable.",
                    ],
                    [
                      Clock3,
                      "Payment follow-ups",
                      "Configure follow-up rules and inspect delivery history. Email setup is required.",
                    ],
                    [
                      Layers,
                      "A view across locations",
                      "Owners can oversee their own locations. Each branch keeps separate records and access.",
                    ],
                    [
                      FileText,
                      "Reports & exports",
                      "Review the recorded activity and export the data your role is allowed to access.",
                    ],
                  ]
              ).map(([Icon, title, text]: any) => (
                <article key={title}>
                  <span>
                    <Icon size={23} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        {(home || page === "platform") && (
          <section className="m-section m-role-section">
            <div className="m-role-copy">
              <SectionHeading
                label="ONE PLATFORM. THE RIGHT PERSPECTIVE."
                title="Your team sees what matters to them."
                text="Give owners oversight, staff a clear plan and members a view of their own journey. An invitation to one branch doesn’t open every location."
              />
              <a className="m-text-link" href="/demo">
                Explore every role <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="m-role-list">
              {[
                [
                  "01",
                  "Owner & admin",
                  "Rosters, payment reviews and the next operational decision.",
                ],
                [
                  "02",
                  "Coach & trainer",
                  "Assigned people, upcoming training and session outcomes.",
                ],
                [
                  "03",
                  "Member & client",
                  "Their sessions, payment status and personal progress.",
                ],
              ].map(([n, title, text]) => (
                <div key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <ArrowUpRight size={19} />
                </div>
              ))}
            </div>
          </section>
        )}
        {(home || page === "platform") && <ExperienceShowcase />}
        {(home || page === "sports" || detail) && <SportsStory />}
        {page === "club-life" && <SocialTeaser />}

        {home && (
          <section className="m-section m-pricing-teaser">
            <div>
              <span className="m-eyebrow">
                ROOM TO START. CLARITY TO CONTINUE.
              </span>
              <h2>
                Start with your workflow.
                <br />
                Choose your support.
              </h2>
              <p>
                Starter from IDR 250,000 per workspace per 30-day paid term. Pro
                adds scheduled setup and onboarding support.
              </p>
              <a className="m-text-link" href="/pricing">
                See pricing and what’s included <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="m-trial-card">
              <span>YOUR FIRST STEP</span>
              <strong>14 days</strong>
              <p>to set up your workspace and explore your workflow.</p>
              <a href="/products" className="m-button">
                Choose a product <ArrowRight size={16} />
              </a>
              <small>Initial trial · No automatic charges</small>
            </div>
          </section>
        )}
        {page === "sports" && (
          <section className="m-section">
            <SectionHeading
              label="YOUR SPORT, YOUR WORKFLOW"
              title="A shared foundation for different disciplines."
              text="Structured categories help keep records consistent. Sport-specific scoring, rankings and federation rules are outside the operational platform."
            />
            <div className="m-sport-grid">
              {SPORTS.map(([id, label]) => (
                <span key={id}>{label}</span>
              ))}
            </div>
            <div className="m-price-note">
              <ShieldCheck size={22} />
              <p>
                Choose the country, currency and time zone that fit your
                workspace. The interface is English. Currency formatting does
                not add international payment processing, tax calculation or
                exchange-rate conversion.
              </p>
            </div>
          </section>
        )}
        {contact && (
          <section className="m-section m-contact-grid">
            <article className="m-contact-card">
              <Mail size={28} />
              <h2>Start with your workflow.</h2>
              <p>
                Tell us your sport, team size, locations, current tools and the
                part that needs the most attention. We’ll use that context to
                discuss product fit or a setup scope.
              </p>
              <a
                className="m-button"
                href={
                  "mailto:courvix.id@gmail.com?subject=" +
                  encodeURIComponent(
                    page === "custom"
                      ? "Courvix custom project enquiry"
                      : "Courvix product and setup enquiry",
                  )
                }
              >
                Email Courvix <ArrowUpRight size={17} />
              </a>
              <small>
                Opens your email app. No enquiry is sent until you send it.
              </small>
            </article>
            <div className="m-contact-notes">
              <h3>A useful first message includes:</h3>
              <ol>
                <li>Club Management or Personal Training?</li>
                <li>How many locations and people?</li>
                <li>What are you using today?</li>
                <li>Where does the process get stuck?</li>
              </ol>
              <p>
                Already using Courvix? Include your workspace name for access,
                billing or data requests. Never email passwords or API keys.
              </p>
              <a className="m-text-link" href="mailto:courvix.id@gmail.com">
                courvix.id@gmail.com <ArrowUpRight size={15} />
              </a>
            </div>
          </section>
        )}
        {page === "club-life" && (
          <section className="m-section m-journal">
            {[
              [
                "01 / CONSISTENCY",
                "Make showing up easier.",
                "A session needs more than a time on a calendar. Make the place, coach and preparation clear. When plans change, keep the operational record up to date so the next decision is easy.",
              ],
              [
                "02 / PROGRESS",
                "Record the next focus.",
                "A short note after training is more useful than a vague promise of progress. Capture what changed, what needs work and what the client and coach agreed to do next.",
              ],
              [
                "03 / CLARITY",
                "Keep money conversations specific.",
                "Pending is different from under review. A reserved session is different from a completed one. Clear records give your team a shared starting point when discussing payment or session balances.",
              ],
            ].map(([label, title, text]) => (
              <article key={label}>
                <small>{label}</small>
                <h2>{title}</h2>
                <p>{text}</p>
                <a href="/demo" className="m-text-link">
                  See it in the demo <ArrowUpRight size={15} />
                </a>
              </article>
            ))}
          </section>
        )}
        {(home ||
          detail ||
          page === "pricing" ||
          page === "platform" ||
          page === "products") && <Faq />}
        <section className="m-section m-final-cta">
          <div>
            <span className="m-eyebrow">
              YOUR NEXT SESSION STARTS WITH A CLEARER SYSTEM.
            </span>
            <h2>
              See what a calmer
              <br />
              workday could look like.
            </h2>
            <p>
              Open a sample workspace. Switch roles. Follow a member or client
              from invitation to training.
            </p>
          </div>
          <div>
            <a
              href={detail ? (training ? ptDemo : clubDemo) : "/demo"}
              className="m-button"
            >
              Explore the demo <ArrowUpRight size={18} />
            </a>
            <span>Sample data. Simulated payments and emails.</span>
            <a href="/products" className="m-text-link">
              Or choose your product <ArrowRight size={15} />
            </a>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
