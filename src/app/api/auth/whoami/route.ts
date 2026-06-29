import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          store.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;

  let profile: {
    role: string | null;
    name: string | null;
    full_name: string | null;
  } | null = null;

  if (user?.email) {
    const { data: profileRow } = await supabase
      .from("users")
      .select("role, name, full_name")
      .eq("email", user.email.toLowerCase())
      .maybeSingle<{
        role: string | null;
        name: string | null;
        full_name: string | null;
      }>();

    profile = profileRow ?? null;
  }

  return NextResponse.json({
    user,
    profile,
    error: error?.message ?? null,
  });
}
