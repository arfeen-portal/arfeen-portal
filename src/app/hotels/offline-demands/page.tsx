import { redirect } from "next/navigation";
import AgentHotelRequests from "@/components/hotels/AgentHotelRequests";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const OPS_ROLES = new Set(["super_admin", "admin", "operations"]);

export default async function OfflineDemandsGatewayPage() {
  const supabase = await createSupabaseServerClient();
  let isAuthenticated = false;
  let isAgent = false;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      isAuthenticated = true;

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.email.toLowerCase())
        .maybeSingle<{ role: string | null }>();

      const role = profile?.role || "";

      if (OPS_ROLES.has(role)) {
        redirect("/admin/hotels/offline-demands");
      }

      isAgent = role === "agent";
    }
  }

  return (
    <AgentHotelRequests
      isAuthenticated={isAuthenticated}
      isAgent={isAgent}
    />
  );
}
