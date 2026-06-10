"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Building2,
  ChevronDown,
  Home,
  Hotel,
  LogIn,
  Menu,
  Plane,
  ShieldCheck,
  Ticket,
  X,
  Car,
  Phone,
} from "lucide-react";

import AppSidebar from "@/components/layout/AppSidebar";

type ShellRouterProps = {
  children: ReactNode;
};

const publicNavItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Umrah Packages", href: "/umrah-packages", icon: Building2 },
  { label: "Group Tickets", href: "/umrah/groups", icon: Ticket },
  { label: "Hotels", href: "/hotels", icon: Hotel },
  { label: "Transport", href: "/transport", icon: Car },
  { label: "Visa", href: "/umrah/visa", icon: ShieldCheck },
  { label: "Contact", href: "/contact", icon: Phone },
];

const publicPrefixes = [
  "/",
  "/umrah-packages",
  "/umrah/groups",
  "/hotels",
  "/transport",
  "/umrah/visa",
  "/umrah/ziyarat",
  "/contact",
];

const portalPrefixes = [
  "/admin",
  "/accounts",
  "/agents",
  "/reports",
  "/branding",
  "/system",
  "/ai",
  "/operations",
];

function isPortalPath(pathname: string) {
  return portalPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/login/");
}

function isPublicPath(pathname: string) {
  if (isLoginPath(pathname)) return true;
  if (isPortalPath(pathname)) return false;

  return publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function ShellRouter({ children }: ShellRouterProps) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLoginPath(pathname)) {
    return <>{children}</>;
  }

  if (isPortalPath(pathname)) {
    return (
      <div className="min-h-screen md:flex">
        <AppSidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div>
                <h2 className="text-lg font-semibold">Arfeen Travel Portal</h2>
                <p className="text-xs text-slate-500">
                  Admin, Accounts, Operations & Agent Management
                </p>
              </div>

              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                View Website
              </Link>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-lg font-black text-slate-950 shadow-lg shadow-amber-400/20">
              AT
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                Arfeen Travel
              </p>
              <h1 className="text-lg font-black leading-tight">
                Premium Umrah & Travel Services
              </h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {publicNavItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-amber-400 text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <LogIn size={16} />
              Agent Login
            </Link>

            <Link
              href="/contact"
              className="rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
            >
              Book Now
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-xl border border-white/10 p-2 lg:hidden"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-[#050816] px-5 py-4 lg:hidden">
            <div className="grid gap-2">
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold"
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950"
              >
                <LogIn size={16} />
                Agent Login
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      {children}
    </div>
  );
}