import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Left: Logo + title */}
          <div className="flex items-center gap-3">
            {/* Placeholder logo block – yahan baad mein Arfeen logo aa sakta hai */}
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0C3C78] to-[#C9A045]" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-100">
                Arfeen Travel Portal
              </span>
              <span className="text-[10px] text-slate-400">
                Admin • Operations • Accounting
              </span>
            </div>
          </div>

          {/* Right: status */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              Dev Mode
            </span>
            <span>Signed in as Admin</span>
          </div>
        </div>
      </header>

      {/* Main surface */}
      <main className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Inner white card where all admin pages render */}
          <div className="min-h-[70vh] rounded-3xl border border-slate-800 bg-slate-50 p-3 md:p-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
