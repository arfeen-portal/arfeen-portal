// src/app/transport/drivers/edit/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function DriverEditPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Edit Driver</h1>
      <p className="mt-2 text-sm text-gray-600">
        Transport &gt; Drivers &gt; Edit page is working.
      </p>
    </div>
  );
}
