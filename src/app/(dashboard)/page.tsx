// src/app/(dashboard)/page.tsx
export const dynamic = "force-dynamic";
export default function DashboardRootPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Arfeen Portal Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        (dashboard)/page.tsx is working – default dashboard route.
      </p>
    </div>
  );
}
