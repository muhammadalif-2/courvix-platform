"use client";
import { useEffect, useState } from "react";
import { Building2, ChevronRight } from "lucide-react";
import { useAppRequest } from "./app-transport";
import { usePreferences } from "./preferences";
export function WorkspaceSwitcher({
  club,
  onSwitch,
  isOwner,
  onNetwork,
  product,
}: {
  club: string;
  onSwitch: (id: string) => Promise<void>;
  isOwner: boolean;
  onNetwork: () => void;
  product?: "Club" | "Trainer";
}) {
  const request = useAppRequest(),
    { t } = usePreferences(),
    [clubs, setClubs] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    request("/api/access")
      .then((r) => r.json())
      .then((v: any) =>
        setClubs(
          (v.clubs || []).filter(
            (c: any) => !product || c.workspace_type === product,
          ),
        ),
      )
      .catch(() => {});
  }, [club]);
  return (
    <>
      <label>
        <span className="sr-only">{t("Choose a branch")}</span>
        <select
          className="workspace-switcher"
          aria-label={t("Choose a branch")}
          value={club}
          disabled={busy}
          onChange={async (e) => {
            setBusy(true);
            setError("");
            try {
              await onSwitch(e.target.value);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {clubs.map((c) => (
            <option value={c.club} key={c.club}>
              {c.name} · {c.role}
            </option>
          ))}
        </select>
      </label>
      {isOwner && (
        <button className="workspace-network-link" onClick={onNetwork}>
          <Building2 size={16} />
          {t("Headquarters")}
          <ChevronRight size={14} />
        </button>
      )}
      {error && <small role="alert">{error}</small>}
    </>
  );
}
