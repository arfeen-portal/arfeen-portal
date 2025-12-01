import { RealtimeMap } from "@/components/locator/RealtimeMap";

export const metadata = {
  title: "Live Family & Driver Locator – Arfeen Portal",
};

export default function LiveLocatorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Live locator</h1>
        <p className="text-sm text-muted-foreground">
          Real-time map showing all active drivers, families and agents. Data
          auto-refreshes every few seconds.
        </p>
      </div>
      <RealtimeMap />
    </div>
  );
}
