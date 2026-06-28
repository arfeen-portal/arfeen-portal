"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Building2,
  Home,
  Hotel,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Ticket,
  UserPlus,
  X,
  Car,
  Phone,
} from "lucide-react";

import AppSidebar from "@/components/layout/AppSidebar";
import { getTenantByHost } from "@/lib/tenantConfig";
import { supabaseClient } from "@/lib/supabaseClient";

type ShellRouterProps = {
  children: ReactNode;
};

const portalPrefixes = [
  "/admin",
  "/accounts",
  "/accountant",
  "/agent",
  "/agents",
  "/reports",
  "/branding",
  "/system",
  "/ai",
  "/operations",
  "/oprations",
  "/dashboard",
  "/dashboard-internal",
  "/driver",
];

function isPortalPath(pathname: string) {
  return portalPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/login/");
}

function isStandalonePath(pathname: string) {
  return isLoginPath(pathname) || pathname === "/agents/register";
}

function isMasterHost(host: string | null) {
  if (!host) return true;

  const cleanHost = host.split(":")[0];

  return (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "0.0.0.0" ||
    cleanHost.endsWith(".vercel.app")
  );
}

export default function ShellRouter({ children }: ShellRouterProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const host =
    typeof window === "undefined" ? null : window.location.host;

  const masterHost = isMasterHost(host);

  const tenant = useMemo(() => {
    return getTenantByHost(host);
  }, [host]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabaseClient.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const publicNavItems = [
    { label: "Home", href: "/", icon: Home, enabled: true },
    {
      label: "Umrah Packages",
      href: "/umrah-packages",
      icon: Building2,
      enabled: tenant.modules.umrahPackages,
    },
    {
      label: "Group Tickets",
      href: "/umrah/groups",
      icon: Ticket,
      enabled: tenant.modules.groupTickets,
    },
    {
      label: "Hotels",
      href: "/hotels",
      icon: Hotel,
      enabled: tenant.modules.hotels,
    },
    {
      label: "Transport",
      href: "/transport",
      icon: Car,
      enabled: tenant.modules.transport,
    },
    {
      label: "Visa",
      href: "/umrah/visa",
      icon: ShieldCheck,
      enabled: tenant.modules.visa,
    },
    {
      label: "Contact",
      href: "/contact",
      icon: Phone,
      enabled: tenant.modules.contact,
    },
  ].filter((item) => item.enabled);

  if (isStandalonePath(pathname)) {
    return <>{children}</>;
  }

  if (masterHost || isPortalPath(pathname)) {
    return (
      <div className="min-h-screen bg-slate-50 md:flex">
        <AppSidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Master Backend Panel
                </h2>
                <p className="text-xs text-slate-500">
                  Software control, client portals, modules, accounts & operations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                >
                  <LogOut size={14} />
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
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
              {tenant.logoText}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
                {tenant.brandName}
              </p>
              <h1 className="text-lg font-black leading-tight">
                {tenant.tagline}
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
              href="/agents/register"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-5 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-400/20"
            >
              <UserPlus size={16} />
              B2B Agent Register
            </Link>

            {tenant.modules.agentLogin ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <LogIn size={16} />
                Agent Login
              </Link>
            ) : null}

            {tenant.modules.bookNow ? (
              <Link
                href="/contact"
                className="rounded-full bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
              >
                Book Now
              </Link>
            ) : null}
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
                href="/agents/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-300"
              >
                <UserPlus size={16} />
                B2B Agent Register
              </Link>

              {tenant.modules.agentLogin ? (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950"
                >
                  <LogIn size={16} />
                  Agent Login
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      {children}
    </div>
  );
}