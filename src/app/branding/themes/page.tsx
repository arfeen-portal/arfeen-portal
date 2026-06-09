const themeStats = [
  { label: "Active Theme", value: "Arfeen Gold" },
  { label: "Tenant Themes", value: "12" },
  { label: "Invoice Templates", value: "6" },
  { label: "Brand Score", value: "94%" },
];

const themes = [
  {
    name: "Arfeen Gold",
    type: "Default Portal",
    primary: "#0f172a",
    accent: "#d4af37",
    status: "Active",
  },
  {
    name: "Emerald Umrah",
    type: "Agent Portal",
    primary: "#064e3b",
    accent: "#10b981",
    status: "Ready",
  },
  {
    name: "Royal Blue",
    type: "Corporate SaaS",
    primary: "#1e3a8a",
    accent: "#38bdf8",
    status: "Ready",
  },
];

const brandingAreas = [
  "Sidebar Theme",
  "Login Background",
  "Invoice Branding",
  "Voucher Branding",
  "WhatsApp Header",
  "Public Portal Colors",
  "Agent Dashboard Theme",
  "White-label App Colors",
];

export default function BrandingThemesPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
              Branding Engine
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Theme Control Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Manage tenant-wise portal themes, invoice branding, voucher style,
              sidebar colors, login screens and white-label identity settings.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            + Create Theme
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {themeStats.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">Available Themes</h2>

            <div className="mt-5 grid gap-4">
              {themes.map((theme) => (
                <div key={theme.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{theme.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{theme.type}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className="h-10 w-10 rounded-full border border-slate-300"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span
                        className="h-10 w-10 rounded-full border border-slate-300"
                        style={{ backgroundColor: theme.accent }}
                      />
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                        {theme.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <h2 className="text-xl font-black">AI Brand Intelligence</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Future engine can analyze uploaded logo and automatically suggest
              matching colors, gradients, invoice layouts, login backgrounds and
              agent portal theme combinations.
            </p>

            <div className="mt-6 grid gap-3">
              {brandingAreas.map((area) => (
                <div key={area} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold">
                  {area}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}