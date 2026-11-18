"use client";
import { canFeature } from "@/lib/feature-access";
import { ExportLink } from "./export-link";
import { useAppRequest, type AppRequest } from "./app-transport";
import AccountProfile, { Avatar } from "./account-profile";
import OrganizationHub from "./organization-hub";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { usePreferences, PreferenceControls, T } from "./preferences";
import { BrandLogo } from "@/components/brand";
import { SportSelect } from "@/components/catalog-fields";
import { sportOptions, validAmount, currencyDigits } from "@/lib/sports";
import PersonalTraining from "./personal-training";
import { ClubControlRoom } from "./control-room";
import { PersonProfile } from "./person-profile";
import {
  ModuleIntro,
  OperationDetails,
  TransactionDetails,
} from "./club-operations";
import "./professional.css";
import { CourvixSelect } from "@/components/courvix-select";
import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Users,
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  Shield,
  Search,
  Bell,
  ChevronRight,
  Trophy,
  Globe,
  Settings,
  LogOut,
  Download,
  Activity,
  Check,
  Layers,
  FileText,
  Megaphone,
  Dumbbell,
  LifeBuoy,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  CreditCard,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";
import {
  emptyWorkspace,
  clubs,
  money as formatMoney,
  feeFor,
  clubNet,
  type DB,
  type Row,
} from "@/lib/courvix";
import Landing from "./landing";
import Reminders from "./reminders-client";
import { ClubAccess, accessAction } from "./access-client";
import type { Identity } from "@/lib/access-policy";
import { TeamsView, CalendarView, MemberDetails } from "./operations";
const icons: any = {
  Profile: Users,
  Network: Globe,
  Dashboard: LayoutDashboard,
  ControlRoom: Layers,
  Members: Users,
  Teams: Layers,
  Coaches: GraduationCap,
  Attendance: ClipboardCheck,
  Schedule: CalendarDays,
  Training: Dumbbell,
  Competitions: Trophy,
  Membership: CreditCard,
  Invoices: FileText,
  Payments: Wallet,
  Finance: Activity,
  Announcements: Megaphone,
  Documents: FileText,
  Reports: Activity,
  Website: Globe,
  Settings: Settings,
  Clubs: Layers,
  Projects: Briefcase,
  "Audit logs": Shield,
  Support: LifeBuoy,
  Reminders: Bell,
};
const roleNav: Record<string, string[]> = {
  Admin: [
    "Profile",
    "Dashboard",
    "ControlRoom",
    "Members",
    "Teams",
    "Coaches",
    "Attendance",
    "Schedule",
    "Training",
    "Competitions",
    "Membership",
    "Invoices",
    "Reminders",
    "Payments",
    "Finance",
    "Announcements",
    "Documents",
    "Reports",
    "Settings",
    "Audit logs",
    "Support",
  ],
  Coach: [
    "Profile",
    "Dashboard",
    "ControlRoom",
    "Members",
    "Teams",
    "Attendance",
    "Schedule",
    "Training",
    "Competitions",
    "Announcements",
    "Documents",
    "Support",
  ],
  Member: [
    "Profile",
    "Dashboard",
    "Schedule",
    "Attendance",
    "Invoices",
    "Reminders",
    "Payments",
    "Announcements",
    "Documents",
    "Support",
  ],
  Administrator: [
    "Dashboard",
    "Clubs",
    "Payments",
    "Projects",
    "Reports",
    "Settings",
    "Audit logs",
    "Support",
  ],
};
const labels: Record<string, string> = {
  Dashboard: "Overview",
  ControlRoom: "Club control room",
  Members: "Member",
  Teams: "Kelompok",
  Coaches: "Coach",
  Attendance: "Attendance",
  Schedule: "Schedule",
  Training: "Training programs",
  Competitions: "Competitions",
  Membership: "Membership plans",
  Invoices: "Invoices",
  Payments: "Payments",
  Finance: "Finance",
  Announcements: "Announcements",
  Documents: "Club guide",
  Reports: "Reports",
  Settings: "Settings",
  Support: "Support",
  Reminders: "Reminders",
  Profile: "My profile",
  Network: "Headquarters",
  "Audit logs": "Activity history",
};
const initials = (s: string) =>
  s
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
export function Brand() {
  return <BrandLogo />;
}
export function Badge({ value }: { value: string }) {
  const { t } = usePreferences();
  return (
    <span
      className={
        "badge " +
        (["Paid", "Active", "Present", "Completed"].includes(value)
          ? "green"
          : ["Pending", "Important", "Late", "Discovery"].includes(value)
            ? "amber"
            : ["Failed", "Expired", "Absent"].includes(value)
              ? "red"
              : "neutral")
      }
    >
      {t(value)}
    </span>
  );
}
export default function Courvix({
  demo = false,
  onDemoExit,
  initialPage = "Dashboard",
  demoToday,
}: {
  demo?: boolean;
  onDemoExit?: () => void;
  initialPage?: string;
  demoToday?: string;
} = {}) {
  const request = useAppRequest();
  const { t, locale } = usePreferences();
  const [account, setAccount] = useState<any>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  useEffect(() => {
    const reload = () =>
      request("/api/account")
        .then((r) => (r.ok ? r.json() : null))
        .then(setAccount)
        .catch(() => {});
    reload();
    window.addEventListener("courvix-account-updated", reload);
    return () => window.removeEventListener("courvix-account-updated", reload);
  }, []);
  const [db, setDb] = useState<DB>(emptyWorkspace),
    [ready, setReady] = useState(false),
    [role, setRole] = useState("Admin"),
    [club, setClub] = useState(""),
    [page, setPage] = useState(initialPage),
    [surface, setSurface] = useState("app"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [pg, setPg] = useState(1),
    [modal, setModal] = useState<any>(null),
    [formDirty, setFormDirty] = useState(false),
    [discardDraft, setDiscardDraft] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(false),
    [session, setSession] = useState("batam-s0");
  const [storage, setStorage] = useState("local");
  const [readOnly, setReadOnly] = useState(false);
  const [renewalChoices, setRenewalChoices] = useState<any[]>([]);
  const [period, setPeriod] = useState(
    demoToday?.slice(0, 7) ||
      new Date()
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" })
        .slice(0, 7),
  );
  const periodLabel = new Date(period + "-01T12:00:00").toLocaleDateString(
    locale,
    { month: "long", year: "numeric" },
  );
  const today =
    demoToday ||
    new Date().toLocaleDateString("sv-SE", {
      timeZone: orgTimezone(),
    });
  function orgTimezone() {
    return (
      db.records.Clubs.find((c) => c.id === club)?.timezone || "Asia/Jakarta"
    );
  }
  const revision = useRef(0);
  const lock = useRef(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loadError, setLoadError] = useState("");
  const organizations = db.records.Clubs || clubs;
  const org: any = organizations.find((c: any) => c.id === club) || {
    id: club,
    name: "Courvix platform",
    short: "CVX",
    sport: "",
  };
  const money = (n: number) => formatMoney(n, org.currency || "IDR", locale);
  async function switchWorkspace(id: string) {
    await accessAction({ action: "switch", club: id }, request);
    await refreshWorkspace();
    go("Dashboard");
    setQuery("");
    setFilter("All");
    setModal(null);
  }
  async function logout() {
    try {
      if (demo) {
        onDemoExit?.();
        return;
      }
      const r=await request("/api/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
      const result:any=await r.json();if(!r.ok)throw Error(result.error||"Unable to sign out.");
      location.assign(result.next||"/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-out failed. Try again.");
    }
  }
  const admin = role === "Admin" || role === "Administrator";
  useEffect(() => {
    const controller = new AbortController();
    request("/api/workspace", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          location.replace(response.status === 403 ? "/waiting-room" : "/login");
          return;
        }
        if (!response.ok)
          throw Error("Unable to load the workspace. Reload to try again.");
        const payload = (await response.json()) as {
          data: DB;
          revision: number;
          session: Identity;
          readOnly: boolean;
          renewalChoices: any[];
          directory: any[];
        };
        if (controller.signal.aborted) return;
        setDb(payload.data);
        setDirectory(payload.directory || []);
        setReadOnly(payload.readOnly);
        setRenewalChoices(payload.renewalChoices || []);
        revision.current = payload.revision;
        setIdentity(payload.session);
        setRole(payload.session.role);
        setClub(payload.session.club);
        setStorage("cloud");
        setSession(payload.data.records.Schedule[0]?.id || "");
        const target = new URL(location.href).searchParams.get("module");
        if (
          target && canFeature(payload.session,target) &&
          (roleNav[payload.session.role].includes(target) ||
            (target === "Network" && payload.session.isOwner))
        )
          setPage(target);
        setReady(true);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setLoadError(e.message);
      });
    return () => controller.abort();
  }, []);
  const scope = (requested: string) => {
    const key = requested;
    const ownMember = db.records.Members.find(
      (m) => m.id === (identity?.member || club + "-1"),
    );
    return (db.records[key] || []).filter((r) => {
      if (role !== "Administrator" && r.club !== club) return false;
      if (role === "Member") {
        if (["Members", "Invoices", "Payments", "Attendance"].includes(key))
          return (
            r.id === (identity?.member || club + "-1") ||
            r.member === (identity?.member || club + "-1")
          );
        if (key === "Schedule") return r.team === ownMember?.team;
      }
      if (
        role === "Coach" &&
        ["Members", "Schedule", "Teams", "Attendance", "Training"].includes(key)
      )
        return (
          (identity?.teams || [identity?.team]).includes(r.team) ||
          (identity?.teams || [identity?.team]).includes(r.id) ||
          (identity?.teams || [identity?.team]).includes(
            db.records.Members.find((m) => m.id === r.member)?.team,
          )
        );
      return true;
    });
  };
  const members = scope("Members"),
    invoices = scope("Invoices"),
    sessions = scope("Schedule"),
    teams = scope("Teams"),
    paid = invoices.filter(
      (x) =>
        x.status === "Paid" &&
        (x.paymentDate || x.date || "").startsWith(period),
    ),
    gross = scope("Payments")
      .filter((p) => p.date?.startsWith(period))
      .reduce((sum, p) => sum + p.amount, 0),
    netRevenue = gross,
    fees = paid.reduce((s, r) => s + r.fee, 0),
    outstanding = invoices.filter((x) =>
      ["Pending", "Expired", "Rejected", "Review"].includes(x.status),
    ),
    expenses = scope("Expenses")
      .filter((r) => r.date?.startsWith(period))
      .reduce((s, r) => s + r.amount, 0),
    gateway = invoices
      .filter((r) => ["Paid", "Refunded"].includes(r.status))
      .reduce((s, r) => s + r.gateway, 0);
  const go = (p: string) => {
    if ((identity && !canFeature(identity,p)) || (!roleNav[role].includes(p) && !(p === "Network" && identity?.isOwner)))
      return;
    setPage(p);
    setQuery("");
    setFilter("All");
    setPg(1);
    setError("");
  };
  const closeDialog = () => {
    if (busy) return;
    if (formDirty) setDiscardDraft(true);
    else setModal(null);
  };
  const open = (m: any) => {
    setFormDirty(false);
    setDiscardDraft(false);
    if (m.type === "search") {
      setQuery("");
      setFilter("All");
    }
    setError("");
    setModal(m);
  };
  useEffect(() => {
    if (org.workspace_type === "Trainer") return;
    const key = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "k" &&
        !document.querySelector('[role="dialog"][aria-modal="true"]')
      ) {
        e.preventDefault();
        open({ type: "search" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [org.workspace_type]);
  useEffect(() => {
    if (!formDirty) return;
    const guard = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [formDirty]);
  async function mutate(fn: (d: DB) => DB, message: string) {
    if (lock.current) return;
    if (readOnly) {
      setError(
        "The subscription expired. Records remain readable and exportable. The owner can renew in Settings.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (!navigator.onLine)
        throw Error("Connection lost. Reconnect and try again.");
      const next = fn(structuredClone(db));
      let persisted = next;
      next.records["Audit logs"].unshift({
        id: crypto.randomUUID(),
        club,
        name: message,
        actor: role,
        date: new Date().toISOString(),
        status: "Success",
      });
      if (storage === "cloud") {
        const response = await request("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: next,
            revision: revision.current,
            reset: message === "Demo records reset",
          }),
          signal: AbortSignal.timeout(15000),
        });
        const result = (await response.json()) as {
          data: DB;
          revision: number;
          error?: string;
        };
        if (response.status === 401) {
          location.replace("/login");
          throw Error("Your session ended.");
        }
        if (!response.ok)
          throw Error(result.error || "Unable to save changes.");
        revision.current = result.revision;
        persisted = result.data;
        setDb(result.data);
      } else {
        throw Error("Server storage is not ready. Reload the page.");
      }
      if (modal?.origin === "ControlRoom") setModal(null);
      else if (modal?.type === "create" && modal.edit)
        setModal({
          type: "detail",
          module: modal.module,
          row: persisted.records[modal.module].find(
            (r: any) => r.id === modal.edit.id,
          ),
        });
      else setModal(null);
      setFormDirty(false);
      setDiscardDraft(false);
      toast.success(message);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The action failed. Try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refreshWorkspace() {
    const r = await request("/api/workspace", {
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw Error("Refresh the workspace to synchronize changes.");
    const p: any = await r.json();
    setDb(p.data);
    setDirectory(p.directory || []);
    setRenewalChoices(p.renewalChoices || []);
    setIdentity(p.session);
    setClub(p.session.club);
    setSession(p.data.records.Schedule[0]?.id || "");
    setRole(p.session.role);
    setReadOnly(!!p.readOnly);
    revision.current = p.revision;
  }
  function download(rows: Row[], name: string) {
    try {
      if (!rows.length) throw Error("No records are available to export.");
      const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
      const safe = (v: any) =>
        '"' +
        String(v ?? "")
          .replace(/^[=+@-]/, "'$&")
          .replaceAll('"', '""') +
        '"';
      const blob = new Blob(
        [
          "\ufeff" +
            [
              keys.join(","),
              ...rows.map((r) => keys.map((k) => safe(r[k])).join(",")),
            ].join("\r\n"),
        ],
        { type: "text/csv;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ".csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Ekspor siap.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  useEffect(() => {
    const ctx = (document as any).modelContext;
    if (!ctx?.registerTool) return;
    const c = new AbortController();
    Promise.resolve(
      ctx.registerTool(
        {
          name: "navigate_courvix",
          description: "Open an available module for the current Courvix role.",
          inputSchema: {
            type: "object",
            properties: { page: { type: "string", enum: roleNav[role] } },
            required: ["page"],
            additionalProperties: false,
          },
          execute: (input: any) => {
            if (!roleNav[role].includes(input?.page))
              throw Error("Module not available");
            go(input.page);
            return { page: input.page, mode: "workspace" };
          },
        },
        { signal: c.signal },
      ),
    ).catch(() => {});
    return () => c.abort();
  }, [role]);
  const fields = (mod: string): string[][] =>
    ({
      Members: [
        ["name", "Full name"],
        ["email", "Email", "email"],
        [
          "team",
          org.groupLabel ||
            (org.workspace_type === "Trainer" ? "Kelas" : "Tim"),
          "team",
        ],
        ["membership", "Membership plan", "membership"],
      ],
      Coaches: [
        ["name", "Full name"],
        ["email", "Email", "email"],
        ["description", "Specialty", "specialty"],
      ],
      Teams: [
        [
          "name",
          org.workspace_type === "Trainer" ? "Class name" : "Group name",
        ],
        ["sport", "Sport", "sport"],
        ["coachId", "Assigned coach", "coach"],
      ],
      Schedule: [
        ["name", "Session title"],
        [
          "team",
          org.groupLabel ||
            (org.workspace_type === "Trainer" ? "Kelas" : "Tim"),
          "team",
        ],
        ["coachId", "Assigned coach", "coach"],
        ["date", "Date", "date"],
        ["time", "Start", "time"],
        ["endTime", "End", "time"],
        ["venue", "Location"],
        ["description", "Session agenda", "textarea"],
        ["status", "Session status", "status"],
      ],
      Training: [
        ["name", "Program name"],
        ["session", "Training session", "session"],
        ["objective", "Training objective", "objective"],
        ["duration", "Duration (minutes)", "number"],
        ["description", "Drills", "textarea"],
        ["evaluation", "Evaluation / notes", "textarea"],
        ["status", "Program status", "status"],
      ],
      Competitions: [
        ["name", "Competition name"],
        ["team", "Participating group", "team"],
        ["coachId", "Accompanying coach", "coach"],
        ["category", "Age group / category", "category"],
        ["organizer", "Organizer"],
        ["date", "Event date", "date"],
        ["deadline", "Registration deadline", "date"],
        ["venue", "Location"],
        ["result", "Result / target", "textarea"],
        ["status", "Competition status", "status"],
      ],
      Membership: [
        ["name", "Plan name"],
        ["amount", `Monthly dues (${org.currency || "IDR"})`, "number"],
        ["benefits", "Benefits / number of sessions", "textarea"],
        ["description", "Membership terms", "textarea"],
        ["status", "Plan status", "status"],
      ],
      Invoices: [
        ["member", "Member", "member"],
        [
          "amount",
          `Dues (${org.currency || "IDR"}), no platform fee`,
          "number",
        ],
        ["period", "Period", "month"],
        ["description", "Description"],
        ["due", "Due date", "date"],
      ],
      Expenses: [
        ["name", "Description"],
        ["amount", `Amount (${org.currency || "IDR"})`, "number"],
        ["description", "Category", "expenseCategory"],
        ["date", "Date", "date"],
      ],
      Projects: [
        ["name", "Project name"],
        ["email", "Email", "email"],
        ["description", "Requirements", "textarea"],
      ],
    })[mod] || [
      ["name", "Title"],
      ["description", "Content / notes", "textarea"],
    ];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const mod = modal.module;
    if (
      !admin &&
      !["Training", "Support"].includes(mod) &&
      surface !== "landing"
    ) {
      setError("Access is not allowed.");
      return;
    }
    await mutate(
      (d) => {
        const row: any = {
          ...f,
          id: modal.edit?.id || crypto.randomUUID(),
          club,
          status:
            f.status ||
            modal.edit?.status ||
            (mod === "Invoices"
              ? "Pending"
              : mod === "Projects"
                ? "Lead"
                : mod === "Schedule"
                  ? "Scheduled"
                  : mod === "Competitions"
                    ? "Registration"
                    : "Active"),
          date:
            f.date || modal.edit?.date || new Date().toISOString().slice(0, 10),
        };
        if ("amount" in f) {
          row.amount = Number(f.amount);
          if (
            !validAmount(row.amount, org.currency || "IDR") ||
            row.amount <= 0
          )
            throw Error(
              "Enter a positive amount with the precision used by " +
                (org.currency || "IDR") +
                ".",
            );
        }
        if (mod === "Members") {
          if (
            d.records.Members.some(
              (m) =>
                m.club === club &&
                m.email === f.email &&
                m.id !== modal.edit?.id,
            )
          )
            throw Error("This email is already registered in the workspace.");
          row.amount =
            d.records.Membership.find(
              (p) => p.club === club && p.id === f.membership,
            )?.amount || 0;
        }

        if (mod === "Schedule" && (!f.team || !f.coachId))
          throw Error("Choose a group and session coach.");
        if (mod === "Training") {
          const session = d.records.Schedule.find(
            (s) => s.id === f.session && s.club === club,
          );
          if (!session) throw Error("Choose a valid session.");
          row.team = session.team;
          row.coachId = session.coachId;
        }
        if (mod === "Teams")
          row.coach = d.records.Coaches.find((c) => c.id === f.coachId)?.name;
        if (mod === "Schedule" && String(f.endTime) <= String(f.time))
          throw Error("The end time must be after the start time.");
        if (
          mod === "Schedule" &&
          d.records.Schedule.some(
            (s) =>
              s.id !== modal.edit?.id &&
              s.club === club &&
              s.date === f.date &&
              String(f.time) < String(s.endTime || s.time) &&
              String(f.endTime) > String(s.time) &&
              (s.venue === f.venue ||
                s.team === f.team ||
                s.coachId === f.coachId),
          )
        )
          throw Error("This time conflicts with an existing session.");
        if (mod === "Support") row.status = "Open";
        if (mod === "Invoices") {
          const m = d.records.Members.find(
            (m) => m.id === f.member && m.club === club,
          );
          if (!m) throw Error("Choose a valid workspace member.");
          row.name = m.name;
          row.fee = 0;
          row.gateway = 0;
          row.method = "Transfer bank";
        }
        if (modal.edit) {
          const index = d.records[mod].findIndex(
            (r) => r.id === modal.edit.id && r.club === club,
          );
          if (index < 0) throw Error("Record not found.");
          d.records[mod][index] = { ...d.records[mod][index], ...row };
        } else d.records[mod].unshift(row);
        return d;
      },
      mod + (modal.edit ? " updated successfully" : " added successfully"),
    );
  }
  const filtered = (key: string) =>
    scope(key).filter(
      (r) =>
        (filter === "All" || r.status === filter) &&
        Object.values(r).join(" ").toLowerCase().includes(query.toLowerCase()),
    );
  function List() {
    const rows = filtered(page);
    const financial = ["Invoices", "Payments"].includes(page);
    return (
      <>
        <div className="toolbar">
          <div className="searchbox">
            <Search size={17} />
            <input
              aria-label="Search records"
              placeholder={"Search " + page.toLowerCase() + "…"}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPg(1);
              }}
            />
          </div>
          <CourvixSelect
            aria-label="Filter status"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPg(1);
            }}
          >
            {[
              "All",
              ...Array.from(
                new Set(
                  scope(page)
                    .map((r) => r.status)
                    .filter(Boolean),
                ),
              ),
            ].map((s: any) => (
              <option key={s}>{s}</option>
            ))}
          </CourvixSelect>
          <button className="btn" onClick={() => download(rows, page)}>
            <Download size={16} />
            <T>{"Export"}</T>
          </button>
          {(page === "Support" ||
            admin ||
            (["Training", "Support"].includes(page) && role === "Coach")) &&
            !["Payments", "Audit logs"].includes(page) && (
              <button
                className="btn primary"
                onClick={() => open({ type: "create", module: page })}
              >
                <Plus size={16} />
                <T>{"Add"}</T>
              </button>
            )}
        </div>
        <div className="panel data-panel">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{financial ? "Invoice / Member" : "Name"}</TableHead>
                <TableHead>
                  {financial
                    ? "Amount"
                    : page === "Members"
                      ? "Team"
                      : "Details"}
                </TableHead>
                <TableHead>
                  {page === "Invoices" ? "Due date" : "Date"}
                </TableHead>
                <TableHead>
                  <T>{"Status"}</T>
                </TableHead>
                <TableHead className="text-right">
                  <T>{"Actions"}</T>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice((pg - 1) * 10, pg * 10).map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="identity">
                      <Avatar
                        name={r.name || "CV"}
                        url={
                          directory.find((u) => u.subject === r.id)?.avatarUrl
                        }
                      />
                      <div>
                        <strong>{r.name}</strong>
                        <small>
                          {financial
                            ? r.id
                            : r.email ||
                              r.sport ||
                              r.actor ||
                              r.id.slice(0, 10)}
                        </small>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    data-label={
                      financial
                        ? "Amount"
                        : page === "Members"
                          ? "Team"
                          : "Details"
                    }
                  >
                    {financial || page === "Membership"
                      ? money(r.amount)
                      : page === "Members"
                        ? db.records.Teams.find((t) => t.id === r.team)?.name
                        : r.description?.slice(0, 58) ||
                          r.coach ||
                          r.venue ||
                          "—"}
                  </TableCell>
                  <TableCell data-label={financial ? "Due date" : "Date"}>
                    {r.due || r.date?.slice(0, 10) || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge value={r.status || "Recorded"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="text-btn"
                      onClick={() =>
                        open({
                          type: page === "Invoices" ? "payment" : "detail",
                          row: r,
                          module: page,
                        })
                      }
                    >
                      <T>{"Detail "}</T>
                      <ChevronRight size={14} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!rows.length && (
            <div className="empty">
              <Search />
              <h3>
                <T>{"No matching records"}</T>
              </h3>
              <p>
                <T>{"Change your filter or add the first record."}</T>
              </p>
            </div>
          )}
          <div className="tablefoot">
            <span>
              {rows.length}
              <T>{"records · page "}</T>
              {pg}
              <T>{"of"}</T> {Math.max(1, Math.ceil(rows.length / 10))}
            </span>
            <div className="actions">
              <button
                className="btn small"
                aria-label="Previous page"
                disabled={pg === 1}
                onClick={() => setPg(pg - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                className="btn small"
                aria-label="Next page"
                disabled={pg * 10 >= rows.length}
                onClick={() => setPg(pg + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  function ScheduleList() {
    return (
      <div className="schedule-list">
        {sessions
          .filter((s) => s.date >= today && s.status !== "Cancelled")
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
          .slice(0, 4)
          .map((s, i) => (
            <button
              key={s.id}
              onClick={() =>
                open({ type: "detail", row: s, module: "Schedule" })
              }
              className="schedule-row"
            >
              <span
                className={"date-tile " + (s.date === today ? "today" : "")}
              >
                <small>
                  {s.date === today
                    ? "HARI INI"
                    : new Date(s.date + "T12:00:00").toLocaleDateString(
                        locale,
                        { month: "short" },
                      )}
                </small>
                <b>{s.date.slice(-2)}</b>
              </span>
              <span className="schedule-info">
                <strong>{s.name}</strong>
                <small>
                  {s.time} {org.timezone} · {s.venue}
                </small>
                <span className="tag">
                  {db.records.Teams.find((t) => t.id === s.team)?.name}
                </span>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
      </div>
    );
  }
  function Chart() {
    const amounts = Array.from({ length: 7 }, (_, i) =>
      scope("Payments")
        .filter((r) => r.date?.startsWith(period))
        .filter(
          (r) =>
            Math.min(6, Math.floor((Number(r.date.slice(8, 10)) - 1) / 5)) ===
            i,
        )
        .reduce((s, r) => s + r.amount, 0),
    );
    const max = Math.max(...amounts, 1);
    return (
      <>
        <div className="chart">
          <div className="chart-y">
            {[1, 0.75, 0.5, 0.25, 0].map((n) => (
              <span key={n}>
                {new Intl.NumberFormat(locale, {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(max * n)}
              </span>
            ))}
          </div>
          <div className="plot">
            <div className="gridlines">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="bars">
              {amounts.map((n, i) => (
                <div className="bar-col" key={i}>
                  <div
                    title={money(n)}
                    className={i === 4 ? "bar selected" : "bar"}
                    style={{ height: Math.max(2, (n / max) * 100) + "%" }}
                  />
                  <span>
                    {
                      [
                        "01–05",
                        "06–10",
                        "11–15",
                        "16–20",
                        "21–25",
                        "26–30",
                        "31",
                      ][i]
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="chart-caption">
          <T>{"Verified payments"}</T> · {org.currency || "IDR"} · {periodLabel}
        </p>
      </>
    );
  }
  function Dashboard() {
    const metrics =
      role === "Coach"
        ? [
            ["Group members", String(members.length), "Assigned roster", Users],
            ["My groups", String(teams.length), "Training groups", Layers],
            [
              "Upcoming sessions",
              String(sessions.length),
              "Scheduled session",
              CalendarDays,
            ],
            [
              "Attendance notes",
              String(scope("Attendance").length),
              "Kehadiran tercatat",
              ClipboardCheck,
            ],
          ]
        : role === "Member"
          ? [
              [
                "Keanggotaan saya",
                scope("Members")[0]?.status || "—",
                org.name,
                CreditCard,
              ],
              [
                "My invoices",
                String(invoices.length),
                "Iuran pribadi",
                FileText,
              ],
              [
                "Unpaid",
                money(outstanding.reduce((s, r) => s + r.amount, 0)),
                "Awaiting payment",
                Wallet,
              ],
              [
                "Next session",
                sessions[0]?.time || "—",
                "Scheduled session",
                CalendarDays,
              ],
            ]
          : [
              [
                "Total members",
                members.length.toLocaleString("en-US"),
                teams.length + " kelompok aktif",
                Users,
              ],
              [
                "Received this month",
                money(role === "Administrator" ? fees : gross),
                "Transfer terverifikasi",
                Wallet,
              ],
              [
                "Paid invoices",
                Math.round((paid.length / Math.max(1, invoices.length)) * 100) +
                  "%",
                paid.length + " verified invoices",
                Activity,
              ],
              [
                "Unpaid",
                money(outstanding.reduce((s, r) => s + r.amount, 0)),
                outstanding.length + " invoice(s) need follow-up",
                FileText,
              ],
            ];
    return (
      <>
        <div className="welcome">
          <div>
            <p className="eyebrow">
              <T>{"KLUBMU DALAM SATU PANDANGAN"}</T>
            </p>
            <h1>
              {role === "Administrator"
                ? "The Courvix overview"
                : role === "Coach"
                  ? "Help your team grow"
                  : role === "Member"
                    ? "Ready for your next session"
                    : `Selamat datang, ${identity?.name || "tim"}`}
              <span className="orange">.</span>
            </h1>
            <p>
              <T>{"Activity and follow-ups in"}</T> {org.name}.
            </p>
          </div>
          <label className="v1-period">
            <CalendarDays size={16} />
            <T>{"Period"}</T>{" "}
            <input
              type="month"
              aria-label="Dashboard period"
              value={period}
              onChange={(e) => {
                if (e.target.value) setPeriod(e.target.value);
              }}
            />
          </label>
        </div>
        {admin && <Onboarding />}
        <div className="metrics">
          {metrics.map(([label, value, sub, Icon]: any, i) => (
            <div className="metric" key={label}>
              <div className="metric-label">
                {label}
                <Icon size={18} />
              </div>
              <strong>{value}</strong>
              <small>
                <span className={i === 3 ? "orange" : "green-text"}>
                  {i === 3 ? "Review" : "●"}
                </span>{" "}
                {sub}
              </small>
            </div>
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="panel revenue">
            <div className="panel-title">
              <div>
                <h2>
                  {admin ? "Receipts overview" : "Your training schedule"}
                </h2>
                <p>
                  {admin
                    ? "Verified payments for the selected period."
                    : "View training sessions and prepare for the next activity."}
                </p>
              </div>
              <span className="tag">{periodLabel}</span>
            </div>
            {admin ? (
              <>
                <div className="chart-heading">
                  <strong>{money(gross)}</strong>
                  <span className="legend">
                    <i />
                    <T>{"Member dues"}</T>
                  </span>
                </div>
                {Chart()}
              </>
            ) : (
              ScheduleList()
            )}
          </div>
          <div className="panel">
            <div className="panel-title">
              <h2>
                <T>{"Upcoming sessions"}</T>
              </h2>
              <button
                className="text-btn"
                onClick={() =>
                  go(role === "Administrator" ? "Clubs" : "Schedule")
                }
              >
                <T>{"View all "}</T>
                <ArrowUpRight size={15} />
              </button>
            </div>
            {ScheduleList()}
          </div>
          <div className="panel recent">
            <div className="panel-title">
              <div>
                <h2>{admin ? "Transaksi terbaru" : "Club announcements"}</h2>
                <p>
                  {admin
                    ? "Verified transfer history and administrative corrections."
                    : "Latest updates from your administrators."}
                </p>
              </div>
              <button
                className="text-btn"
                onClick={() => go(admin ? "Payments" : "Announcements")}
              >
                <T>{"View all "}</T>
                <ArrowUpRight size={15} />
              </button>
            </div>
            {admin ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <T>{"Member"}</T>
                    </TableHead>
                    <TableHead>
                      <T>{"Amount"}</T>
                    </TableHead>
                    <TableHead>
                      <T>{"Method"}</T>
                    </TableHead>
                    <TableHead>
                      <T>{"Status"}</T>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scope("Payments")
                    .slice(0, 5)
                    .map((r, i) => (
                      <TableRow
                        key={r.id}
                        onClick={() =>
                          open({ type: "detail", module: "Payments", row: r })
                        }
                        className="clickable"
                      >
                        <TableCell>
                          <div className="identity">
                            <span className={"avatar a" + (i % 4)}>
                              {initials(r.name)}
                            </span>
                            <div>
                              <strong>{r.name}</strong>
                              <small>{r.id}</small>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <b>{money(r.amount)}</b>
                        </TableCell>
                        <TableCell>{r.method}</TableCell>
                        <TableCell>
                          <Badge value={r.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              scope("Announcements").map((a) => (
                <div className="announcement" key={a.id}>
                  <Badge value={a.status} />
                  <h3>{a.name}</h3>
                  <p>{a.description}</p>
                </div>
              ))
            )}
          </div>
          <div className="right-stack">
            <div className="quick-panel">
              <span className="eyebrow">
                <T>{"LEBIH RAPI. LEBIH SIAP."}</T>
              </span>
              <h2>
                <T>{"Start with one small action."}</T>
              </h2>
              <div className="quick-grid">
                {(admin
                  ? [
                      ["Add member", "Members", Users],
                      ["Create invoice", "Invoices", FileText],
                      ["Schedule training", "Schedule", CalendarDays],
                      ["Catat absensi", "Attendance", ClipboardCheck],
                    ]
                  : [
                      ["My schedule", "Schedule", CalendarDays],
                      ["Attendance", "Attendance", ClipboardCheck],
                    ]
                ).map(([label, m, Icon]: any) => (
                  <button
                    key={label}
                    onClick={() =>
                      role === "Administrator"
                        ? go("Clubs")
                        : m === "Attendance"
                          ? go(m)
                          : admin
                            ? open({ type: "create", module: m })
                            : go(m)
                    }
                  >
                    <Icon size={19} />
                    <span>{label}</span>
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </div>
            <div className="website-callout">
              <Users size={24} />
              <div>
                <h3>
                  {admin
                    ? "The right people. The right access."
                    : "Need help from your administrator?"}
                </h3>
                <p>
                  {admin
                    ? "Invite administrators, coaches and members to work together."
                    : "Send a question through workspace support."}
                </p>
                <button
                  className="text-btn"
                  onClick={() => go(admin ? "Settings" : "Support")}
                >
                  {admin ? "Manage workspace users" : "Buka bantuan"}{" "}
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  function Attendance() {
    const s = sessions.find((s) => s.id === session) || sessions[0];
    const roster = members.filter(
      (m) => m.team === s?.team && m.status === "Active",
    );
    const sessionTeam = teams.find((t) => t.id === s?.team);
    const coach = scope("Coaches").find((c) => c.id === s?.coachId);
    return (
      <>
        <div className="toolbar">
          <CourvixSelect
            aria-label="Choose a session"
            value={s?.id || ""}
            onChange={(e) => {
              setSession(e.target.value);
              setPg(1);
            }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.date} · {s.name}
              </option>
            ))}
          </CourvixSelect>
          <button
            className="btn"
            onClick={() =>
              download(
                scope("Attendance").filter((a) => a.session === s?.id),
                "attendance",
              )
            }
          >
            <Download size={16} />
            <T>{"Export"}</T>
          </button>
        </div>
        <div className="panel">
          <div className="panel-title">
            <h2>{s?.name || "No training sessions yet"}</h2>
            <Badge value="Demo" />
          </div>
          <div className="operation-context">
            <p>
              <b>{sessionTeam?.name || "Choose a session"}</b>
              <T>{"· Coach:"}</T>{" "}
              {coach?.name || sessionTeam?.coach || "Not assigned"}
            </p>
            <p>
              {s?.date} · {s?.time}–{s?.endTime} {org.timezone} · {s?.venue}
            </p>
            <div className="session-summary">
              {["Present", "Late", "Absent", "Excused"].map((status) => (
                <span key={status}>
                  {status}:{" "}
                  {
                    scope("Attendance").filter(
                      (a) => a.session === s?.id && a.status === status,
                    ).length
                  }
                </span>
              ))}
              <span>
                <T>{"Not recorded:"}</T>{" "}
                {
                  roster.filter(
                    (m) =>
                      !scope("Attendance").some(
                        (a) => a.session === s?.id && a.member === m.id,
                      ),
                  ).length
                }
              </span>
            </div>
          </div>
          {role === "Member" ? (
            <div className="empty">
              <ClipboardCheck />
              <h3>
                <T>{"My attendance history"}</T>
              </h3>
              {scope("Attendance").map((a) => (
                <p key={a.id}>
                  {db.records.Schedule.find((s) => s.id === a.session)?.name} ·{" "}
                  {a.status}
                </p>
              ))}
              <p>
                <T>{"The coach records attendance during the session."}</T>
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <T>{"Member"}</T>
                    </TableHead>
                    <TableHead>
                      <T>{"Attendance status"}</T>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.slice((pg - 1) * 15, pg * 15).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="identity">
                          <span className="avatar">{initials(m.name)}</span>
                          <strong>{m.name}</strong>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="attendance-actions">
                          {["Present", "Late", "Absent", "Excused"].map(
                            (status) => (
                              <button
                                disabled={busy || s?.status === "Cancelled"}
                                className={
                                  "btn small " +
                                  (db.records.Attendance.find(
                                    (a) =>
                                      a.member === m.id && a.session === s.id,
                                  )?.status === status
                                    ? "primary"
                                    : "")
                                }
                                key={status}
                                onClick={() =>
                                  mutate(
                                    (d) => {
                                      const a = d.records.Attendance.find(
                                        (a) =>
                                          a.member === m.id &&
                                          a.session === s.id,
                                      );
                                      if (a) {
                                        a.status = status;
                                        a.recordedAt = new Date().toISOString();
                                        a.recordedBy = identity?.name;
                                      } else
                                        d.records.Attendance.push({
                                          id: crypto.randomUUID(),
                                          club,
                                          member: m.id,
                                          session: s.id,
                                          team: s.team,
                                          coachId: s.coachId,
                                          recordedAt: new Date().toISOString(),
                                          recordedBy: identity?.name,
                                          name: m.name,
                                          status,
                                          date: s.date,
                                        });
                                      return d;
                                    },
                                    "Kehadiran " + m.name + " saved",
                                  )
                                }
                              >
                                {t(status)}
                              </button>
                            ),
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="tablefoot">
                <span>
                  {roster.length}
                  <T>{"participants · page "}</T>
                  {pg}
                </span>
                <div className="actions">
                  <button
                    className="btn small"
                    disabled={pg === 1}
                    onClick={() => setPg(pg - 1)}
                  >
                    <T>{"Previous"}</T>
                  </button>
                  <button
                    className="btn small"
                    disabled={pg * 15 >= roster.length}
                    onClick={() => setPg(pg + 1)}
                  >
                    <T>{"Next"}</T>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </>
    );
  }
  function Finance() {
    return (
      <>
        <label className="v1-period">
          <T>{"Report period"}</T>{" "}
          <input
            aria-label="Reporting month"
            type="month"
            value={period}
            onChange={(e) => {
              if (e.target.value) setPeriod(e.target.value);
            }}
          />
        </label>
        <div className="metrics">
          {[
            ["Dues collected", gross],
            ["Per-dues platform fee", 0],
            ["Expenses", expenses],
            ["Net cash flow", netRevenue - expenses],
          ].map(([k, v]) => (
            <div className="metric" key={k}>
              <div className="metric-label">{t(String(k))}</div>
              <strong>{money(Number(v))}</strong>
              <small>{periodLabel}</small>
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title">
            <h2>
              <T>{"Cash flow overview"}</T>
            </h2>
            <div className="actions">
              <button
                className="btn"
                onClick={() =>
                  download(
                    scope("Payments").filter((p) => p.date?.startsWith(period)),
                    "financial-report-" + period,
                  )
                }
              >
                <Download size={16} />
                <T>{"Export"}</T>
              </button>
              {page === "Finance" && (
                <button
                  className="btn primary"
                  onClick={() => open({ type: "create", module: "Expenses" })}
                >
                  <Plus size={16} />
                  <T>{"Expenses"}</T>
                </button>
              )}
            </div>
          </div>
          {Chart()}
          <div className="breakdown padded">
            {scope("Expenses")
              .filter((r) => r.date?.startsWith(period))
              .map((r) => (
                <p key={r.id}>
                  <span>{r.name}</span>
                  <b>{money(r.amount)}</b>
                </p>
              ))}
            <p>
              <span>
                <T>{"Dues received − expenses"}</T>
              </span>
              <b>{money(netRevenue - expenses)}</b>
            </p>
          </div>
        </div>
      </>
    );
  }
  function SettingsPage() {
    return (
      <ClubAccess
        onUpdated={() => refreshWorkspace().catch((e) => setError(e.message))}
      />
    );
  }
  function Onboarding() {
    const steps = [
      [
        "Membership",
        "Set up a membership plan",
        "Set the price and period.",
        db.records.Membership.length > 0,
      ],
      [
        "Teams",
        "Create " + (org.groupLabel || "kelompok").toLowerCase(),
        "Add groups and coaches.",
        db.records.Teams.length > 0 && db.records.Coaches.length > 0,
      ],
      [
        "Members",
        "Add members",
        "Record members or send invitations.",
        db.records.Members.length > 0,
      ],
      [
        "Schedule",
        "Schedule training",
        "Start a session and record attendance.",
        db.records.Schedule.length > 0,
      ],
    ] as const;
    if (steps.every((x) => x[3])) return null;
    return (
      <section className="v1-onboarding">
        <span className="eyebrow">
          <T>{"LANGKAH PERTAMA"}</T>
        </span>
        <h2>
          <T>{"Siapkan "}</T>
          {org.name}
          <T>{"for your first training session."}</T>
        </h2>
        <p>
          <T>
            {
              "Your new workspace starts empty. Complete setup, then invite your team through Settings."
            }
          </T>
        </p>
        <div className="v1-onboarding-steps">
          {steps.map(([module, title, description, done], i) => (
            <button
              key={module}
              className={done ? "completed" : ""}
              onClick={() => go(module)}
            >
              <b>{done ? "✓ COMPLETE" : "0" + (i + 1)}</b>
              <strong>{t(title)}</strong>
              <small>{t(description)}</small>
            </button>
          ))}
        </div>
        <button
          className="text-btn"
          style={{ marginTop: 16 }}
          onClick={() => go("Settings")}
        >
          <T>{"Set bank details & invite users →"}</T>
        </button>
      </section>
    );
  }
  function Website() {
    const site = db.websites[club];
    return (
      <div className="settings-grid">
        <div className="panel padded">
          <h2>
            <T>{"Club website editor"}</T>
          </h2>
          <p className="hint">
            <T>
              {"Edit content and preview it. A public domain is not connected."}
            </T>
          </p>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              mutate((d) => {
                d.websites[club] = {
                  title: String(f.title),
                  headline: String(f.headline),
                  about: String(f.about),
                };
                return d;
              }, "Website content saved");
            }}
          >
            {Object.entries(site).map(([k, v]) => (
              <label key={k}>
                {k}
                <input name={k} defaultValue={v} required />
              </label>
            ))}
            <button className="btn primary" disabled={busy}>
              <T>{"Save content"}</T>
            </button>
          </form>
        </div>
        <div className="club-preview">
          <Badge value="Demo preview" />
          <p className="eyebrow">{site.title}</p>
          <h2>{site.headline}</h2>
          <p>{site.about}</p>
          <button
            className="btn primary"
            onClick={() => open({ type: "create", module: "Projects" })}
          >
            <T>{"Konsultasi website "}</T>
            <ArrowUpRight size={16} />
          </button>
          <span className="preview-footer">
            <T>{org.sport || ""}</T> · {org.country || "ID"}
          </span>
        </div>
      </div>
    );
  }
  async function paymentAction(action: string, form: HTMLFormElement) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await request("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          id: modal.row.id,
          revision: revision.current,
          ...Object.fromEntries(new FormData(form)),
        }),
      });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setDb(d.data);
      revision.current = d.revision;
      setModal({
        ...modal,
        row: d.data.records.Invoices.find((i: Row) => i.id === modal.row.id),
      });
      toast.success("Payment status updated.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function Payment() {
    const r = modal.row;
    return (
      <>
        <div className="invoice-total">
          <small>
            <T>{"CLUB DUES INVOICE"}</T>
          </small>
          <h2>{money(r.amount)}</h2>
          <Badge value={r.status} />
        </div>
        <div className="breakdown">
          {[
            ["Member", r.name],
            ["Period", r.period],
            ["Due date", r.due],
            ["Method", "Transfer bank"],
            ["Fee per iuran", "Rp0"],
            ["Referensi", r.reference || "Not submitted"],
            ["Diverifikasi oleh", r.verifiedBy || "—"],
          ].map(([k, v]) => (
            <p key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </p>
          ))}
        </div>
        {r.reviewNote && (
          <p className="hint">
            <T>{"Admin notes: "}</T>
            {r.reviewNote}
          </p>
        )}
        {r.correctionNote && (
          <p className="hint">
            <T>{"Koreksi: "}</T>
            {r.correctionNote}
          </p>
        )}
        {["Pending", "Rejected", "Expired"].includes(r.status) && (
          <>
            <div className="bank-card">
              <strong>
                {org.bank_name || "Receiving bank details are not configured"}
              </strong>
              <b>{org.bank_account || "—"}</b>
              <span>
                <T>{"a.n. "}</T>
                {org.bank_holder || "—"}
              </span>
            </div>
            <p className="hint">
              <T>
                {
                  "Transfer the exact amount to the workspace bank account. Submitting does not mark it as paid; an administrator checks the transfer first."
                }
              </T>
            </p>
            <form
              className="v1-payment-form"
              onSubmit={(e) => {
                e.preventDefault();
                void paymentAction("submit", e.currentTarget);
              }}
            >
              <label>
                <T>{"Transfer reference"}</T>
                <input
                  name="reference"
                  required
                  minLength={4}
                  maxLength={150}
                  placeholder="Reference from your banking app"
                />
              </label>
              <label>
                <T>{"Sender name / notes"}</T>
                <textarea name="note" maxLength={1000} />
              </label>
              <button
                className="btn primary"
                disabled={busy || readOnly || !org.bank_account}
              >
                <T>{"Submit payment for review"}</T>
              </button>
            </form>
          </>
        )}
        {r.status === "Review" && (
          <>
            <p className="hint">
              <T>{"Awaiting administrator review. Reference: "}</T>
              {r.reference}. {r.paymentNote}
            </p>
            {admin && (
              <form
                className="v1-payment-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void paymentAction("approve", e.currentTarget);
                }}
              >
                <label>
                  <T>{"Review notes"}</T>
                  <input name="note" maxLength={1000} />
                </label>
                <p>
                  <T>
                    {
                      "Confirm the money has arrived in your bank account before approving."
                    }
                  </T>
                </p>
                <div className="actions">
                  <button className="btn primary" disabled={busy || readOnly}>
                    <T>{"Verify as paid"}</T>
                  </button>
                  <button
                    className="btn"
                    type="button"
                    disabled={busy || readOnly}
                    onClick={(e) => {
                      const form = e.currentTarget.closest("form")!;
                      void paymentAction("reject", form);
                    }}
                  >
                    <T>{"Reject submission"}</T>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
        {r.status === "Paid" && (
          <>
            <p className="access-success">
              <T>{"Payment verified on"}</T>{" "}
              {new Date(r.verifiedAt || r.paymentDate).toLocaleString(locale)}.
            </p>
            {admin && (
              <details>
                <summary>
                  <T>{"Correct a payment record"}</T>
                </summary>
                <p className="hint">
                  <T>
                    {
                      "This does not transfer or refund money. The original history is kept and a correction entry is added."
                    }
                  </T>
                </p>
                <form
                  className="v1-payment-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void paymentAction("reverse", e.currentTarget);
                  }}
                >
                  <label>
                    <T>{"Correction reason"}</T>
                    <textarea name="note" required minLength={10} />
                  </label>
                  <button className="btn danger" disabled={busy || readOnly}>
                    <T>{"Record correction & reopen invoice"}</T>
                  </button>
                </form>
              </details>
            )}
          </>
        )}
      </>
    );
  }
  if (!ready || !identity)
    return (
      <main className="access-main" style={{ minHeight: "100vh" }}>
        <h1>
          <T>{"Courvix"}</T>
        </h1>
        <p role={loadError ? "alert" : "status"}>
          {loadError || "Checking workspace access…"}
        </p>
        {loadError && (
          <>
            <button className="btn" onClick={() => location.reload()}>
              <T>{"Try again"}</T>
            </button>
            <a href="/login">
              <T>{"Back to sign in"}</T>
            </a>
          </>
        )}
      </main>
    );
  if (org.workspace_type === "Trainer")
    return (
      <PersonalTraining
        key={club}
        demo={demo}
        demoToday={demoToday}
        initialPage={page}
        onSwitch={switchWorkspace}
        onExit={onDemoExit}
      />
    );
  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={3000} />
      {surface === "landing" ? (
        <Landing
          enter={(r = "Admin", p = "Dashboard") => {
            setRole(r);
            go(p);
            setSurface("app");
            location.hash = "app";
          }}
          contact={() => open({ type: "create", module: "Projects" })}
          legal={() => open({ type: "legal" })}
        />
      ) : (
        <SidebarProvider>
          <Sidebar
            className="courvix-sidebar"
            side={locale === "ar" ? "right" : "left"}
          >
            <SidebarHeader>
              <button
                className="brand-button"
                onClick={() => {
                  go("Dashboard");
                }}
              >
                <Brand />
              </button>
              <div className="club-switch">
                <span className="club-icon">{org.short}</span>
                <div>
                  <strong>
                    {role === "Administrator" ? "Courvix · Platform" : org.name}
                  </strong>
                  <small>
                    <T>{"Workspace"}</T>{" "}
                    <span>{org.status === "Trial" ? "TRIAL" : "V1"}</span>
                  </small>
                </div>
              </div>
              <WorkspaceSwitcher
                club={club}
                onSwitch={switchWorkspace}
                isOwner={!!identity.isOwner}
                onNetwork={() => go("Network")}
              />
            </SidebarHeader>
            <SidebarContent>
              <span className="nav-label">
                <T>{"WORKSPACE"}</T>
              </span>
              <SidebarMenu>
                {roleNav[role].filter(item=>!identity||canFeature(identity,item)).map((item, i) => {
                  const Icon = icons[item];
                  return (
                    <SidebarMenuItem key={item}>
                      {[8, 15].includes(i) && (
                        <span className="nav-label">
                          {i === 8 ? "BUSINESS" : "CLUB SETTINGS"}
                        </span>
                      )}
                      <SidebarMenuButton
                        onClick={() => go(item)}
                        isActive={page === item}
                        className="nav-item"
                      >
                        <Icon size={18} />
                        <span>
                          {item === "Teams"
                            ? t(
                                org.groupLabel ||
                                  (org.workspace_type === "Trainer"
                                    ? "Kelas"
                                    : "Kelompok"),
                              )
                            : t(labels[item] || item)}
                        </span>
                        {item === "Invoices" && (
                          <span className="nav-count">
                            {outstanding.length}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <button
                className="workspace-account-button"
                onClick={() => go("Profile")}
              >
                <Avatar
                  name={account?.profile?.display_name || identity.name}
                  url={account?.avatarUrl}
                />
                <span>
                  <strong>
                    {account?.profile?.display_name || identity.name}
                  </strong>
                  <small>{t("My profile")}</small>
                </span>
                <ChevronRight size={15} />
              </button>
              <div className="session-identity">
                <strong>{identity?.name}</strong>
                <small>
                  {identity.isOwner ? "Club owner" : role} · {org.short}
                </small>
              </div>
              <button
                className="user-profile"
                onClick={logout}
                aria-label="Sign out"
              >
                <span className="avatar user">{initials(identity.name)}</span>
                <span>
                  <strong>
                    <T>{"Sign out"}</T>
                  </strong>
                  <small>
                    {role === "Admin" ? "Club administrator" : role}
                  </small>
                </span>
                <LogOut size={17} />
              </button>
            </SidebarFooter>
          </Sidebar>
          <main className="workspace">
            <header className="topbar">
              <div className="breadcrumb">
                <SidebarTrigger />
                <span>
                  <T>{"Workspace"}</T>
                </span>
                <ChevronRight size={14} />
                <b>{t(labels[page] || page)}</b>
              </div>
              <div className="topbar-actions">
                <button
                  className="top-search"
                  onClick={() => open({ type: "search" })}
                >
                  <Search size={17} />
                  <span>
                    <T>{"Search this workspace…"}</T>
                  </span>
                  <kbd>⌕</kbd>
                </button>
                <span className="demo-pill">
                  <T>{"Courvix 1.0"}</T>
                </span>
                <button
                  className="icon-btn notification"
                  aria-label="Workspace update summary"
                  aria-expanded={notice}
                  aria-controls="workspace-update-summary"
                  onClick={() => setNotice(!notice)}
                >
                  <Bell size={19} />
                  {(outstanding.length > 0 || sessions.some(s => s.date >= today && s.status !== "Cancelled")) && <i aria-hidden="true"/>}
                </button>
                <PreferenceControls />
                <button
                  className="profile-avatar-button"
                  onClick={() => go("Profile")}
                  aria-label={t("My profile")}
                >
                  <Avatar
                    name={account?.profile?.display_name || identity.name}
                    url={account?.avatarUrl}
                    size="tiny"
                  />
                </button>
              </div>
            </header>
            {notice && (
              <div className="notification-panel" id="workspace-update-summary" role="region" aria-label="In-app update summary">
                <h3>
                  <T>{"In-app updates"}</T>
                </h3>
                <p>
                  {outstanding.length}
                  <T>{"invoices awaiting payment."}</T>
                </p>
                <p>
                  {
                    sessions.filter(
                      (s) => s.date >= today && s.status !== "Cancelled",
                    ).length
                  }{" "}
                  <T>{"upcoming sessions available."}</T>
                </p>
                <p className="hint">Summary of loaded workspace records. Browser/phone push is not enabled in V1.</p>
                <button
                  className="text-btn"
                  onClick={() => {
                    setNotice(false);
                    go(
                      role === "Administrator" ? "Audit logs" : "Announcements",
                    );
                  }}
                >
                  <T>{"Lihat pengumuman "}</T>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
            <div className="workspace-body">
              {!ready ? (
                <div className="loading">
                  <T>{"Preparing your workspace…"}</T>
                </div>
              ) : (
                <>
                  {page !== "Dashboard" && (
                    <div className="page-heading">
                      <div>
                        <p className="eyebrow">{org.name.toUpperCase()}</p>
                        <h1>
                          {t(labels[page] || page)}
                          <span className="orange">.</span>
                        </h1>
                        <p>
                          <T>{"Manage your workspace in one place."}</T>
                        </p>
                      </div>
                      <span className="tag">{periodLabel}</span>
                    </div>
                  )}
                  {error && !modal && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}
                  {role === "Admin" && page === "Members" && (
                    <div className="onboard-links">
                      <button className="btn" onClick={() => go("Settings")}>
                        <T>{"Invite members / coaches"}</T>
                      </button>
                      <span className="hint">
                        <T>
                          {
                            "Add manually to record a profile; invite to grant sign-in access."
                          }
                        </T>
                      </span>
                    </div>
                  )}
                  {role === "Administrator" && page === "Clubs" && (
                    <div className="onboard-links">
                      <a href="/create-workspace">
                        <T>{"Simulate workspace registration ↗"}</T>
                      </a>
                      <p className="hint">
                        <T>
                          {
                            "The club creates a workspace, selects a plan and starts a trial. The platform owner monitors workspaces and subscriptions."
                          }
                        </T>
                      </p>
                    </div>
                  )}
                  {readOnly && (
                    <div className="v1-banner">
                      <p>
                        <strong>
                          <T>{"Read-only · Subscription expired"}</T>
                        </strong>
                        <T>
                          {
                            "Your records remain available for reading and export. The owner can request renewal through Settings."
                          }
                        </T>
                      </p>
                      <ExportLink>
                        <T>{"Export data"}</T>
                      </ExportLink>
                    </div>
                  )}
                  <ModuleIntro page={page} />
                  {page === "Network" && identity.isOwner ? (
                    <OrganizationHub
                      onSwitch={switchWorkspace}
                      demo={demo}
                      product="Club"
                    />
                  ) : page === "ControlRoom" &&
                    ["Admin", "Coach"].includes(role) ? (
                    <ClubControlRoom
                      key={club}
                      data={db}
                      identity={identity!}
                      today={
                        demoToday ||
                        new Date().toLocaleDateString("sv-SE", {
                          timeZone: org.timezone || "Asia/Jakarta",
                        })
                      }
                      name={org.name}
                      currency={org.currency || "IDR"}
                      onRefresh={refreshWorkspace}
                      onNavigate={go}
                      onOpen={(module, row, edit) =>
                        open({
                          type:
                            module === "Invoices"
                              ? "payment"
                              : edit
                                ? "create"
                                : "detail",
                          module,
                          row,
                          edit: edit ? row : undefined,
                          origin: "ControlRoom",
                        })
                      }
                    />
                  ) : page === "Profile" ? (
                    <>
                      <AccountProfile
                        demo={demo}
                        onUpdated={refreshWorkspace}
                      />
                      {["Coach", "Member"].includes(role) && (
                        <div className="panel" style={{ marginTop: 24 }}>
                          <h2>
                            {t(
                              role === "Coach"
                                ? "Coaching profile"
                                : "Athlete profile",
                            )}
                          </h2>
                          {(() => {
                            const kind =
                              role === "Coach" ? "Coaches" : "Members";
                            const person = db.records[kind].find(
                              (r) =>
                                r.id ===
                                (role === "Coach"
                                  ? identity?.coach
                                  : identity?.member),
                            );
                            return person ? (
                              <PersonProfile
                                kind={kind}
                                person={person}
                                onUpdated={refreshWorkspace}
                              />
                            ) : (
                              <div className="empty">
                                <T>
                                  {
                                    "Your profile is not linked yet. Contact your administrator."
                                  }
                                </T>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  ) : page === "Dashboard" ? (
                    Dashboard()
                  ) : page === "Teams" ? (
                    <TeamsView
                      teams={teams}
                      members={members}
                      canEdit={admin && canFeature(identity, page,true)}
                      create={() => open({ type: "create", module: "Teams" })}
                      open={(row) =>
                        open({ type: "detail", row, module: "Teams" })
                      }
                    />
                  ) : page === "Schedule" ? (
                    <CalendarView
                      timezone={org.timezone}
                      todayOverride={demoToday}
                      sessions={sessions}
                      canEdit={admin && canFeature(identity, page,true)}
                      create={() =>
                        open({ type: "create", module: "Schedule" })
                      }
                      open={(row) =>
                        open({ type: "detail", row, module: "Schedule" })
                      }
                    />
                  ) : page === "Attendance" ? (
                    Attendance()
                  ) : page === "Finance" || page === "Reports" ? (
                    Finance()
                  ) : page === "Reminders" ? (
                    <Reminders
                      demo={demo}
                      onInvoice={(id) => {
                        const row = db.records.Invoices.find(
                          (r) => r.id === id,
                        );
                        if (row) open({ type: "payment", row });
                      }}
                    />
                  ) : page === "Settings" ? (
                    SettingsPage()
                  ) : page === "Website" ? (
                    Website()
                  ) : page === "Clubs" ? (
                    <div className="team-grid">
                      {organizations.map((c: any) => (
                        <div className="panel padded" key={c.id}>
                          <span className="club-icon">{c.short}</span>
                          <h2>{c.name}</h2>
                          <p>
                            <T>{c.sport || ""}</T> · {c.country || "ID"}
                          </p>
                          <p>
                            {
                              db.records.Members.filter((m) => m.club === c.id)
                                .length
                            }{" "}
                            <T>{"members"}</T>
                          </p>
                          <button
                            className="btn"
                            onClick={() => {
                              open({ type: "club-info", clubInfo: c });
                            }}
                          >
                            <T>{"Workspace details "}</T>
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    List()
                  )}
                  <div className="workspace-footer">
                    <span>
                      <T>{"Courvix · Built for the people behind the game."}</T>
                    </span>
                    <span>
                      {storage === "cloud"
                        ? "Shared workspace records · Stored on the server"
                        : "Menghubungkan penyimpanan…"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </main>
          <nav className="mobile-nav" aria-label="Mobile main navigation">
            {roleNav[role].filter(item=>!identity||canFeature(identity,item))
              .filter((p) =>
                ["Dashboard", "Members", "Schedule", "Payments"].includes(p),
              )
              .map((p) => {
                const Icon = icons[p];
                return (
                  <button
                    key={p}
                    className={page === p ? "active" : ""}
                    onClick={() => go(p)}
                  >
                    <Icon size={19} />
                    <span>
                      {p === "Dashboard" ? "Beranda" : labels[p] || p}
                    </span>
                  </button>
                );
              })}
            <div>
              <SidebarTrigger />
              <span>
                <T>{"More"}</T>
              </span>
            </div>
          </nav>
        </SidebarProvider>
      )}
      <Dialog
        open={!!modal}
        onOpenChange={(v) => {
          if (!v) closeDialog();
        }}
      >
        <DialogContent
          className="courvix-modal"
          onChangeCapture={(e) => {
            if (
              modal?.type === "create" &&
              (e.target as HTMLElement).closest("form")
            )
              setFormDirty(true);
          }}
        >
          <DialogTitle>
            {modal?.type === "create"
              ? (modal.edit ? "Edit " : "Add ") + modal.module
              : modal?.type === "payment"
                ? "Payment details"
                : modal?.type === "search"
                  ? "Search your workspace"
                  : modal?.type === "refund"
                    ? "Correct this payment?"
                    : modal?.type === "reset"
                      ? "Reset all demo records?"
                      : modal?.type === "legal"
                        ? "Privacy & terms"
                        : modal?.type === "onboarding"
                          ? "Welcome to Courvix"
                          : modal?.type === "period"
                            ? "Report period"
                            : modal?.row?.name || "Courvix"}
          </DialogTitle>
          <DialogDescription>
            <T>
              {
                "Courvix · Shared records with role-based access. Dues are transferred directly to your club."
              }
            </T>
          </DialogDescription>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {modal?.type === "create" && (
            <form className="form" onSubmit={submit}>
              {fields(modal.module).map(([name, label, type]) => (
                <label key={name}>
                  {t(label)}
                  {!["evaluation", "result"].includes(name) && (
                    <span className="orange"> *</span>
                  )}
                  {type === "sport" ? (
                    <SportSelect
                      defaultValue={modal.edit?.[name] || org.sport}
                    />
                  ) : [
                      "specialty",
                      "objective",
                      "category",
                      "expenseCategory",
                    ].includes(type) ? (
                    <>
                      <select
                        name={name}
                        defaultValue={modal.edit?.[name] || ""}
                        required
                      >
                        <option value="">{t("Choose a category")}</option>
                        {modal.edit?.[name] &&
                          !sportOptions(org.sport, type).includes(
                            modal.edit[name],
                          ) && <option>{modal.edit[name]}</option>}
                        {(type === "expenseCategory"
                          ? [
                              "Venue",
                              "Equipment",
                              "Travel",
                              "Coaching",
                              "Administration",
                              "Other",
                            ]
                          : sportOptions(org.sport, type)
                        ).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                      <small className="hint">
                        {t(
                          "Choose from the catalog to keep naming consistent.",
                        )}
                      </small>
                    </>
                  ) : type === "status" ? (
                    <CourvixSelect
                      name="status"
                      defaultValue={modal.edit?.status}
                    >
                      {(modal.module === "Schedule"
                        ? ["Scheduled", "Completed", "Cancelled"]
                        : modal.module === "Competitions"
                          ? [
                              "Registration",
                              "Registered",
                              "Ongoing",
                              "Completed",
                              "Cancelled",
                            ]
                          : modal.module === "Membership"
                            ? ["Active", "Inactive"]
                            : ["Active", "Completed", "Paused"]
                      ).map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </CourvixSelect>
                  ) : type === "textarea" ? (
                    <textarea
                      defaultValue={modal.edit?.[name]}
                      required={!["evaluation", "result"].includes(name)}
                      name={name}
                      maxLength={2000}
                    />
                  ) : [
                      "team",
                      "member",
                      "coach",
                      "session",
                      "membership",
                    ].includes(type) ? (
                    <CourvixSelect
                      defaultValue={modal.edit?.[name]}
                      required={!["evaluation", "result"].includes(name)}
                      name={name}
                    >
                      {(type === "team"
                        ? teams
                        : type === "coach"
                          ? scope("Coaches")
                          : type === "session"
                            ? sessions
                            : type === "membership"
                              ? scope("Membership")
                              : members
                      ).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </CourvixSelect>
                  ) : (
                    <input
                      defaultValue={modal.edit?.[name]}
                      required={!["evaluation", "result"].includes(name)}
                      name={name}
                      type={type || (name === "email" ? "email" : "text")}
                      min={
                        type === "number"
                          ? name === "amount"
                            ? 1 / 10 ** currencyDigits(org.currency || "IDR")
                            : 1
                          : undefined
                      }
                      step={
                        type === "number" && name === "amount"
                          ? 1 / 10 ** currencyDigits(org.currency || "IDR")
                          : undefined
                      }
                      maxLength={200}
                    />
                  )}
                </label>
              ))}
              <button disabled={busy} className="btn primary">
                {busy ? "Saving…" : "Save " + modal.module}
              </button>
            </form>
          )}
          {modal?.type === "payment" && Payment()}
          {modal?.type === "create" && formDirty && (
            <div className="draft-status">
              <span />
              Unsaved changes · Submit the form to save.
            </div>
          )}
          {discardDraft && (
            <div className="draft-discard" role="alert">
              <strong>Keep your changes?</strong>
              <p>Continue editing, or discard this unsaved draft.</p>
              <div className="actions">
                <button
                  className="btn primary"
                  onClick={() => setDiscardDraft(false)}
                >
                  Keep editing
                </button>
                <button
                  className="btn danger"
                  onClick={() => {
                    setFormDirty(false);
                    setDiscardDraft(false);
                    setModal(null);
                  }}
                >
                  Discard changes
                </button>
              </div>
            </div>
          )}
          {modal?.type === "period" && (
            <p>
              <T>
                {
                  "Choose the reporting month. Use exports to review transaction dates and details. Reports use the workspace’s recorded activity."
                }
              </T>
            </p>
          )}
          {modal?.type === "club-info" && (
            <div className="breakdown">
              <h2>{modal.clubInfo.name}</h2>
              <p>
                <T>{"Olahraga "}</T>
                <b>
                  <T>{modal.clubInfo.sport || ""}</T>
                </b>
              </p>
              <p>
                <T>{"Subscription"}</T>{" "}
                <b>
                  {modal.clubInfo.status} · {modal.clubInfo.plan}
                </b>
              </p>
              <p>
                <T>
                  {
                    "Club administrators manage the workspace through their own accounts."
                  }
                </T>
              </p>
            </div>
          )}
          {modal?.type === "detail" && (
            <>
              <div className="record-detail-toolbar">
                <span className="tag">{t(modal.module)}</span>
                {admin &&
                  [
                    "Members",
                    "Teams",
                    "Coaches",
                    "Schedule",
                    "Training",
                    "Competitions",
                    "Membership",
                    "Announcements",
                    "Documents",
                    "Projects",
                  ].includes(modal.module) && (
                    <button
                      className="btn primary"
                      onClick={() =>
                        open({
                          type: "create",
                          module: modal.module,
                          edit: modal.row,
                          origin: modal.origin,
                        })
                      }
                    >
                      <T>{"Edit details"}</T>
                    </button>
                  )}
              </div>
              {modal.module === "Payments" ? (
                <TransactionDetails
                  row={modal.row}
                  currency={org.currency || "IDR"}
                />
              ) : [
                  "Teams",
                  "Schedule",
                  "Training",
                  "Competitions",
                  "Membership",
                ].includes(modal.module) ? (
                <OperationDetails
                  module={modal.module}
                  row={modal.row}
                  db={db}
                  busy={busy}
                  canEdit={admin && canFeature(identity, page,true)}
                  onOpen={(module, row) =>
                    open({ type: "detail", module, row })
                  }
                  onAttendance={(id) => {
                    setSession(id);
                    setModal(null);
                    go("Attendance");
                  }}
                  onGenerate={(period, due) =>
                    mutate((d) => {
                      if (modal.row.status !== "Active")
                        throw Error(
                          "Activate this plan before issuing invoices.",
                        );
                      let count = 0;
                      for (const m of d.records.Members.filter(
                        (m) =>
                          m.club === club &&
                          m.membership === modal.row.id &&
                          m.status === "Active",
                      )) {
                        if (
                          d.records.Invoices.some(
                            (i) =>
                              i.member === m.id &&
                              i.period === period &&
                              i.status !== "Cancelled",
                          )
                        )
                          continue;
                        if (
                          renewalChoices.some(
                            (c) =>
                              c.member === m.id &&
                              c.decision === "Stop" &&
                              period > c.period,
                          )
                        )
                          continue;
                        d.records.Invoices.push({
                          id: crypto.randomUUID(),
                          club,
                          member: m.id,
                          name: m.name,
                          amount: modal.row.amount,
                          membership: modal.row.id,
                          period,
                          due,
                          description: modal.row.name + " · " + period,
                          status: "Pending",
                          fee: 0,
                          gateway: 0,
                          date: new Date().toISOString().slice(0, 10),
                        });
                        count++;
                      }
                      if (!count)
                        throw Error(
                          "No new invoices: already issued or the member declined renewal.",
                        );
                      return d;
                    }, "Invoice membership diterbitkan")
                  }
                />
              ) : modal.module === "Members" ? (
                <MemberDetails
                  currency={org.currency || "IDR"}
                  member={{
                    ...modal.row,
                    membershipName: db.records.Membership.find(
                      (p) => p.id === modal.row.membership,
                    )?.name,
                  }}
                  team={teams.find((t) => t.id === modal.row.team)}
                  attendance={scope("Attendance").filter(
                    (a) => a.member === modal.row.id,
                  )}
                  invoices={invoices.filter((i) => i.member === modal.row.id)}
                  audit={scope("Audit logs")}
                  financial={admin}
                />
              ) : (
                <div className="breakdown">
                  {Object.entries(modal.row)
                    .filter(
                      ([k]) =>
                        !["club", "id"].includes(k) &&
                        (role !== "Coach" || !["amount", "email"].includes(k)),
                    )
                    .map(([k, v]) => (
                      <p key={k}>
                        <span>{k}</span>
                        <b>{String(v)}</b>
                      </p>
                    ))}
                </div>
              )}
              {admin && ["Members", "Coaches"].includes(modal.module) && (
                <PersonProfile
                  kind={modal.module}
                  person={modal.row}
                  onUpdated={refreshWorkspace}
                />
              )}
              {modal.module === "Members" && admin && (
                <button
                  className="btn"
                  disabled={busy}
                  onClick={() =>
                    mutate((d) => {
                      const m = d.records.Members.find(
                        (x) => x.id === modal.row.id,
                      )!;
                      m.status =
                        m.status === "Archived" ? "Active" : "Archived";
                      return d;
                    }, "Member status updated")
                  }
                >
                  {modal.row.status === "Archived" ? "Activate" : "Archive"}{" "}
                  <T>{"members"}</T>
                </button>
              )}
            </>
          )}
          {modal?.type === "search" && (
            <>
              <input
                autoFocus
                aria-label="Search workspace"
                placeholder="Name, group, invoice or schedule…"
                className="global-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="search-results">
                {[
                  "Members",
                  "Coaches",
                  "Teams",
                  "Schedule",
                  "Training",
                  "Membership",
                  "Invoices",
                  "Documents",
                ]
                  .filter((m) => roleNav[role].includes(m))
                  .flatMap((m) =>
                    filtered(m)
                      .slice(0, 4)
                      .map((r) => (
                        <button
                          key={m + r.id}
                          onClick={() => {
                            go(m);
                            open({
                              type: m === "Invoices" ? "payment" : "detail",
                              row: r,
                              module: m,
                            });
                          }}
                        >
                          <span>
                            <b>{r.name}</b>
                            <small>{m}</small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      )),
                  )}
              </div>
            </>
          )}
          {modal?.type === "onboarding" && (
            <div className="onboarding">
              {[
                "Create your club",
                "Choose sports",
                "Create teams",
                "Invite coaches",
                "Import members",
                "Create membership plans",
                "Connect payments",
                "Launch club website",
              ].map((s, i) => (
                <button
                  key={s}
                  onClick={() => {
                    go(
                      [
                        "Settings",
                        "Settings",
                        "Teams",
                        "Coaches",
                        "Members",
                        "Membership",
                        "Settings",
                        "Website",
                      ][i],
                    );
                    setModal(null);
                  }}
                >
                  <span>{i < 6 ? <Check size={16} /> : i + 1}</span>
                  <div>
                    <b>{s}</b>
                    <small>
                      {i < 6
                        ? "Demo configuration ready"
                        : "Production setup required"}
                    </small>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
          {modal?.type === "legal" && (
            <p>
              <T>
                {
                  "Workspace records are stored on the server and shared according to access permissions. Identity document uploads are disabled in V1.0. Read /policies or contact courvix.id@gmail.com."
                }
              </T>
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
