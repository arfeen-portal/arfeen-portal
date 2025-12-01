import { createClient } from "@/lib/supabase/server";

export default async function AgentDashboardPage() {
  const supabase = createClient();

  // yahan tum current logged-in agent ko identify karoge (auth se)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const agentId = user?.id; // adjust if you store agent mapping elsewhere

  const { data: stats } = await supabase.rpc("agent_dashboard_stats", {
    p_agent_id: agentId,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, Agent</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-gray-500">Today&apos;s Bookings</p>
          <p className="text-2xl font-bold mt-1">{stats?.today_bookings || 0}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Outstanding Balance</p>
          <p className="text-2xl font-bold mt-1">
            {stats?.outstanding || 0} SAR
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Total Trips</p>
          <p className="text-2xl font-bold mt-1">
            {stats?.total_trips || 0}
          </p>
        </div>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Create New Transport Booking</h2>
          <p className="text-sm text-gray-500">
            Makkah, Madinah, Jeddah Airport – sab ek jagah se.
          </p>
        </div>
        <a
          href="/agent/transport/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          New Booking
        </a>
      </div>
    </div>
  );
}
