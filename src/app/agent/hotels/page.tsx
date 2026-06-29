import AgentHotelRequests from "@/components/hotels/AgentHotelRequests";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AgentHotelsPage() {
  const supabase = await createSupabaseServerClient();
  let isAuthenticated = false;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user?.email);
  }

  return <AgentHotelRequests isAuthenticated={isAuthenticated} isAgent />;
}
