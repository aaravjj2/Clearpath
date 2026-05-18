import type { Metadata } from "next";
import ProviderSettings from "@/components/ProviderSettings";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearPath",
  description: "Understand legal documents in plain English."
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
