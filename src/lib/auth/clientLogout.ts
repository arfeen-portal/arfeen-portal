import { supabaseClient } from "@/lib/supabaseClient";

export async function clientLogout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  await supabaseClient.auth.signOut();

  window.location.href = "/login";
}
