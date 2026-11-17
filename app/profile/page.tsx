"use client";
import { useState } from "react";
import { User, LayoutDashboard } from "lucide-react";
import { ManagementShell } from "../management-shell";
import AccountProfile from "../account-profile";
export default function Profile() {
  return (
    <ManagementShell
      title="My profile"
      roleLabel="Account"
      subtitle="A complete profile helps people recognize you and find the right person."
      nav={[{ id: "profile", label: "My profile", icon: User }]}
      active="profile"
      onNavigate={() => {}}
    >
      <AccountProfile />
    </ManagementShell>
  );
}
