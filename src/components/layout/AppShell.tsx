import Link from "next/link";
import Image from "next/image";
import type { BrandConfig } from "@/utils/theme";

type AppShellProps = {
  brand: BrandConfig;
  children: React.ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transport/bookings", label: "Transport Bookings" },
  { href: "/umrah/packages", label: "Umrah Packages" },
  { href: "/umrah/batches", label: "Umrah Batches" },
  { href: "/admin/accounting", label: "Accounting" },
  { href: "/admin/transport/analytics", label: "Transport Analytics" },
  { href: "/driver", label: "Driver Panel" },
  { href: "/search", label: "Global Search" },
  { href: "/api-docs", label: "API Docs" },
];

export default function AppShell({ brand, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside
        className="hidden md:flex md:flex-col w-64 border-r bg-white/95 backdrop-blur"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-100">
            <Image
              src={brand.logoUrl}
              alt={brand.name}
              fill
              sizes="36px"
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-semibold text-sm">{brand.name}</div>
            <div className="text-xs text-slate-500">Travel Portal</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm hover:bg-slate-100 text-slate-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t text-xs text-slate-400">
          © {new Date().getFullYear()} {brand.name}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-4 md:px-6 border-b bg-white/80 backdrop-blur z-10 sticky top-0"
          style={{ borderColor: "#e5e7eb" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-full md:hidden"
              style={{ backgroundColor: brand.primaryColor }}
            />
            <span className="font-semibold text-sm md:text-base">
              {brand.name} Portal
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">Powered by Arfeen Travel</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-3 md:px-6 py-5">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
