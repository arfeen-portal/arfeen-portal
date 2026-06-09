import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type RequestUser = {
  id: string;
  email: string | null;
  role: string | null;
};

type UserRoleRow = {
  role: string | null;
};

export async function getRequestUser(): Promise<RequestUser | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<UserRoleRow>();

  if (profileError) {
    return {
      id: user.id,
      email: user.email ?? null,
      role: null,
    };
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role ?? null,
  };
}