import type { ReactNode } from "react";

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-100">
              Arfeen Travel – Driver App
            </span>
            <span className="text-[10px] text-slate-400">
              Today&apos;s trips & statuses
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            Online
          </span>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-4xl px-4 py-4">{children}</div>
      </main>
    </div>
  );
}
