// src/app/admin/orders/[id]/page.tsx
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

async function getSupabase() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          store.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await getSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Order</h1>
        <p style={{ color: "crimson" }}>Auth session missing!</p>
      </main>
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", params.id)
    .single();

  return (
    <main style={{ padding: 24 }}>
      <h1>Order #{params.id}</h1>
      {error ? (
        <p style={{ color: "crimson" }}>{error.message}</p>
      ) : (
        <>
          <pre>{JSON.stringify(order, null, 2)}</pre>
        </>
      )}
    </main>
  );
}
