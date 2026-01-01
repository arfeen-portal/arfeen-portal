import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
  // Next 16: cookies() may be async; keep it awaited (safe across channels)
  const store = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        // Use `any` to avoid type friction between Next and SSR cookie options
        set(name: string, value: string, options: any) {
          store.set({ name, value, ...options } as any);
        },
        remove(name: string, options: any) {
          store.set({ name, value: "", ...options, maxAge: 0 } as any);
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();

  return NextResponse.json({
    user: data?.user ?? null,
    error: error?.message ?? null,
  });
}
