// src/app/admin/dashboard/agents/page.tsx
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

async function getSupabase() {
  const store = await cookies(); // Next 16: await is required
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

export default async function AgentsPage() {
  const supabase = await getSupabase();

  // protect page
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Agents</h1>
        <p style={{ color: "crimson" }}>
          {authErr?.message ?? "Auth session missing!"}
        </p>
      </main>
    );
  }

  // load agents
  const { data: agents, error } = await supabase
    .from("agents")
    .select("id,name,email")
    .order("name", { ascending: true });

  return (
    <main style={{ padding: 24 }}>
      <h1>Agents</h1>
      {error ? (
        <p style={{ color: "crimson" }}>{error.message}</p>
      ) : (
        <ul>
          {agents?.map((a: any) => (
            <li key={a.id}>
              <b>{a.name}</b> — {a.email}
            </li>
          )) ?? <li>No agents found.</li>}
        </ul>
      )}
    </main>
  );
}
