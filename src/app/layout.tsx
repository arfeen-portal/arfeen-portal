import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { LanguageProvider } from "@/context/LanguageContext";
import ShellRouter from "@/components/layout/ShellRouter";
import ThemeStyleSync from "@/components/theme/ThemeStyleSync";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arfeen Travel Portal",
  description: "Umrah Packages, Group Tickets, Hotels, Transport & Visa Services",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900">
        <ThemeStyleSync />

        <LanguageProvider>
          <ShellRouter>{children}</ShellRouter>
        </LanguageProvider>
      </body>
    </html>
  );
}