import Marketing from "../marketing";
import { notFound } from "next/navigation";
const pages: Record<string, string> = {
  platform: "How it works",
  clubs: "Club Management",
  "personal-training": "Personal Training",
  "club-life": "Club Life — Training & Community",
  sports: "Sports",
  pricing: "Pricing",
  custom: "Club websites & systems",
  contact: "Contact",
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return {
    title: `${pages[section] || "Page"} — Courvix`,
    description:
      (
        {
          clubs:
            "Organize members, teams, coaches, attendance and recurring club dues in one workspace.",
          "personal-training":
            "Connect client session packs, verified payments, private appointments and training progress.",
          pricing:
            "Starter and Pro workspace subscriptions, a 14-day initial trial and clear per-location pricing.",
          platform:
            "See how Courvix connects invitations, training, payment records and role-based access.",
          sports:
            "Practical club and personal training operations across 52 sport categories.",
        } as Record<string, string>
      )[section] || "Club Management and Personal Training by Courvix.",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!pages[section]) notFound();
  return <Marketing page={section} />;
}
