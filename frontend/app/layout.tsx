import type { Metadata } from "next";
import ProviderSettings from "@/components/ProviderSettings";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearPath — Understand What You're Signing",
  description: "Upload any legal document — lease, contract, loan agreement — and get a plain-English breakdown with risk scoring and red-flag detection.",
  keywords: ["legal document", "contract analyzer", "plain English", "risk score", "red flags"],
  openGraph: {
    title: "ClearPath — Understand What You're Signing",
    description: "AI-powered legal document simplifier. Free, instant, no lawyers required.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ProviderSettings />
      </body>
    </html>
  );
}
