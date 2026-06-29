import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  CreditCard,
  FileBarChart2,
  FileSpreadsheet,
  Globe,
  HandCoins,
  Home,
  LayoutDashboard,
  LineChart,
  MapPinned,
  NotebookPen,
  Package,
  Plane,
  Receipt,
  Route,
  Search,
  ShieldCheck,
  Ticket,
  Truck,
  UserCheck,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";

export type SidebarItem = {
  title: string;
  href?: string;
  icon?: LucideIcon;
  children?: SidebarItem[];
};

export const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Operations",
    icon: Briefcase,
    children: [
      {
        title: "Transport",
        href: "/transport",
        icon: Truck,
      },
      {
        title: "New Transport Booking",
        href: "/transport/new",
        icon: NotebookPen,
      },
      {
        title: "Hotel RFQ Command Center",
        href: "/admin/hotels/offline-demands",
        icon: Building2,
      },
      {
        title: "Umrah Packages",
        href: "/umrah/packages",
        icon: Package,
      },
      {
        title: "Create Umrah Package",
        href: "/umrah/packages/new",
        icon: NotebookPen,
      },
      {
        title: "Group Ticketing",
        href: "/group-ticketing",
        icon: Ticket,
      },
      {
        title: "Locator",
        href: "/locator",
        icon: MapPinned,
      },
      {
        title: "Locator History",
        href: "/locator/history",
        icon: Route,
      },
    ],
  },
  {
    title: "Accounting",
    icon: Calculator,
    children: [
      {
        title: "Accounts Dashboard",
        href: "/accounts/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Chart of Accounts",
        href: "/accounts/chart-of-accounts",
        icon: BookOpen,
      },
      {
        title: "Journal Entries",
        href: "/accounts/journal",
        icon: NotebookPen,
      },
      {
        title: "Trial Balance",
        href: "/accounts/trial-balance",
        icon: FileSpreadsheet,
      },
      {
        title: "Profit & Loss",
        href: "/accounts/profit-loss",
        icon: LineChart,
      },
      {
        title: "Balance Sheet",
        href: "/accounts/balance-sheet",
        icon: Wallet,
      },
      {
        title: "Agent Ledger",
        href: "/accounts/agent-ledger",
        icon: BookOpen,
      },
      {
        title: "Invoices",
        href: "/accounts/invoices",
        icon: Receipt,
      },
      {
        title: "Payment Tracking",
        href: "/accounts/payment-tracking",
        icon: CreditCard,
      },
      {
        title: "AI Decision Widget",
        href: "/accounts/ai-decision",
        icon: Brain,
      },
      {
        title: "Profit Leak Detector",
        href: "/accounts/profit-leak-detector",
        icon: FileBarChart2,
      },
      {
        title: "Smart Alerts",
        href: "/accounts/smart-alerts",
        icon: BellRing,
      },
      {
        title: "Auto Reminders",
        href: "/accounts/auto-reminders",
        icon: BellRing,
      },
      {
        title: "Auto Driver Assign",
        href: "/accounts/auto-driver-assign",
        icon: Truck,
      },
      {
        title: "Agent Scoring",
        href: "/accounts/agent-scoring",
        icon: UserCheck,
      },
      {
        title: "Refund Control Center",
        href: "/accounts/refunds",
        icon: Receipt,
      },
      {
        title: "Airline / BSP Reports",
        href: "/accounts/airline-reports",
        icon: Plane,
      },
      {
        title: "Voucher Intelligence",
        href: "/accounts/voucher-intelligence",
        icon: ShieldCheck,
      },
      {
        title: "Operations Control",
        href: "/accounts/operations-control",
        icon: Activity,
      },
      {
        title: "AI Financial Health",
        href: "/accounts/ai-financial-health",
        icon: Brain,
      },
      {
        title: "Strategic Intelligence",
        href: "/accounts/strategic-intelligence",
        icon: LineChart,
      },
      {
        title: "Market Intelligence",
        href: "/accounts/market-intelligence",
        icon: BarChart3,
      },
      {
        title: "AI Umrah Command",
        href: "/accounts/umrah-ai-command",
        icon: Brain,
      },
    ],
  },
  {
    title: "Vouchers",
    icon: Receipt,
    children: [
      {
        title: "Payment Voucher",
        href: "/vouchers/payment",
        icon: HandCoins,
      },
      {
        title: "Receipt Voucher",
        href: "/vouchers/receipt",
        icon: Receipt,
      },
      {
        title: "Cash Voucher",
        href: "/vouchers/cash",
        icon: Wallet,
      },
      {
        title: "Bank Voucher",
        href: "/vouchers/bank",
        icon: Building2,
      },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    children: [
      {
        title: "Pro Dashboard",
        href: "/analytics/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Global Search",
        href: "/analytics/search",
        icon: Search,
      },
      {
        title: "Analytics Widgets",
        href: "/analytics/widgets",
        icon: BarChart3,
      },
      {
        title: "Sales Reports",
        href: "/reports/sales",
        icon: FileBarChart2,
      },
      {
        title: "Travel Reports",
        href: "/reports/travel",
        icon: Route,
      },
      {
        title: "Financial Analytics",
        href: "/reports/financial-analytics",
        icon: WalletCards,
      },
    ],
  },
  {
    title: "Agents",
    icon: Users,
    children: [
      {
        title: "Agent Dashboard",
        href: "/agents/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Commission Automation",
        href: "/agents/commission-automation",
        icon: HandCoins,
      },
      {
        title: "Credit Control",
        href: "/agents/credit-control",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Branding & Portal",
    icon: Globe,
    children: [
      {
        title: "Domain Branding",
        href: "/branding/domain-based",
        icon: Globe,
      },
      {
        title: "Theme System",
        href: "/branding/themes",
        icon: LayoutDashboard,
      },
      {
        title: "Agent Portal Separation",
        href: "/branding/agent-portal-separation",
        icon: Building2,
      },
    ],
  },
];