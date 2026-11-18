import {FEATURE_CATALOG,roleCeiling,effectivePermissions,normalizePermissions,canFeature} from "./feature-access.ts";
import {
  RELEASE_VERSION,
  releaseReadiness,
  validateReleaseEvidence,
} from "./release-readiness.ts";
import { applyPT, trainerView, ensurePT } from "./personal-training.ts";
import { platformSummary } from "./platform-summary.ts";
import { canonicalSport, validAmount } from "./sports.ts";
import { emptyWorkspace, type DB, type Row } from "./courvix.ts";
import { scoped, mergeScoped, type Identity } from "./access-policy.ts";
import {
  reminderSlot,
  reminderText,
  defaultReminderPreference,
  type ReminderPreference,
} from "./reminder-policy.ts";
export type DemoRole = "Platform" | "Owner" | "Admin" | "Coach" | "Member";
export type DemoState = {
  version: 3;
  accessControl?: {defaults:Record<string,Record<string,any>>;links:any[];requests:any[]};
  organizations: any[];
  accountProfiles: Record<string, any>;
  today: string;
  role: DemoRole;
  club: string;
  member: string;
  data: DB;
  revision: number;
  invites: any[];
  users: any[];
  billing: any[];
  mail: any[];
  choices: any[];
  reminders: any[];
  preferences: Record<string, ReminderPreference>;
  events: any[];
  journey: Record<string, boolean>;
};
const id = () => crypto.randomUUID();
export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(date + "T12:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function createDemoState(populated = true): DemoState {
  const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Jakarta",
    }),
    data = emptyWorkspace(),
    club = "demo-batam",
    period = today.slice(0, 7);
  const s: DemoState = {
    version: 3,
    organizations: [],
    accountProfiles: {},
    today,
    role: "Owner",
    club,
    member: "m-1",
    data,
    revision: 0,
    invites: [],
    users: [],
    billing: [],
    mail: [],
    choices: [],
    reminders: [],
    preferences: {},
    events: [],
    journey: {},
  };
  if (!populated) return s;
  data.records.Clubs = [
    {
      id: club,
      club,
      name: "Batam Sports Academy",
      short: "BSA",
      sport: "Basket",
      groupLabel: "Tim",
      group_label: "Tim",
      timezone: "Asia/Jakarta",
      plan: "Starter",
      status: "Trial",
      trial_ends: shiftDate(today, 14),
      trialEnds: shiftDate(today, 14),
      bank_name: "Example bank · simulated",
      bank_account: "0000000000",
      bank_holder: "Batam Sports Academy — sample",
    },
  ];
  data.websites[club] = {
    title: "Batam Sports Academy",
    headline: "Grow together.",
    about: "Sample records for the Courvix demo.",
  };
  data.records.Coaches = [
    {
      id: "coach-1",
      club,
      name: "Rizky Pratama",
      email: "coach@example.test",
      team: "t-1",
      description: "Fundamental basket",
      status: "Active",
    },
    {
      id: "coach-2",
      club,
      name: "Nadia Putri",
      email: "nadia@example.test",
      team: "t-2",
      description: "Persiapan pertandingan",
      status: "Active",
    },
  ];
  data.records.Teams = [
    {
      id: "t-1",
      club,
      name: "Basket U-15",
      sport: "Basket",
      coachId: "coach-1",
      coach: "Rizky Pratama",
      status: "Active",
    },
    {
      id: "t-2",
      club,
      name: "Basket U-18",
      sport: "Basket",
      coachId: "coach-2",
      coach: "Nadia Putri",
      status: "Active",
    },
  ];
  data.records.Membership = [
    {
      id: "plan-1",
      club,
      name: "Academy Bulanan",
      amount: 350000,
      benefits: "8 training sessions and coach evaluation",
      description: "Monthly club dues",
      status: "Active",
    },
  ];
  const names = [
    "Aditya Putra",
    "Nadia Safitri",
    "Bima Prakoso",
    "Chelsea Wijaya",
    "Fajar Maulana",
    "Sarah Aulia",
    "Kevin Hartono",
    "Alya Permata",
    "Dimas Saputra",
    "Michelle Tan",
    "Rizky Ramadhan",
    "Gilang Pratama",
  ];
  data.records.Members = names.map((name, i) => ({
    id: "m-" + (i + 1),
    club,
    name,
    email: i === 0 ? "member@example.test" : `member${i + 1}@example.test`,
    team: i < 6 ? "t-1" : "t-2",
    membership: "plan-1",
    amount: 350000,
    date: today,
    status: "Active",
  }));
  data.records.Invoices = data.records.Members.map((m, i) => ({
    id: "inv-" + (i + 1),
    club,
    member: m.id,
    name: m.name,
    amount: 350000,
    period,
    date: today,
    due: shiftDate(today, i === 0 ? -3 : 2),
    status: i < 6 ? "Pending" : "Paid",
    fee: 0,
    gateway: 0,
    method: "Bank transfer",
    ...(i >= 6
      ? {
          paymentDate: today + "T09:00:00Z",
          verifiedAt: today + "T09:00:00Z",
          verifiedBy: "admin@example.test",
          reference: "DEMO-TRF-" + i,
        }
      : {}),
  }));
  data.records.Payments = data.records.Invoices.filter(
    (i) => i.status === "Paid",
  ).map((i) => ({
    id: "pay-" + i.id,
    club,
    invoice: i.id,
    member: i.member,
    name: i.name,
    amount: i.amount,
    total: i.amount,
    fee: 0,
    gateway: 0,
    status: "Paid",
    method: "Bank transfer",
    reference: i.reference,
    date: today + "T09:00:00Z",
    verifiedBy: "admin@example.test",
  }));
  data.records.Schedule = [
    {
      id: "s-1",
      club,
      name: "Fundamental & ball handling",
      team: "t-1",
      coachId: "coach-1",
      date: today,
      time: "16:00",
      endTime: "17:30",
      venue: "GOR Batam · Court A",
      status: "Scheduled",
      description: "Ball control and coordination",
    },
    {
      id: "s-2",
      club,
      name: "Tactical session U-18",
      team: "t-2",
      coachId: "coach-2",
      date: shiftDate(today, 1),
      time: "17:00",
      endTime: "18:30",
      venue: "GOR Batam · Court B",
      status: "Scheduled",
    },
  ];
  // Synthetic history only: seed enough linked activity to explore each role's charts.
  for (let i=0;i<4;i++) {
    const date=shiftDate(today,-(i+1)*2),team=i%2===0?"t-1":"t-2",id="history-session-"+i;
    data.records.Schedule.push({id,club,name:["Technique foundations","Team coordination","Movement & control","Game preparation"][i],team,coachId:i%2===0?"coach-1":"coach-2",date,time:"16:00",endTime:"17:30",venue:"GOR Batam · Training court",status:"Completed"});
    data.records.Attendance.push(...data.records.Members.filter(m=>m.team===team).map((m,j)=>({id:id+"-"+m.id,club,session:id,member:m.id,team,date,name:m.name,status:j===5?"Absent":j===4?"Late":"Present"})));
  }
  for(let i=0;i<3;i++)data.records.Schedule.push({id:"next-session-"+i,club,name:["Passing & movement","Finishing practice","Group development"][i],team:i%2===0?"t-1":"t-2",coachId:i%2===0?"coach-1":"coach-2",date:shiftDate(today,i+2),time:"16:00",endTime:"17:30",venue:"GOR Batam · Training court",status:"Scheduled"});
  data.records.Training = [
    {
      id: "training-1",
      club,
      name: "Technique foundations",
      session: "s-1",
      team: "t-1",
      coachId: "coach-1",
      objective: "Ball control",
      duration: 90,
      description: "Warm-up, drills and evaluation",
      status: "Active",
    },
  ];
  data.records.Competitions = [
    {
      id: "comp-1",
      club,
      name: "Batam Youth Championship",
      team: "t-1",
      coachId: "coach-1",
      category: "U-15",
      organizer: "Panitia olahraga lokal",
      date: shiftDate(today, 20),
      deadline: shiftDate(today, 10),
      venue: "GOR Batam",
      status: "Registration",
    },
  ];
  data.records.Expenses = [
    {
      id: "expense-1",
      club,
      name: "Sewa lapangan",
      amount: 500000,
      date: today,
      description: "Venue",
    },
  ];
  data.records.Announcements = [
    {
      id: "news-1",
      club,
      name: "Preparing for this week’s training",
      description: "Arrive 15 minutes before training and bring water.",
      status: "Active",
      date: today,
    },
  ];
  data.records.Documents = [
    {
      id: "doc-1",
      club,
      name: "Member guide",
      description:
        "Bring the right equipment. Contact the administrator if you cannot attend.",
      status: "Active",
      date: today,
    },
  ];
  s.users = [
    {
      id: "u-owner",
      club,
      name: "Gilang · Club owner",
      email: "owner@example.test",
      role: "Owner",
      active: 1,
    },
    {
      id: "u-admin",
      club,
      name: "Dewi · Club admin",
      email: "admin@example.test",
      role: "Admin",
      active: 1,
    },
    {
      id: "u-coach",
      club,
      name: "Rizky Pratama",
      email: "coach@example.test",
      role: "Coach",
      active: 1,
      team: "t-1",
      subject: "coach-1",
    },
    {
      id: "u-member",
      club,
      name: "Aditya Putra",
      email: "member@example.test",
      role: "Member",
      active: 1,
      team: "t-1",
      subject: "m-1",
    },
  ];
  s.preferences[club] = {
    ...defaultReminderPreference,
    enabled: true,
    emailEnabled: true,
  };
  for (const role of ["Coach", "Member"]) {
    const u = s.users.find((u) => u.role === role),
      code = id();
    const invite = {
      id: id(),
      club,
      name: u.name,
      email: u.email,
      role,
      team: u.team,
      subject: u.subject,
      code,
      expires: Date.parse(shiftDate(today, 7) + "T23:59:59Z"),
      used_at: null,
      revoked_at: null,
    };
    s.invites.push(invite);
    s.mail.push({
      id: id(),
      club,
      type: "Invitation",
      invite: invite.id,
      to_email: u.email,
      subject: "Invitation " + role + " · Batam Sports Academy",
      message:
        "You have been invited. Review and accept the invitation to open your workspace.",
      status: "Simulated",
      created_at: today,
    });
  }
  s.billing = [
    {
      id: "bill-1",
      club,
      club_name: "Batam Sports Academy",
      plan: "Starter",
      amount: 250000,
      status: "Review",
      reference: "DEMO-SUB-001",
      note: "Example subscription payment submission",
      created_at: today,
    },
  ];
  seedDemoNetwork(s);
  seedPTDemo(s);
  return s;
}
export function upgradeDemoState(s: any): DemoState {
  s.version = 3;
  s.organizations ||= [];
  s.accountProfiles ||= {};
  ensurePT(s.data);
  if (
    s.data.records.Clubs.some((c: any) => c.id === "demo-batam") &&
    !s.organizations.length
  )
    seedDemoNetwork(s);
  seedPTDemo(s);
  return s;
}
function seedDemoNetwork(s: DemoState) {
  const base = s.data.records.Clubs.find((c) => c.id === "demo-batam");
  if (!base) return;
  s.organizations = [
    {
      id: "demo-network",
      name: "Batam Sports Group",
      kind: "Club",
      owner: "owner@example.test",
      created_at: s.today,
    },
    {
      id: "demo-trainer-network",
      name: "Nusa Personal Training",
      kind: "Trainer",
      owner: "owner@example.test",
      created_at: s.today,
    },
  ];
  Object.assign(base, {
    organization_id: "demo-network",
    workspace_type: "Club",
    country: "ID",
    currency: "IDR",
    locale: "id",
    location: "Batam Center",
    created_at: s.today,
  });
  for (const [club, name, kind, org, sport, location, n] of [
    [
      "demo-sekupang",
      "BSA · Sekupang",
      "Club",
      "demo-network",
      "Basket",
      "Sekupang",
      8,
    ],
    [
      "demo-nusa",
      "Nusa PT · Studio One",
      "Trainer",
      "demo-trainer-network",
      "Fitness",
      "Nagoya",
      4,
    ],
  ] as const) {
    if (s.data.records.Clubs.some((c) => c.id === club)) continue;
    s.data.records.Clubs.push({
      ...base,
      id: club,
      club,
      name,
      short: kind === "Trainer" ? "NPT" : "BSA",
      organization_id: org,
      workspace_type: kind,
      sport,
      location,
      groupLabel: kind === "Trainer" ? "Kelas" : "Tim",
      group_label: kind === "Trainer" ? "Kelas" : "Tim",
      status: "Active",
      renew_at: shiftDate(s.today, 30),
      renewAt: shiftDate(s.today, 30),
      created_at: shiftDate(s.today, -30),
    });
    s.data.websites[club] = { title: name, headline: "", about: "Data demo" };
    const team = club + "-team",
      coach = club + "-coach";
    s.data.records.Coaches.push({
      id: coach,
      club,
      name: kind === "Trainer" ? "Maya · Personal Trainer" : "Andi Setiawan",
      email: coach + "@example.test",
      team,
      status: "Active",
      description: "Conditioning",
    });
    s.data.records.Teams.push({
      id: team,
      club,
      name: kind === "Trainer" ? "Strength · Personal class" : "Basket U-16",
      sport,
      coachId: coach,
      coach: kind === "Trainer" ? "Maya · Personal Trainer" : "Andi Setiawan",
      status: "Active",
    });
    s.data.records.Membership.push({
      id: club + "-plan",
      club,
      name: kind === "Trainer" ? "Private · 8 sessions" : "Academy",
      amount: kind === "Trainer" ? 800000 : 350000,
      status: "Active",
      benefits: "8 sessions",
      description: "Monthly",
    });
    for (let i = 1; i <= n; i++)
      s.data.records.Members.push({
        id: club + "-m" + i,
        club,
        name: [
          "Alya Permata",
          "Bima Putra",
          "Dimas Saputra",
          "Sarah Aulia",
          "Gilang Pratama",
          "Nadia Putri",
          "Kevin Hartono",
          "Michelle Tan",
        ][i - 1],
        email: `${club}-member${i}@example.test`,
        team,
        membership: club + "-plan",
        amount: kind === "Trainer" ? 800000 : 350000,
        date: s.today,
        status: "Active",
      });
    s.data.records.Schedule.push({
      id: club + "-s1",
      club,
      name:
        kind === "Trainer" ? "Personal · Strength & mobility" : "Team practice",
      team,
      coachId: coach,
      date: s.today,
      time: "09:00",
      endTime: "10:00",
      venue: location,
      status: "Scheduled",
    });
    for (let i = 1; i <= n; i++) {
      const invoice = {
        id: club + "-inv" + i,
        club,
        member: club + "-m" + i,
        name: s.data.records.Members.find((m) => m.id === club + "-m" + i)!
          .name,
        period: s.today.slice(0, 7),
        amount: kind === "Trainer" ? 800000 : 350000,
        date: s.today,
        due: shiftDate(s.today, 3),
        status: i % 2 === 0 ? "Paid" : "Pending",
        method: "Bank transfer",
        fee: 0,
        gateway: 0,
      };
      s.data.records.Invoices.push(invoice);
      if (invoice.status === "Paid")
        s.data.records.Payments.push({
          id: club + "-pay" + i,
          club,
          invoice: invoice.id,
          member: invoice.member,
          name: invoice.name,
          amount: invoice.amount,
          total: invoice.amount,
          status: "Paid",
          method: "Bank transfer",
          date: s.today,
          reference: "DEMO-TRF-" + i,
          fee: 0,
          gateway: 0,
        });
    }

    s.users.push(
      {
        id: club + "-owner",
        club,
        name: "Gilang · Club owner",
        email: "owner@example.test",
        role: "Owner",
        active: 1,
      },
      {
        id: club + "-admin",
        club,
        name: "Citra · Admin",
        email: "admin@example.test",
        role: "Admin",
        active: 1,
      },
      {
        id: club + "-coach-access",
        club,
        name: kind === "Trainer" ? "Maya · Personal Trainer" : "Andi Setiawan",
        email: coach + "@example.test",
        role: "Coach",
        team,
        subject: coach,
        active: 1,
      },
      {
        id: club + "-member-access",
        club,
        name: "Alya Permata",
        email: `${club}-member1@example.test`,
        role: "Member",
        team,
        subject: club + "-m1",
        active: 1,
      },
    );
    s.preferences[club] = { ...defaultReminderPreference };
  }
}
function seedPTDemo(s: DemoState) {
  ensurePT(s.data);
  const club = s.data.records.Clubs.find((c) => c.id === "demo-nusa");
  if (!club || s.data.records.PTPlans.some((p) => p.club === club.id)) return;
  const c = club.id,
    coachId = c + "-coach",
    members = s.data.records.Members.filter((m) => m.club === c);
  for (const m of members) {
    m.coachId = coachId;
    m.goal = "Build strength and consistent training habits";
    m.level = "Beginner";
  }
  const prices = [150000, 560000, 1040000, 1920000];
  [1, 4, 8, 16].forEach((n, i) =>
    s.data.records.PTPlans.push({
      id: "pt-plan-" + n,
      club: c,
      name: n === 1 ? "Single visit" : n + "-session pack",
      sessions: n,
      amount: prices[i],
      duration: 60,
      validDays: n === 1 ? 14 : n === 4 ? 30 : n === 8 ? 60 : 120,
      kind: n === 1 ? "Per visit" : "Session pack",
      status: "Active",
      description:
        "Personal coaching, a structured session and a progress check-in.",
    }),
  );
  s.data.records.PTSettings.push({
    id: "pt-settings",
    club: c,
    cancelHours: 12,
    noShowCharge: true,
    openTime: "07:00",
    closeTime: "21:00",
  });
  for (let i = 0; i < members.length; i++) {
    const client = members[i],
      plan = s.data.records.PTPlans.find(
        (p) => p.club === c && p.sessions === [8, 4, 16, 1][i % 4],
      )!,
      paid = i === 0 || i === 3,
      id = "pt-order-" + (i + 1);
    s.data.records.PTOrders.push({
      id,
      club: c,
      client: client.id,
      member: client.id,
      name: client.name,
      plan: plan.id,
      planName: plan.name,
      sessions: plan.sessions,
      amount: plan.amount,
      duration: plan.duration,
      validDays: plan.validDays,
      status: paid ? "Paid" : i === 2 ? "Review" : "Pending",
      date: shiftDate(s.today, -3),
      due: s.today,
      createdAt: shiftDate(s.today, -3) + "T09:00:00Z",
      reference: paid || i === 2 ? "DEMO-PT-TRANSFER-" + i : "",
      ...(paid
        ? {
            paidAt: shiftDate(s.today, -2) + "T09:00:00Z",
            expires: shiftDate(s.today, plan.validDays - 3),
            reviewedBy: "admin@example.test",
          }
        : {}),
    });
    if (paid)
      s.data.records.PTCredits.push({
        id: "pt-credit-" + i,
        club: c,
        client: client.id,
        order: id,
        delta: plan.sessions,
        reason: "Purchase",
        date: shiftDate(s.today, -2) + "T09:00:00Z",
        actor: "admin@example.test",
      });
  }
  if (members[0])
    s.data.records.PTSessions.push({
      id: "pt-session-1",
      club: c,
      client: members[0].id,
      order: "pt-order-1",
      coachId,
      date: shiftDate(s.today, -1),
      time: "09:00",
      endTime: "10:00",
      venue: "Nusa Studio · Nagoya",
      type: "Private",
      name: "Strength foundations",
      status: "Scheduled",
      createdAt: shiftDate(s.today, -2),
      progress: "",
      note: "",
    });
  s.data.records.PTClasses.push({
    id: "pt-class-1",
    club: c,
    coachId,
    name: "Small-group strength",
    date: shiftDate(s.today, 1),
    time: "10:00",
    endTime: "11:00",
    venue: "Nusa Studio · Room A",
    capacity: 4,
    status: "Scheduled",
  });
}
export function demoIdentity(s: DemoState): Identity {
  const role = s.role;
  const users = s.users.filter((u) => u.club === s.club && u.active);
  let u = users.find((u) => u.role === role);
  if (role === "Member")
    u = users.find((u) => u.role === "Member" && u.subject === s.member);
  if (role === "Platform")
    return {
      id: "platform",
      userId: "courvix.id@gmail.com",
      name: "Courvix owner",
      email: "courvix.id@gmail.com",
      role: "Administrator",
      club: s.club,
    };
  if (!u && role === "Member") {
    const member =
      s.data.records.Members.find(
        (m) => m.club === s.club && m.id === s.member,
      ) || s.data.records.Members.find((m) => m.club === s.club);
    if (member)
      u = {
        id: member.id,
        name: member.name,
        email: member.email,
        role: "Member",
        subject: member.id,
        team: member.team,
      };
  }
  if (!u)
    throw Error(
      "No active " +
        role +
        " active in this workspace. Follow the invitation flow or choose another role.",
    );
  return {
    id: u.id,
    userId: u.email,
    name: s.accountProfiles?.[u.email]?.display_name || u.name,
    email: u.email,
    club: s.club,
    role: u.role === "Owner" ? "Admin" : u.role,
    isOwner: u.role === "Owner",
    canInviteAdmin: u.role === "Owner" || !!u.can_invite_admin,
    permissions: effectivePermissions(u.role === "Owner" ? "Admin" : u.role,s.accessControl?.defaults?.[s.club+":"+u.role]||{},u.permissions||{}),
    team: u.team,
    ...(u.role === "Coach"
      ? {
          coach: u.subject,
          teams: s.data.records.Teams.filter(
            (t) => t.coachId === u.subject || t.id === u.team,
          ).map((t) => t.id),
        }
      : u.role === "Member"
        ? { member: u.subject }
        : {}),
  };
}
function event(s: DemoState, message: string) {
  s.events.unshift({ id: id(), message, date: s.today, role: s.role });
  s.events = s.events.slice(0, 100);
  s.data.records["Audit logs"].unshift({
    id: id(),
    club: s.club,
    name: message,
    actor: s.role,
    date: s.today,
    status: "Success",
  });
}
function requireAdmin(a: Identity) {
  if (a.role !== "Admin")
    throw Error("This action requires a workspace admin.");
}
function demoClubActive(s: DemoState) {
  const c = s.data.records.Clubs.find((c) => c.id === s.club);
  return (
    !!c &&
    ((c.status === "Trial" && String(c.trial_ends).slice(0, 10) > s.today) ||
      (c.status === "Active" &&
        String(c.renew_at || c.renewAt).slice(0, 10) >= s.today))
  );
}
function runReminders(s: DemoState) {
  if (!demoClubActive(s)) return { created: 0, sent: 0, blocked: 0, paused: 0 };
  let count = 0;
  const p = s.preferences[s.club] || defaultReminderPreference,
    club = s.data.records.Clubs.find((c) => c.id === s.club)!;
  for (const i of s.data.records[
    club.workspace_type === "Trainer" ? "PTOrders" : "Invoices"
  ].filter((i) => i.club === s.club)) {
    const member = s.data.records.Members.find((m) => m.id === i.member),
      choice =
        s.choices.find((c) => c.club === s.club && c.member === i.member)
          ?.decision || "Undecided",
      slot = reminderSlot(
        i,
        member,
        club.workspace_type === "Trainer" ? "Undecided" : choice,
        s.today,
        p,
      );
    if (!slot) continue;
    if (s.reminders.some((r) => r.invoice === i.id && r.slot === slot))
      continue;
    const r = {
      id: id(),
      club: s.club,
      invoice: i.id,
      member: i.member,
      slot,
      message: reminderText(
        i,
        club.name,
        club.currency || "IDR",
        club.locale || "id",
      ),
      delivery: p.emailEnabled ? "Sent" : "In-app",
      created_at: s.today,
      sent_at: p.emailEnabled ? s.today : null,
    };
    s.reminders.unshift(r);
    count++;
    if (p.emailEnabled)
      s.mail.unshift({
        id: id(),
        club: s.club,
        type: "Reminder",
        reminder: r.id,
        to_email: member!.email,
        subject: "Payment reminder · " + club.name,
        message: r.message,
        status: "Simulated",
        created_at: s.today,
      });
  }
  if (count) event(s, count + " simulated reminder(s) created");
  return {
    created: count,
    sent: p.emailEnabled ? count : 0,
    blocked: 0,
    paused: 0,
  };
}
export function advanceDemo(s: DemoState, days: number) {
  s.today = shiftDate(s.today, days);
  return runReminders(s);
}
export function simulateRequest(
  s: DemoState,
  path: string,
  method = "GET",
  b: any = {},
): { value: any; status?: number } {
  const url = new URL(path, "https://demo.example.test"),
    route = url.pathname;
  const a = (() => {
      try {
        return demoIdentity(s);
      } catch {
        return null;
      }
    })(),
    club = s.data.records.Clubs.find((c) => c.id === s.club);
  if (
    method !== "GET" &&
    ["/api/workspace", "/api/payments", "/api/profile"].includes(route) &&
    !demoClubActive(s)
  )
    throw Error(
      "The subscription expired. Records remain available for reading and export.",
    );
  const response = () => ({
    data: scoped(s.data, a!),
    revision: s.revision,
    session: a,
    directory: s.users
      .filter((u) => u.club === s.club)
      .map((u) => ({
        subject: u.subject,
        userId: u.email,
        name: s.accountProfiles[u.email]?.display_name,
        avatarUrl: s.accountProfiles[u.email]?.avatarData || "",
      })),
    renewalChoices: s.choices.filter(
      (c) =>
        c.club === s.club && (a?.role === "Admin" || a?.member === c.member),
    ),
    readOnly: !demoClubActive(s),
  });
  if (route === "/api/account") {
    const address =
        a?.email ||
        (s.role === "Platform" ? "courvix.id@gmail.com" : "owner@example.test"),
      target = url.searchParams.get("user") || address;
    const other = s.users.find((u) => u.email === target),
      isSelf = target === address;
    if (!isSelf && s.role !== "Platform" && a?.role !== "Admin")
      throw Error("This profile is unavailable to your account.");
    const p = s.accountProfiles[target] || {
      display_name: isSelf
        ? a?.name || "Gilang · Club owner"
        : other?.name || target,
      country: "ID",
      locale: "id",
      timezone: "Asia/Jakarta",
      title: target === "courvix.id@gmail.com" ? "Courvix Founder" : "",
      sport: "",
    };
    if (method === "GET")
      return {
        value: {
          user: {
            id: target,
            name: p.display_name,
            email: target,
            platformAdmin: target === "courvix.id@gmail.com",
          },
          profile: p,
          avatarUrl: p.avatarData || "",
          memberships: s.users
            .filter((u) => u.email === target && u.active)
            .map((u) => ({
              ...u,
              ...s.data.records.Clubs.find((c) => c.id === u.club),
            })),
          editable: isSelf,
        },
      };
    if (method === "PUT")
      s.accountProfiles[address] = {
        ...p,
        display_name: b.displayName || p.display_name,
        title: b.title || "",
        phone: b.phone || "",
        city: b.city || "",
        country: b.country || "ID",
        bio: b.bio || "",
        sport: b.sport || "",
        locale: b.locale || "id",
        timezone: b.timezone || "Asia/Jakarta",
        updated_at: new Date().toISOString(),
      };
    else if (method === "POST") {
      if (
        !/^data:image\/jpeg;base64,/.test(b.avatarData || "") ||
        b.avatarData.length > 200000
      )
        throw Error("Invalid photo.");
      s.accountProfiles[address] = {
        ...p,
        avatarData: b.avatarData,
        updated_at: new Date().toISOString(),
      };
    } else if (method === "DELETE")
      s.accountProfiles[address] = {
        ...p,
        avatarData: "",
        updated_at: new Date().toISOString(),
      };
    else throw Error("Action unavailable.");
    event(s, "Account profile updated");
    return { value: { ok: true } };
  }
  if (route === "/api/organization") {
    if (s.role !== "Owner")
      throw Error("Headquarters is available only to the organization owner.");
    if (method === "GET") {
      const clubs = s.data.records.Clubs.filter((c) =>
        s.users.some(
          (u) =>
            u.club === c.id &&
            u.email === a?.email &&
            u.role === "Owner" &&
            u.active,
        ),
      );
      return {
        value: {
          organizations: s.organizations.filter((o) => o.owner === a?.email),
          clubs,
          stats: clubs.map((c) => {
            const get = (mod: string) =>
              s.data.records[mod].filter((r) => r.club === c.id);
            const at = get("Attendance");
            return {
              club: c.id,
              members: get("Members").length,
              activeMembers: get("Members").filter((r) => r.status === "Active")
                .length,
              coaches: get("Coaches").length,
              sessions: get("Schedule").filter((r) => r.status !== "Cancelled")
                .length,
              outstanding: get("Invoices")
                .filter((i) => !["Paid", "Cancelled"].includes(i.status))
                .reduce((n, i) => n + i.amount, 0),
              collected: get("Payments").reduce(
                (n, r) => n + (r.total ?? r.amount ?? 0),
                0,
              ),
              attendance: at.length
                ? Math.round(
                    (at.filter((r) => r.status === "Present").length /
                      at.length) *
                      100,
                  )
                : null,
            };
          }),
        },
      };
    }
    if (b.action === "create") {
      if (!b.name) throw Error("Enter the organization name.");
      const org = {
        id: id(),
        name: b.name,
        kind: b.kind || "Club",
        owner: a?.email || "owner@example.test",
        created_at: s.today,
      };
      s.organizations.push(org);
      return { value: { ok: true, id: org.id }, status: 201 };
    }
    const org = s.organizations.find(
      (o) => o.id === b.organizationId && o.owner === a?.email,
    );
    if (!org) throw Error("Organization unavailable.");
    if (b.action === "attach") {
      const c = s.data.records.Clubs.find(
        (c) =>
          c.id === b.club &&
          !c.organization_id &&
          s.users.some(
            (u) =>
              u.club === c.id &&
              u.email === a?.email &&
              u.role === "Owner" &&
              u.active,
          ),
      );
      if (!c) throw Error("This location is unavailable.");
      c.organization_id = org.id;
    } else if (b.action === "rename") org.name = b.name;
    else throw Error("Action unavailable.");
    event(s, "Organization updated");
    return { value: { ok: true } };
  }
  if(route==="/api/access-control"){
    if(!a||a.role!=="Admin"||!canFeature(a,"Access",method!=="GET"))throw Error("Authorized administrator access is required.");
    const c=s.accessControl||=( {defaults:{},links:[],requests:[]} );
    const defaults=Object.fromEntries(["Admin","Coach","Member"].map(role=>[role,effectivePermissions(role,c.defaults[s.club+":"+role]||{})]));
    if(method==="GET")return {value:{session:a,club:{id:s.club,name:club?.name,product:club?.workspace_type},features:FEATURE_CATALOG,defaults,links:c.links.filter(l=>l.club===s.club),requests:c.requests.filter(r=>r.club===s.club),people:s.users.filter(u=>u.club===s.club),teams:s.data.records.Teams.filter(t=>t.club===s.club)}};
    const checkRole=(role:string)=>{if(!["Admin","Coach","Member"].includes(role)||role==="Admin"&&!a.isOwner&&!a.canInviteAdmin)throw Error("This role cannot be invited by your account.");};
    if(b.action==="defaults"){
      if(!a.isOwner)throw Error("Only the owner can change role defaults.");checkRole(b.role);c.defaults[s.club+":"+b.role]=normalizePermissions(b.role,b.permissions);
    }else if(b.action==="create-link"){
      checkRole(b.role);if(club?.workspace_type!=="Trainer"&&b.role!=="Admin"&&!s.data.records.Teams.some(t=>t.club===s.club&&t.id===b.team))throw Error("Choose a group.");
      const l={id:id(),club:s.club,name:b.name||b.role+" invitation",role:b.role,team:b.team,permissions:normalizePermissions(b.role,b.permissions||{}),expires:Date.now()+Number(b.days||7)*86400000,max_uses:Number(b.maxUses||25),uses:0,revoked_at:null};c.links.unshift(l);event(s,"Role invitation link created — demo only");return {value:{ok:true,id:l.id,url:"https://demo.example.test/join?link="+l.id},status:201};
    }else if(b.action==="revoke-link"){
      const l=c.links.find(l=>l.id===b.id&&l.club===s.club);if(!l)throw Error("Link unavailable.");checkRole(l.role);l.revoked_at=new Date().toISOString();
    }else if(b.action==="person"){
      const person=s.users.find(u=>u.id===b.id&&u.club===s.club&&u.active);if(!person||person.role==="Owner"||person.email===a.email||person.role==="Admin"&&!a.isOwner)throw Error("This access cannot be changed.");person.permissions=normalizePermissions(person.role,b.permissions);if(a.isOwner&&person.role==="Admin")person.can_invite_admin=!!b.canInviteAdmin;
    }else throw Error("This action is unavailable in the demo. Live invitation requests are reviewed in your workspace.");
    event(s,"Feature access updated — demo only");return {value:{ok:true}};
  }
  if (route === "/api/access" && method === "GET")
    return {
      value: {
        viewer: {
          id: "demo-viewer",
          name: a?.name || "Workspace owner",
          email: a?.email || "owner@example.test",
          platformAdmin: s.role === "Platform",
        },
        session: a,
        clubs: s.data.records.Clubs.filter((c) =>
          s.users.some(
            (u) => u.club === c.id && u.email === a?.email && u.active,
          ),
        ).map((c) => ({
          ...c,
          club: c.id,
          role: s.users.find(
            (u) => u.club === c.id && u.email === a?.email && u.active,
          )?.role,
        })),
        club: club ? { ...club, revision: s.revision } : null,
        users: s.users.filter((u) => u.club === s.club),
        invites: s.invites.filter((i) => i.club === s.club),
        teams: s.data.records.Teams.filter((t) => t.club === s.club),
        billing: s.billing.filter((i) => i.club === s.club),
        outbox: s.mail
          .filter((m) => m.type === "Invitation")
          .map((m) => ({ ...m, status: "Sent — simulasi" })),
        emailConfigured: true,
        subscriptionBank: {
          bank: "Example bank · simulated",
          account: "0000000000",
          holder: "Courvix — sample data",
        },
        supportEmail: "courvix.id@gmail.com",
      },
    };
  if (route === "/api/access" && method === "POST") {
    if (b.action === "switch") {
      const user = s.users.find(
        (u) => u.club === b.club && u.email === a?.email && u.active,
      );
      if (!user) throw Error("This location is unavailable.");
      s.club = b.club;
      s.role = user.role;
      if (user.role === "Member") s.member = user.subject;
      return { value: { ok: true } };
    }
    if (b.action === "register") {
      if (!b.clubName || !b.sport)
        throw Error("Complete the workspace name and sport.");
      const c = id(),
        orgId = b.organizationId || id();
      if (
        b.organizationId &&
        !s.organizations.some((o) => o.id === orgId && o.owner === a?.email)
      )
        throw Error("Organization unavailable.");
      if (!b.organizationId)
        s.organizations.push({
          id: orgId,
          name: b.organizationName || b.clubName,
          kind: b.workspaceType || "Club",
          owner: a?.email || "owner@example.test",
          created_at: s.today,
        });
      s.club = c;
      s.role = "Owner";
      s.data.records.Clubs.push({
        id: c,
        club: c,
        name: b.clubName,
        short: b.clubName.slice(0, 3).toUpperCase(),
        sport: canonicalSport(b.sport) || b.sport,
        organization_id: orgId,
        workspace_type: b.workspaceType || "Club",
        country: b.country || "ID",
        currency: b.currency || "IDR",
        locale: b.locale || "id",
        location: b.location || "",
        created_at: s.today,
        groupLabel: b.groupLabel || "Kelompok",
        group_label: b.groupLabel || "Kelompok",
        timezone: b.timezone || "Asia/Jakarta",
        plan: b.plan || "Starter",
        status: "Trial",
        trial_ends: shiftDate(s.today, 14),
        trialEnds: shiftDate(s.today, 14),
        bank_name: "",
        bank_account: "",
        bank_holder: "",
      });
      s.data.websites[c] = { title: b.clubName, headline: "", about: "" };
      s.users.push({
        id: id(),
        club: c,
        name: "Gilang · Club owner",
        email: "owner@example.test",
        role: "Owner",
        active: 1,
      });
      s.preferences[c] = { ...defaultReminderPreference };
      s.journey.register = true;
      event(s, "Workspace created with a 14-day trial");
      return { value: { ok: true, club: c }, status: 201 };
    }
    if (b.action === "join") {
      const inv = s.invites.find((i) => i.code === b.code);
      if (
        !inv ||
        inv.used_at ||
        inv.revoked_at ||
        inv.expires < Date.parse(s.today + "T00:00:00Z")
      )
        throw Error("This invitation is unavailable or expired.");
      inv.used_at = s.today;
      let user = s.users.find(
        (u) => u.club === inv.club && u.email === inv.email,
      );
      const mod = inv.role === "Coach" ? "Coaches" : "Members";
      let person = s.data.records[mod].find(
        (m) => m.club === inv.club && m.email === inv.email,
      );
      if (inv.role !== "Admin" && !person) {
        person = {
          id: id(),
          club: inv.club,
          name: inv.name,
          email: inv.email,
          team: inv.team,
          status: "Active",
          date: s.today,
        };
        s.data.records[mod].push(person);
      }
      if (!user) {
        user = {
          id: id(),
          club: inv.club,
          name: inv.name,
          email: inv.email,
          role: inv.role,
          active: 1,
          team: inv.team,
          subject: person?.id,
        };
        s.users.push(user);
      }
      user.active = 1;
      s.club = inv.club;
      s.role = inv.role;
      if (inv.role === "Member") s.member = person?.id || user.subject;
      s.journey["joined" + inv.role] = true;
      event(s, inv.role + " accepted the invitation");
      s.revision++;
      return { value: { ok: true } };
    }
    if (!a) throw Error("Create a workspace first.");
    requireAdmin(a);
    if (b.action === "invite") {
      if (b.role === "Admin" && !a.isOwner)
        throw Error("Only the owner can invite administrators.");
      if (
        !b.email ||
        !b.role ||
        (club?.workspace_type !== "Trainer" && b.role !== "Admin" && !b.team)
      )
        throw Error("Complete the email, role and group.");
      const inv = {
        id: id(),
        club: s.club,
        name: b.name || b.email,
        email: b.email,
        role: b.role,
        team: b.team,
        code: id(),
        expires: Date.parse(shiftDate(s.today, 7) + "T23:59:59Z"),
        used_at: null,
        revoked_at: null,
      };
      s.invites.unshift(inv);
      s.mail.unshift({
        id: id(),
        club: s.club,
        type: "Invitation",
        invite: inv.id,
        to_email: b.email,
        subject: "Invitation " + b.role + " · " + club!.name,
        message: "You are invited to join as " + b.role + ".",
        status: "Simulated",
        created_at: s.today,
      });
      s.journey["invited" + b.role] = true;
      event(s, "Invitation " + b.role + " created");
      return {
        value: {
          ok: true,
          inviteUrl: "https://demo.courvix.example/join?code=" + inv.code,
          delivery: "Sent",
        },
        status: 201,
      };
    }
    if (b.action === "settings") {
      if (!a.isOwner) throw Error("Only the owner can change settings.");
      Object.assign(club!, {
        name: b.clubName,
        groupLabel: b.groupLabel,
        group_label: b.groupLabel,
        timezone: b.timezone,
        country: b.country || club!.country,
        locale: b.locale || club!.locale,
        location: b.location || club!.location,
        bank_name: b.bankName,
        bank_account: b.bankAccount,
        bank_holder: b.bankHolder,
      });
      s.revision++;
      event(s, "Workspace settings saved");
      return { value: { ok: true } };
    }
    if (b.action === "subscribe") {
      if (!a.isOwner)
        throw Error(
          "Only the workspace owner can create subscription invoices.",
        );
      const bill = {
        id: id(),
        club: s.club,
        club_name: club!.name,
        plan: b.plan,
        amount: b.plan === "Club Pro" ? 500000 : 250000,
        status: "Pending",
        created_at: s.today,
      };
      s.billing.unshift(bill);
      event(s, "Subscription invoice created");
      return { value: { ok: true }, status: 201 };
    }
    if (b.action === "subscription-proof") {
      const bill = s.billing.find((i) => i.id === b.id && i.club === s.club);
      if (!bill) throw Error("Invoice unavailable.");
      Object.assign(bill, {
        status: "Review",
        reference: b.reference,
        note: b.note,
      });
      event(s, "Subscription payment submitted");
      return { value: { ok: true } };
    }
    if (b.action === "cancel-subscription-invoice") {
      const bill = s.billing.find((i) => i.id === b.id);
      if (bill) bill.status = "Cancelled";
      return { value: { ok: true } };
    }
    if (b.action === "revoke") {
      const i = s.invites.find((i) => i.id === b.id);
      if (i) i.revoked_at = s.today;
      event(s, "Invitation revoked");
      return { value: { ok: true } };
    }
    if (b.action === "revoke-user") {
      if (!a.isOwner) throw Error("Only the owner can revoke access.");
      const u = s.users.find((u) => u.id === b.id);
      if (!u || u.role === "Owner") throw Error("The owner cannot be revoked.");
      u.active = 0;
      event(s, "User access revoked");
      return { value: { ok: true } };
    }
    if (b.action === "transfer-owner") {
      const u = s.users.find(
        (u) => u.id === b.id && u.active && u.role === "Admin",
      );
      if (!a.isOwner || !u || b.confirm !== club!.name)
        throw Error("Check the target admin and confirm the workspace name.");
      club!.organization_id = null;
      const previous = s.users.find((u) => u.id === a.id)!;
      previous.role = "Admin";
      u.role = "Owner";
      s.revision++;
      event(s, "Workspace ownership transferred");
      return { value: { ok: true } };
    }
    if (b.action === "resend") return { value: { ok: true } };
    throw Error("This action is unavailable in the demo.");
  }
  if (route === "/api/operator") {
    if (s.role !== "Platform")
      throw Error("This panel is for the Courvix owner.");
    if (method === "GET") {
      const users = Array.from(
        new Set(s.users.map((u) => u.email).concat("courvix.id@gmail.com")),
      ).map((email) => ({
        id: email,
        email,
        name:
          s.accountProfiles[email]?.display_name ||
          s.users.find((u) => u.email === email)?.name ||
          "Courvix owner",
        created_at: s.today,
        avatarUrl: s.accountProfiles[email]?.avatarData || "",
      }));
      const memberships = s.users.map((u) => ({ ...u, user_id: u.email }));
      const overview = platformSummary(
        {
          clubs: s.data.records.Clubs,
          users,
          memberships,
          records: Object.entries(s.data.records).flatMap(([module, rows]) =>
            rows.map((r) => ({ ...r, module })),
          ),
          billing: s.billing,
          audit: s.events.map((e) => ({
            ...e,
            created_at: e.date,
            action: e.message,
            actor: e.role,
            club_name:
              s.data.records.Clubs.find((c) => c.id === e.club)?.name || "Demo",
          })),
        },
        s.today + "T12:00:00Z",
      );
      return {
        value: {
          ...overview,
          support: s.data.records.Support.map((t) => ({
            ...t,
            clubName: s.data.records.Clubs.find((c) => c.id === t.club)?.name,
          })),
          readiness: {
            admin: true,
            email: true,
            bank: true,
            support: true,
            schedulerKey: true,
          },
          release: RELEASE_VERSION,
          launch: releaseReadiness(s.data.records["Audit logs"] || []),
          jobRuns: [],
          delivery: [],
        },
      };
    }
    if (b.action === "launch-evidence") {
      const error = validateReleaseEvidence(b);
      if (error) throw Error(error);
      s.data.records["Audit logs"] ||= [];
      s.data.records["Audit logs"].unshift({
        id: id(),
        club: "platform",
        actor: "courvix.id@gmail.com",
        created_at: s.today + "T12:00:00Z",
        detail: JSON.stringify({
          gate: b.gate,
          verified: b.verified,
          note: b.note.trim(),
          release: RELEASE_VERSION,
        }),
      });
      event(s, "Demo release check recorded");
      return { value: { ok: true } };
    }
    if (b.action === "review-subscription") {
      const bill = s.billing.find((i) => i.id === b.id);
      if (!bill || bill.status !== "Review")
        throw Error("This invoice is not awaiting verification.");
      bill.status = b.decision === "approve" ? "Paid" : "Rejected";
      bill.note = b.note;
      const c = s.data.records.Clubs.find((c) => c.id === bill.club)!;
      if (b.decision === "approve") {
        c.status = "Active";
        c.plan = bill.plan;
        c.renewAt = shiftDate(s.today, 30);
        c.renew_at = c.renewAt;
      }
      s.revision++;
      s.journey.subscription = true;
      event(s, "Courvix operator reviewed the subscription");
      return { value: { ok: true } };
    }
    if (b.action === "support") {
      const t = s.data.records.Support.find((t) => t.id === b.id);
      if (t)
        Object.assign(t, {
          status: b.status,
          response: b.response,
          respondedAt: s.today,
        });
      s.revision++;
      event(s, "Courvix operator responded to the support request");
      return { value: { ok: true } };
    }
  }
  if (!a || !club)
    throw Error("Create a workspace or select an available role.");
  if (route === "/api/personal-training") {
    const now = s.today + "T12:00:00Z";
    if (method === "GET") {
      const value = trainerView(s.data, a, now);
      value.clients = value.clients.map((c) => {
        const user = s.users.find(
          (u) => u.club === s.club && u.subject === c.id,
        );
        return {
          ...c,
          avatarUrl: user
            ? s.accountProfiles[user.email]?.avatarData || ""
            : "",
        };
      });
      return {
        value: { ...value, revision: s.revision, readOnly: !demoClubActive(s) },
      };
    }
    if (!demoClubActive(s))
      throw Error(
        "The workspace subscription has expired. Read and export remain available.",
      );
    if (b.revision !== s.revision)
      throw Error("Records changed. Refresh and try again.");
    const result = applyPT(s.data, a, b, now);
    s.revision++;
    event(s, result.message);
    return { value: { ok: true, ...result } };
  }
  if (route === "/api/workspace") {
    if (method === "GET") return { value: response() };
    if (club.workspace_type === "Trainer")
      throw Error(
        "Use the Personal Training workspace to update training records.",
      );
    if (b.revision !== s.revision)
      throw Error("Records changed. Refresh the demo workspace.");
    const incoming = structuredClone(b.data);
    for (const t of incoming.records.Support || [])
      if (!s.data.records.Support.some((o) => o.id === t.id)) {
        t.createdBy = a.email;
        t.status = "Open";
      }
    const next: DB = mergeScoped(s.data, incoming, a);
    for (const i of next.records.Invoices) {
      const old = s.data.records.Invoices.find((o) => o.id === i.id);
      if (
        (!old && i.status !== "Pending") ||
        (old && i.status !== old.status && i.status !== "Cancelled")
      )
        throw Error("Use payment submission and administrator verification.");
      if (!validAmount(i.amount, club.currency || "IDR"))
        throw Error("Invalid invoice amount.");
      const choice = s.choices.find(
        (c) => c.member === i.member && c.club === i.club,
      );
      if (!old && choice?.decision === "Stop" && i.period > choice.period)
        throw Error("The member declined renewal for the next period.");
    }
    const billed = new Set();
    for (const i of next.records.Invoices) {
      if (i.status === "Cancelled") continue;
      const key = i.club + ":" + i.member + ":" + i.period;
      if (billed.has(key))
        throw Error("An invoice for this period already exists.");
      billed.add(key);
    }
    for (const session of next.records.Schedule) {
      if (session.endTime <= session.time)
        throw Error("The end time must be after the start time.");
      if (
        next.records.Schedule.some(
          (o) =>
            o.id !== session.id &&
            o.club === session.club &&
            o.date === session.date &&
            session.time < o.endTime &&
            session.endTime > o.time &&
            (session.team === o.team ||
              session.coachId === o.coachId ||
              session.venue === o.venue),
        )
      )
        throw Error(
          "This session conflicts with a group, coach or venue booking.",
        );
    }
    for (const att of next.records.Attendance) {
      const session = next.records.Schedule.find((i) => i.id === att.session),
        member = next.records.Members.find((m) => m.id === att.member);
      if (!session || !member || member.team !== session.team)
        throw Error("This member does not belong to the session group.");
      att.recordedBy = a.name;
      att.recordedAt = s.today;
    }
    s.data = next;
    s.revision++;
    s.journey.workspace = true;
    event(
      s,
      "Updated " +
        (a.role === "Coach" ? "training / attendance" : "club operations") +
        " saved",
    );
    return { value: response() };
  }
  if (route === "/api/payments") {
    if (b.revision !== s.revision)
      throw Error("Records changed. Refresh first.");
    const i = s.data.records.Invoices.find(
      (i) => i.id === b.id && i.club === s.club,
    );
    if (!i || (a.role !== "Admin" && a.member !== i.member))
      throw Error("Invoice unavailable.");
    if (b.action === "submit") {
      if (
        !["Pending", "Rejected", "Expired"].includes(i.status) ||
        !b.reference ||
        b.reference.length < 4
      )
        throw Error("Check the invoice status and transfer reference.");
      if (!club.bank_account)
        throw Error("The owner needs to configure the receiving bank account.");
      Object.assign(i, {
        status: "Review",
        reference: b.reference,
        paymentNote: b.note,
        submittedAt: s.today,
      });
      s.journey.paymentSubmitted = true;
      event(s, "Member submitted a transfer for review");
    } else if (b.action === "approve" || b.action === "reject") {
      requireAdmin(a);
      if (i.status !== "Review")
        throw Error("This payment is not under review.");
      if (b.action === "reject" && !b.note)
        throw Error("Enter a rejection reason.");
      Object.assign(i, {
        status: b.action === "approve" ? "Paid" : "Rejected",
        reviewNote: b.note,
        verifiedAt: s.today,
        verifiedBy: a.email,
        paymentDate: s.today,
        method: "Bank transfer",
      });
      if (b.action === "approve") {
        s.data.records.Payments.unshift({
          id: id(),
          club: s.club,
          invoice: i.id,
          member: i.member,
          name: i.name,
          amount: i.amount,
          total: i.amount,
          fee: 0,
          gateway: 0,
          status: "Paid",
          method: "Bank transfer",
          reference: i.reference,
          date: s.today,
          verifiedBy: a.email,
        });
        s.journey.paymentApproved = true;
      }
      event(
        s,
        "Admin " +
          (b.action === "approve" ? "memverifikasi" : "menolak") +
          " payment",
      );
    } else if (b.action === "reverse") {
      requireAdmin(a);
      if (i.status !== "Paid" || b.note?.length < 10)
        throw Error("Explain the correction in at least ten characters.");
      s.data.records.Payments.unshift({
        id: id(),
        club: s.club,
        invoice: i.id,
        member: i.member,
        name: i.name,
        amount: -i.amount,
        total: -i.amount,
        status: "Reversed",
        date: s.today,
        note: b.note,
        method: "Koreksi administrasi",
      });
      i.status = "Pending";
      i.correctionNote = b.note;
      event(s, "Payment correction recorded without deleting history");
    } else throw Error("This payment action is unavailable.");
    s.revision++;
    return { value: { ok: true, ...response() } };
  }
  if (route === "/api/profile") {
    const kind = url.searchParams.get("kind") || "",
      subject = url.searchParams.get("subject"),
      person = s.data.records[kind]?.find(
        (r) => r.id === subject && r.club === s.club,
      );
    if (
      !person ||
      (a.role !== "Admin" && a.member !== subject && a.coach !== subject)
    )
      throw Error("This profile is unavailable to your account.");
    if (method === "GET")
      return {
        value: {
          base: person,
          sport: club.sport,
          profile: s.data.records.Profiles.find((p) => p.id === subject) || {},
          documents: [],
          documentsEnabled: false,
        },
      };
    if (method === "PUT") {
      const profile = { ...b, id: subject, club: s.club, kind },
        index = s.data.records.Profiles.findIndex((p) => p.id === subject);
      if (index < 0) s.data.records.Profiles.push(profile);
      else s.data.records.Profiles[index] = profile;
      s.revision++;
      event(s, "Personal profile updated");
      return { value: { ok: true } };
    }
    throw Error("Identity document uploads are unavailable in V1.0.");
  }
  if (route === "/api/export")
    return {
      value: { exportedAt: s.today, demo: true, data: scoped(s.data, a) },
    };
  if (route === "/api/reminders") {
    const own = a.role === "Member" ? a.member : null;
    if (!["Admin", "Member"].includes(a.role))
      throw Error("Reminders are for administrators and members.");
    if (method === "GET")
      return {
        value: {
          session: a,
          club: {
            currency: club.currency || "IDR",
            locale: club.locale || "id",
          },
          preference: s.preferences[s.club] || defaultReminderPreference,
          choices: s.choices.filter(
            (c) => c.club === s.club && (!own || c.member === own),
          ),
          logs: s.reminders.filter(
            (r) => r.club === s.club && (!own || r.member === own),
          ),
          invoices: s.data.records[
            club.workspace_type === "Trainer" ? "PTOrders" : "Invoices"
          ].filter((i) => i.club === s.club && (!own || i.member === own)),
          members: s.data.records.Members.filter(
            (m) => m.club === s.club && (!own || m.id === own),
          ),
          emailConfigured: true,
        },
      };
    if (b.action === "configure") {
      requireAdmin(a);
      s.preferences[s.club] = {
        enabled: !!b.enabled,
        emailEnabled: !!b.emailEnabled,
        leadDays: Number(b.leadDays),
        intervalDays: Number(b.intervalDays),
      };
      event(s, "Reminder rules saved");
      return { value: { ok: true } };
    }
    if (b.action === "run") {
      requireAdmin(a);
      return { value: { ok: true, ...runReminders(s) } };
    }
    if (b.action === "choice") {
      const member = own || b.member,
        choice = {
          club: s.club,
          member,
          period: b.period,
          decision: b.decision,
          note: b.note,
          updated_at: s.today,
          updated_by: a.email,
        };
      s.choices = s.choices.filter(
        (c) => !(c.club === s.club && c.member === member),
      );
      s.choices.push(choice);
      s.journey.renewal = true;
      event(
        s,
        "Member memilih " +
          (b.decision === "Stop" ? "declined renewal" : "continue"),
      );
      return { value: { ok: true } };
    }
    if (b.action === "read") {
      const r = s.reminders.find((r) => r.id === b.id);
      if (r) r.read_at = s.today;
      return { value: { ok: true } };
    }
  }
  throw Error("This page is unavailable in the demo.");
}
