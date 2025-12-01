// TEMP STUB – abhi ke liye static data, taake TypeScript errors khatam ho jayein.
// Future mein hum isko Supabase se real data se connect karenge.

export async function getAgentDashboard(agentId: string) {
  return {
    activeBookings: 0,
    balance: 0,
    recent: [] as Array<{
      id: string;
      route: string;
      date: string;
    }>,
  };
}
