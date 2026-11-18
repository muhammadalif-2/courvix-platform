import type { Metadata } from "next";
import "./globals.css";
import "./dashboard-theme.css";
import "./market-growth.css";
import "./onboarding.css";
import "./access.css";
import "./experience-system.css";
import "./workspace-guidance.css";
import "./home-stories.css";
import { PreferencesProvider } from "./preferences";

export const metadata: Metadata = {
  title: "Courvix — More coaching. Less chasing.",
  description:
    "Bring your people, schedules and payment records into one clear workspace. Club Management and Personal Training for the way you coach.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/inter-font.css" />
      </head>
      <body className="courvix-ui antialiased" id="courvix-top">
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
