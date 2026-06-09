import {
  LayoutDashboard,
  Car,
  Building2,
  Package,
  Users,
  Ticket,
  Calculator,
  Wallet,
  FileText,
  BarChart3,
  Search,
  ShieldCheck,
  Bell,
  Palette,
  Globe,
  CreditCard,
  Landmark,
  Receipt,
  BookOpen,
  ClipboardList,
  UserCog,
  MapPinned,
  Settings,
} from "lucide-react";

export type UserRole =
  | "super_admin"
  | "admin"
  | "agent"
  | "accountant"
  | "driver";

export type NavChild = {
  title: string;
  href: string;
  roles?: UserRole[];
};

export type NavSection = {
  title: string;
  href?: string;
  icon: any;
  roles?: UserRole[];
  children?: NavChild[];
};

export const sidebarNavigation: NavSection[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "agent", "accountant"],
  },

  {
    title: "Bookings",
    icon: ClipboardList,
    roles: ["super_admin", "admin", "agent"],
    children: [
      { title: "All Bookings", href: "/admin/bookings", roles: ["super_admin", "admin"] },
      { title: "Transport Bookings", href: "/transport", roles: ["super_admin", "admin", "agent"] },
      { title: "Hotel Bookings", href: "/admin/hotels/bookings", roles: ["super_admin", "admin", "agent"] },
      { title: "Umrah Packages", href: "/admin/umrah/packages", roles: ["super_admin", "admin", "agent"] },
      { title: "Group Ticketing", href: "/admin/group-ticketing", roles: ["super_admin", "admin", "agent"] },
    ],
  },

  {
    title: "Transport",
    icon: Car,
    roles: ["super_admin", "admin", "agent", "driver"],
    children: [
      { title: "Transport Dashboard", href: "/transport", roles: ["super_admin", "admin", "agent"] },
      { title: "New Booking", href: "/transport/new", roles: ["super_admin", "admin", "agent"] },
      { title: "Driver Assignments", href: "/admin/transport/assignments", roles: ["super_admin", "admin"] },
      { title: "Vehicles", href: "/admin/transport/vehicles", roles: ["super_admin", "admin"] },
      { title: "Drivers", href: "/admin/transport/drivers", roles: ["super_admin", "admin"] },
      { title: "Driver App", href: "/driver/dashboard", roles: ["driver"] },
    ],
  },

  {
    title: "Hotels",
    icon: Building2,
    roles: ["super_admin", "admin", "agent"],
    children: [
      { title: "Hotels Dashboard", href: "/admin/hotels", roles: ["super_admin", "admin", "agent"] },
      { title: "Contracts", href: "/admin/hotels/contracts", roles: ["super_admin", "admin"] },
      { title: "Inventory", href: "/admin/hotels/inventory", roles: ["super_admin", "admin"] },
      { title: "Rates", href: "/admin/hotels/rates", roles: ["super_admin", "admin", "agent"] },
    ],
  },

  {
    title: "Umrah",
    icon: Package,
    roles: ["super_admin", "admin", "agent"],
    children: [
      { title: "Packages", href: "/admin/umrah/packages", roles: ["super_admin", "admin", "agent"] },
      { title: "Create Package", href: "/admin/umrah/packages/new", roles: ["super_admin", "admin"] },
      { title: "Calculator", href: "/admin/umrah/calculator", roles: ["super_admin", "admin", "agent"] },
      { title: "Rate Engine", href: "/admin/rates", roles: ["super_admin", "admin"] },
    ],
  },

  {
    title: "Agents",
    icon: Users,
    roles: ["super_admin", "admin", "agent"],
    children: [
      { title: "Agent Dashboard", href: "/admin/agents/dashboard", roles: ["super_admin", "admin", "agent"] },
      { title: "All Agents", href: "/admin/agents", roles: ["super_admin", "admin"] },
      { title: "Commission Rules", href: "/admin/agents/commission", roles: ["super_admin", "admin"] },
      { title: "Credit Control", href: "/admin/agents/credit-control", roles: ["super_admin", "admin"] },
      { title: "Agent Portal", href: "/agent/dashboard", roles: ["agent"] },
    ],
  },

  {
    title: "Ticketing",
    icon: Ticket,
    roles: ["super_admin", "admin", "agent"],
    children: [
      { title: "Group Ticketing", href: "/admin/group-ticketing", roles: ["super_admin", "admin", "agent"] },
      { title: "Flight Groups", href: "/admin/flights/groups", roles: ["super_admin", "admin"] },
      { title: "PNR / Tickets", href: "/admin/flights/tickets", roles: ["super_admin", "admin", "agent"] },
    ],
  },

  {
    title: "Finance",
    icon: Wallet,
    roles: ["super_admin", "admin", "accountant"],
    children: [
      { title: "Accounts Dashboard", href: "/admin/accounts/dashboard", roles: ["super_admin", "admin", "accountant"] },
      { title: "Chart of Accounts", href: "/admin/accounts/chart", roles: ["super_admin", "admin", "accountant"] },
      { title: "Journal Entries", href: "/admin/accounts/journal", roles: ["super_admin", "admin", "accountant"] },
      { title: "Vouchers", href: "/admin/vouchers", roles: ["super_admin", "admin", "accountant"] },
      { title: "Ledger", href: "/admin/accounts/ledger", roles: ["super_admin", "admin", "accountant"] },
      { title: "Trial Balance", href: "/admin/accounts/trial-balance", roles: ["super_admin", "admin", "accountant"] },
      { title: "Profit & Loss", href: "/admin/accounts/profit-loss", roles: ["super_admin", "admin", "accountant"] },
      { title: "Balance Sheet", href: "/admin/accounts/balance-sheet", roles: ["super_admin", "admin", "accountant"] },
      { title: "Payment Tracking", href: "/admin/payments", roles: ["super_admin", "admin", "accountant"] },
    ],
  },

  {
    title: "Invoicing",
    icon: Receipt,
    roles: ["super_admin", "admin", "accountant", "agent"],
    children: [
      { title: "Invoices", href: "/admin/invoices", roles: ["super_admin", "admin", "accountant", "agent"] },
      { title: "Create Invoice", href: "/admin/invoices/new", roles: ["super_admin", "admin", "accountant"] },
      { title: "PDF / Send", href: "/admin/invoices/send", roles: ["super_admin", "admin", "accountant"] },
    ],
  },

  {
    title: "Reports",
    icon: BarChart3,
    roles: ["super_admin", "admin", "accountant"],
    children: [
      { title: "Sales Reports", href: "/admin/reports/sales", roles: ["super_admin", "admin", "accountant"] },
      { title: "Travel Reports", href: "/admin/reports/travel", roles: ["super_admin", "admin", "accountant"] },
      { title: "Financial Analytics", href: "/admin/reports/financial-analytics", roles: ["super_admin", "admin", "accountant"] },
    ],
  },

  {
    title: "Search & Analytics",
    icon: Search,
    roles: ["super_admin", "admin"],
    children: [
      { title: "Global Search", href: "/admin/search", roles: ["super_admin", "admin"] },
      { title: "Analytics Widgets", href: "/admin/analytics", roles: ["super_admin", "admin"] },
      { title: "Pro Dashboard", href: "/admin/dashboard", roles: ["super_admin", "admin"] },
    ],
  },

  {
    title: "Branding",
    icon: Palette,
    roles: ["super_admin", "admin"],
    children: [
      { title: "Domain Branding", href: "/admin/branding/domains", roles: ["super_admin", "admin"] },
      { title: "Theme System", href: "/admin/branding/themes", roles: ["super_admin", "admin"] },
      { title: "White Label", href: "/admin/branding/whitelabel", roles: ["super_admin", "admin"] },
    ],
  },

  {
    title: "Locator",
    icon: MapPinned,
    roles: ["super_admin", "admin", "agent", "driver"],
    children: [
      { title: "Live Locator", href: "/locator", roles: ["super_admin", "admin", "agent"] },
      { title: "Location History", href: "/locator/history", roles: ["super_admin", "admin", "agent"] },
    ],
  },

  {
    title: "Security",
    icon: ShieldCheck,
    roles: ["super_admin", "admin"],
    children: [
      { title: "Validation Layer", href: "/admin/security/validation", roles: ["super_admin", "admin"] },
      { title: "Error Standards", href: "/admin/security/errors", roles: ["super_admin", "admin"] },
      { title: "Auth Guards", href: "/admin/security/auth-guards", roles: ["super_admin", "admin"] },
      { title: "Audit Logs", href: "/admin/security/audit-logs", roles: ["super_admin", "admin"] },
    ],
  },

  {
    title: "Notifications",
    icon: Bell,
    roles: ["super_admin", "admin"],
    children: [
      { title: "Templates", href: "/admin/notifications/templates", roles: ["super_admin", "admin"] },
      { title: "WhatsApp / Email", href: "/admin/notifications/send", roles: ["super_admin", "admin"] },
    ],
  },

  {
    title: "Users & Roles",
    icon: UserCog,
    roles: ["super_admin", "admin"],
    children: [
      { title: "Users", href: "/admin/users", roles: ["super_admin", "admin"] },
      { title: "Roles & Permissions", href: "/admin/users/roles", roles: ["super_admin", "admin"] },
    ],
  },

  {
    title: "System",
    icon: Settings,
    roles: ["super_admin", "admin"],
    children: [
      { title: "Company Settings", href: "/admin/settings/company", roles: ["super_admin", "admin"] },
      { title: "Currency / Billing", href: "/admin/settings/billing", roles: ["super_admin", "admin"] },
      { title: "Integrations", href: "/admin/settings/integrations", roles: ["super_admin", "admin"] },
    ],
  },
];

export function hasRoleAccess(
  allowedRoles: UserRole[] | undefined,
  currentRole: UserRole
) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(currentRole);
}

export function getSidebarNavigationByRole(role: UserRole) {
  return sidebarNavigation
    .filter((item) => hasRoleAccess(item.roles, role))
    .map((item) => {
      if (!item.children) return item;

      return {
        ...item,
        children: item.children.filter((child) => hasRoleAccess(child.roles, role)),
      };
    })
    .filter((item) => !item.children || item.children.length > 0);
}