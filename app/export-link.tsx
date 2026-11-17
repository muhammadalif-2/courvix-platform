"use client";
import { useState, type ReactNode } from "react";
import { useAppRequest } from "./app-transport";
export function ExportLink({
  children,
  className = "btn",
}: {
  children: ReactNode;
  className?: string;
}) {
  const request = useAppRequest(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <button
        className={className}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await request("/api/export");
            if (!r.ok) throw Error("Unable to create the export.");
            const blob = await r.blob(),
              url = URL.createObjectURL(blob),
              a = document.createElement("a");
            a.href = url;
            a.download = "courvix-export.json";
            a.click();
            URL.revokeObjectURL(url);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Preparing…" : children}
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
