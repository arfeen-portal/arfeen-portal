import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { HOTEL_OPS_ROLES } from "@/lib/hotels/audience";

export const dynamic = "force-dynamic";

export default async function OfflineDemandsGatewayPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?next=/hotels/offline-demands");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=/hotels/offline-demands");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle<{ role: string | null }>();

  const role = profile?.role || null;

  if (role && HOTEL_OPS_ROLES.has(role)) {
    redirect("/admin/hotels/offline-demands");
  }

  if (role === "agent") {
    redirect("/agent/hotels");
  }

  redirect("/login?next=/hotels/offline-demands");
}
