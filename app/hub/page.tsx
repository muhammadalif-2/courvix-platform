"use client";
import { useState } from "react";
import { LayoutDashboard, User } from "lucide-react";
import OrganizationHub from "../organization-hub";
import { ManagementShell } from "../management-shell";
import AccountProfile from "../account-profile";
export default function Hub() {
  const [page, setPage] = useState("hub");
  return (
    <ManagementShell
      title={page === "profile" ? "My profile" : "Headquarters"}
      subtitle="Room for every athlete. Control for every location."
      nav={[
        { id: "hub", label: "Headquarters", icon: LayoutDashboard },
        { id: "profile", label: "My profile", icon: User },
      ]}
      active={page}
      onNavigate={setPage}
    >
      {page === "profile" ? <AccountProfile /> : <OrganizationHub />}
    </ManagementShell>
  );
}
