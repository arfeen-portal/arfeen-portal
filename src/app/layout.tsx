export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";

import { LanguageProvider } from "@/context/LanguageContext";
import AppSidebar from "@/components/layout/AppSidebar";

export const metadata: Metadata = {
  title: "Arfeen Travel Portal",
  description: "B2B/B2C Umrah & Tourism Portal",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900">
        <LanguageProvider>
          <div className="min-h-screen md:flex">
            <AppSidebar />

            <div className="flex min-h-screen flex-1 flex-col">
              <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="flex h-16 items-center justify-between px-4 md:px-6">
                  <div>
                    <h2 className="text-lg font-semibold">Arfeen Travel Portal</h2>
                    <p className="text-xs text-slate-500">
                      B2B / B2C Umrah, Transport, Accounts & Agent Management
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Admin Panel
                  </div>
                </div>
              </header>

              <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}