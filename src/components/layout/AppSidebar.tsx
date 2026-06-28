"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Wallet,
  Users,
  Building2,
  Bus,
  Package,
  Search,
  Settings,
  Globe,
  ShieldCheck,
  ChevronDown,
  MapPin,
  Bell,
  Bot,
  LogOut,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type MenuItem = {
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
};

const menu: MenuItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },

 {
    label: "Accounts",
    icon: Wallet,
    children: [
      { label: "Accounts Home", href: "/accounts" },
      { label: "Invoices", href: "/accounts/invoices" },
      { label: "New Invoice", href: "/accounts/invoices/new" },
      { label: "Chart of Accounts", href: "/accounts/chart-of-accounts" },
      { label: "Ledger", href: "/accounts/ledger" },
      { label: "Agent Ledger", href: "/accounts/agent-ledger" },
      { label: "Ledger Import", href: "/accounts/ledger-import" },
      { label: "Journal Entries", href: "/accounts/journal" },
      { label: "Journal Entry", href: "/accounts/journal-entry" },
      { label: "Vouchers", href: "/accounts/vouchers" },
      // Merge kar diya gaya hai:
      { label: "Cash & Bank Book", href: "/accounts/cash-book" }, 
      { label: "Trial Balance", href: "/accounts/trial-balance" },
      { label: "Profit & Loss", href: "/accounts/reports/profit-loss" },
      { label: "Balance Sheet", href: "/accounts/reports/balance-sheet" },
      { label: "Aging", href: "/accounts/reports/aging" },
      { label: "Outstanding", href: "/accounts/reports/outstanding" },
      
      // AI & Strategic Modules
      { label: "AI Decision Widget", href: "/accounts/ai-decision" },
      { label: "Profit Leak Detector", href: "/accounts/profit-leak-detector" },
      { label: "Smart Alerts", href: "/accounts/smart-alerts" },
      { label: "Auto Reminders", href: "/accounts/auto-reminders" },
      { label: "Auto Driver Assign", href: "/accounts/auto-driver-assign" },
      { label: "Agent Scoring", href: "/accounts/agent-scoring" },
      { label: "Refund Control Center", href: "/accounts/refunds" },
      { label: "Airline / BSP Reports", href: "/accounts/airline-reports" },
      { label: "Voucher Intelligence", href: "/accounts/voucher-intelligence" },
      { label: "AI Financial Health", href: "/accounts/ai-financial-health" },
      { label: "Strategic Intelligence", href: "/accounts/strategic-intelligence" },
      { label: "Market Intelligence", href: "/accounts/market-intelligence" },
      { label: "AI Umrah Command Center", href: "/accounts/umrah-ai-command" },
    ],
  },

  {
    label: "Transport",
    icon: Bus,
    children: [
      { label: "Bookings", href: "/transport" },
      { label: "New Booking", href: "/transport/new" },
      { label: "Drivers", href: "/transport/drivers" },
      { label: "Vehicles", href: "/transport/vehicles" },
      { label: "Routes", href: "/transport/routes" },
      { label: "Rates", href: "/transport/rates" },
      { label: "Operations Live Control", href: "/oprations/live-control" },
    ],
  },

  {
    label: "Hotels",
    icon: Building2,
    children: [
      { label: "Khuraki Dashboard", href: "/admin/hotels/kuraki" },
      { label: "Voucher Stays", href: "/admin/hotels/kuraki/vouchers" },
      { label: "Daily Runs", href: "/admin/hotels/kuraki/daily-runs" },
      { label: "Khuraki Staff", href: "/admin/hotels/kuraki/staff" },
      { label: "Incidents", href: "/admin/hotels/kuraki/incidents" },
      { label: "Supplier Bills", href: "/admin/hotels/kuraki/supplier-bills" },
      { label: "AI Logs", href: "/admin/hotels/kuraki/ai-logs" },
      { label: "Reports", href: "/admin/hotels/kuraki/reports" },
      { label: "Offline Hotel Demands", href: "/hotels/offline-demands" },
    ],
  },

  {
    label: "Umrah",
    icon: Package,
    children: [
      { label: "Packages", href: "/umrah/packages" },
      { label: "New Package", href: "/umrah/packages/new" },
      { label: "Hotels", href: "/umrah/hotels" },
      { label: "Flights", href: "/umrah/flights" },
      { label: "AI Package Import", href: "/umrah/ai-package-import" },
      { label: "Ziyarat", href: "/umrah/ziyarat" },
      { label: "Group Ticketing", href: "/umrah/groups" },
      { label: "Visa Inventory", href: "/umrah/visa" },
    ],
  },

  {
    label: "Agents",
    icon: Users,
    children: [
      { label: "Agent Dashboard", href: "/agents/dashboard" },
      { label: "All Agents", href: "/agents" },
      { label: "Commission Rules", href: "/agents/commissions" },
      { label: "Credit Control", href: "/agents/credit-control" },
      { label: "Statements", href: "/agents/statements" },
      { label: "Register Agent", href: "/agents/register" },
      { label: "Rewards", href: "/agents/rewards" },
    ],
  },

  {
    label: "Reports",
    icon: BarChart3,
    children: [
      { label: "Sales Reports", href: "/reports/sales" },
      { label: "Travel Reports", href: "/reports/travel" },
      { label: "Financial Analytics", href: "/reports/financial-analytics" },
      { label: "Dashboard Summary", href: "/reports/dashboard" },
      { label: "Cash Flow", href: "/reports/cash-flow" },
      { label: "Profit Loss", href: "/reports/profit-loss" },
      { label: "Trial Balance", href: "/reports/trial-balance" },
    ],
  },

  {
    label: "Locator",
    icon: MapPin,
    children: [
      { label: "Live Locator", href: "/locator/live" },
      { label: "Location History", href: "/locator/history" },
    ],
  },

  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Search", href: "/search", icon: Search },

  {
    label: "Branding",
    icon: Globe,
    children: [
      { label: "Themes", href: "/branding/themes" },
      { label: "Domains", href: "/branding/domains" },
      { label: "Portal Separation", href: "/branding/portal-separation" },
    ],
  },

  {
    label: "Admin",
    icon: ShieldCheck,
    children: [
      { label: "Admin Dashboard", href: "/admin/dashboard" },
      { label: "Admin Analytics", href: "/admin/analytics" },
      { label: "Accounting Admin", href: "/admin/accounting" },
      { label: "Agent Portals", href: "/admin/agent-portals" },
      { label: "Admin Group Setup", href: "/admin/umrah-groups" },
      { label: "Tenant Provisioning", href: "/admin/tenant-provisioning" },
      { label: "AI SaaS Onboarding", href: "/admin/ai-saas-onboarding" },
      { label: "Travel Intelligence Suite", href: "/admin/travel-intelligence-suite" },
      { label: "Agents Admin", href: "/admin/agents" },
      { label: "Users", href: "/admin/users" },
      { label: "Roles & Guards", href: "/admin/roles" },
      { label: "Settings Roles", href: "/admin/settings/roles" },
      { label: "Permission Matrix", href: "/admin/permission-matrix" },
      { label: "White Label Themes", href: "/admin/themes" },
      { label: "Domain Mapping", href: "/branding/domains" },
      { label: "Integration API Testing", href: "/admin/integration-api-testing" },
      { label: "Automation Center", href: "/admin/automation" },
      { label: "Auto Driver Assign", href: "/admin/automation/auto-driver-assign" },
      { label: "Profit Lock", href: "/admin/automation/profit-lock" },
      { label: "WhatsApp Engine", href: "/admin/automation/whatsapp-engine" },
      { label: "Credit Control", href: "/admin/credit-control" },
      { label: "Driver Tracking", href: "/admin/driver-tracking" },
      { label: "Manifests Preview", href: "/admin/manifests/preview" },
      { label: "New Package", href: "/admin/packages/new" },
      { label: "Log Anomalies", href: "/admin/log-anomalies" },
      { label: "System Logs", href: "/admin/logs" },
    ],
  },

  {
    label: "AI Tools",
    icon: Bot,
    children: [
      { label: "Prediction Engine", href: "/ai/prediction-engine" },
      { label: "AI Umrah Planner", href: "/ai-umrah-planner" },
      { label: "Live Map", href: "/ai/live-map" },
      { label: "SaaS Onboarding", href: "/ai/saas-onboarding" },
      { label: "AI Innovation Suite", href: "/ai/innovation-suite" },
    ],
  },

  {
    label: "System",
    icon: Settings,
    children: [
      { label: "Settings", href: "/settings" },
      { label: "Tenants", href: "/tenants" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
];

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabaseClient.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const defaultOpen = useMemo(() => {
    const map: Record<string, boolean> = {};

    for (const section of menu) {
      if (section.children?.some((child) => isPathActive(pathname, child.href))) {
        map[section.label] = true;
      }
    }

    return map;
  }, [pathname]);

  const [openSections, setOpenSections] =
    useState<Record<string, boolean>>(defaultOpen);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-screen w-full flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-2 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Arfeen Travel</p>
              <h1 className="text-lg font-bold text-slate-900">Portal</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;

              if (item.href) {
                const active = isPathActive(pathname, item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              const opened = openSections[item.label] ?? false;
              const hasActiveChild = item.children?.some((child) =>
                isPathActive(pathname, child.href)
              );

              return (
                <div key={item.label} className="rounded-2xl">
                  <button
                    type="button"
                    onClick={() => toggleSection(item.label)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      hasActiveChild
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition ${
                        opened ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {opened && item.children && (
                    <div className="mt-2 space-y-1 pl-4">
                      {item.children.map((child) => {
                        const active = isPathActive(pathname, child.href);

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block rounded-xl px-4 py-2.5 text-sm transition ${
                              active
                                ? "bg-blue-50 font-semibold text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}