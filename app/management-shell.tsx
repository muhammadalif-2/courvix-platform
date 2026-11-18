"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight, Menu, X, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import { usePreferences, PreferenceControls } from "./preferences";
import { useAppRequest } from "./app-transport";
import WorkspaceCommand, {
  type WorkspaceCommandItem,
} from "./workspace-command";
import { Avatar } from "./account-profile";
import { useModalKeyboard } from "./modal-keyboard";
export function ManagementShell({
  children,
  title,
  subtitle,
  nav,
  active,
  onNavigate,
  demo = false,
  platform = false,
  productLabel,
  workspaceName,
  roleLabel,
  searchItems = [],
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  nav: { id: string; label: string; icon: any; count?: number }[];
  active: string;
  onNavigate: (s: string) => void;
  demo?: boolean;
  platform?: boolean;
  productLabel?: string;
  workspaceName?: string;
  roleLabel?: string;
  searchItems?: WorkspaceCommandItem[];
}) {
  const { t } = usePreferences(),
    request = useAppRequest(),
    [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false),
    [account, setAccount] = useState<any>(null);
  useEffect(() => {
    const refresh = () =>
      request("/api/account")
        .then((r) => (r.ok ? r.json() : null))
        .then(setAccount)
        .catch(() => {});
    refresh();
    window.addEventListener("courvix-account-updated", refresh);
    return () => window.removeEventListener("courvix-account-updated", refresh);
  }, []);
  useEffect(() => {
    const viewport = window.matchMedia("(max-width: 900px)");
    const sync = () => {
      setMobile(viewport.matches);
      if (!viewport.matches) setOpen(false);
    };
    sync();
    viewport.addEventListener("change", sync);
    return () => viewport.removeEventListener("change", sync);
  }, []);
  useModalKeyboard(open && mobile, () => setOpen(false));
  return (
    <div className="management-shell" data-workspace-role={platform ? "Courvix owner" : roleLabel || "Owner"}>
      <a className="cv-skip" href="#workspace-content">
        Skip to workspace content
      </a>
      <aside
        id="management-navigation"
        className={"management-sidebar " + (open ? "mobile-open" : "")}
        role={mobile && open ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label="Workspace navigation"
        inert={mobile && !open ? true : undefined}
      >
        <a href="/" className="management-brand">
          <BrandLogo />
        </a>
        <div className="management-context">
          <span className="context-orb">{platform ? "C" : "HQ"}</span>
          <div>
            <strong>
              {platform
                ? "Courvix Platform"
                : workspaceName || t("Headquarters")}
            </strong>
            <small>
              {platform
                ? t("Platform controls")
                : productLabel || t("Across all branches")}
            </small>
          </div>
          <button
            className="mobile-nav-close"
            onClick={() => setOpen(false)}
            aria-label={t("Close")}
          >
            <X size={18} />
          </button>
        </div>
        <small className="management-nav-label">
          {platform
            ? "PLATFORM"
            : productLabel
              ? "PERSONAL TRAINING"
              : "ORGANIZATION"}
        </small>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              aria-current={n.id === active ? "page" : undefined}
              className={n.id === active ? "active" : ""}
              onClick={() => {
                onNavigate(n.id);
                setOpen(false);
              }}
            >
              <n.icon size={18} />
              <span>{t(n.label)}</span>
              {!!n.count && <b>{n.count}</b>}
            </button>
          ))}
        </nav>
        <div className="management-sidebar-bottom">
          {!demo&&<a className="management-return" href="/waiting-room">Invitations & workspaces <ArrowUpRight size={15}/></a>}

          <div className="management-safe">
            <span className="online-dot" />
            <span>{demo ? "DEMO · SAMPLE DATA" : "COURVIX WORKSPACE"}</span>
          </div>
          <button
            className={
              active === "profile"
                ? "management-user active"
                : "management-user"
            }
            onClick={() => {
              onNavigate("profile");
              setOpen(false);
            }}
          >
            <Avatar
              name={
                account?.profile?.display_name ||
                account?.user?.name ||
                "Courvix"
              }
              url={account?.avatarUrl}
            />
            <span>
              <strong>
                {account?.profile?.display_name ||
                  account?.user?.name ||
                  t("Account")}
              </strong>
              <small>
                {platform ? t("Courvix owner") : roleLabel || t("Owner")}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
          <a className="management-return" href={demo ? "/demo" : "/dashboard"}>
            {t("Open workspace")}
            <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>
      {open && (
        <button
          className="management-backdrop"
          aria-label={t("Close")}
          onClick={() => setOpen(false)}
        />
      )}
      <main className="management-main">
        <header className="management-topbar">
          <div>
            <button
              className="mobile-nav-open"
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="management-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span>
              {platform
                ? "Courvix Platform"
                : workspaceName || t("Headquarters")}
            </span>
            <ChevronRight size={14} />
            <strong>
              {t(
                nav.find((n) => n.id === active)?.label ||
                  (active === "profile" ? "My profile" : title),
              )}
            </strong>
          </div>
          <div className="management-topbar-tools">
            <WorkspaceCommand
              items={[
                ...nav.map((n) => ({
                  id: "nav:" + n.id,
                  label: n.label,
                  description: "Open this workspace page",
                  group: "Pages",
                  onSelect: () => onNavigate(n.id),
                })),
                ...searchItems,
              ]}
            />
            <PreferenceControls />
          </div>
        </header>
        <div
          className="management-content"
          id="workspace-content"
          tabIndex={-1}
        >
          <div className="management-page-heading">
            <div>
              <span className="eyebrow">
                {platform
                  ? "PLATFORM INTELLIGENCE"
                  : productLabel
                    ? "COURVIX / PERSONAL TRAINING"
                    : "ORGANIZATION WORKSPACE"}
              </span>
              <h1>{t(title)}</h1>
              <p>{t(subtitle)}</p>
            </div>
            <span className="management-edition">
              COURVIX <b>1.0</b>
            </span>
          </div>
          {children}
        </div>
        <footer className="management-footer">
          <BrandLogo compact />
          <span>Courvix · Built for your next level.</span>
        </footer>
      </main>
    </div>
  );
}
