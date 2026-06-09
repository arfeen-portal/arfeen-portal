export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-4 h-8 w-32 rounded bg-slate-300" />
              <div className="mt-3 h-4 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-12">
        <div className="2xl:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-60 rounded bg-slate-100" />
          <div className="mt-6 h-[320px] rounded-2xl bg-slate-100" />
        </div>

        <div className="2xl:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-44 rounded bg-slate-100" />
          <div className="mt-6 h-[320px] rounded-2xl bg-slate-100" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-44 rounded bg-slate-100" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-44 rounded bg-slate-100" />
          <div className="mt-6 h-[320px] rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}