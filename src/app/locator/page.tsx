import Link from "next/link";

export const metadata = {
  title: "Locator – Arfeen Portal",
};

export default function LocatorHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Family & Driver Locator</h1>
        <p className="text-sm text-muted-foreground">
          Track live positions and review history for families, drivers and agents.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/locator/live"
          className="border rounded-2xl p-4 hover:bg-muted transition text-sm"
        >
          <div className="font-medium mb-1">Live view</div>
          <p className="text-xs text-muted-foreground">
            Real-time map with filters for drivers, families and agents.
          </p>
        </Link>

        <Link
          href="/locator/history"
          className="border rounded-2xl p-4 hover:bg-muted transition text-sm"
        >
          <div className="font-medium mb-1">History</div>
          <p className="text-xs text-muted-foreground">
            Timeline and past locations for selected profiles.
          </p>
        </Link>
      </div>
    </div>
  );
}
