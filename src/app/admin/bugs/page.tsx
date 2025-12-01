import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BugsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: bugs } = await supabase
    .from("bug_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main style={{ padding: 24 }}>
      <h1>Bug Alerts</h1>
      <p>
        Realtime alerts show as new bugs arrive. Click “AI Suggest” to generate a fix.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            <th align="left">Time</th>
            <th align="left">Route</th>
            <th align="left">Msg</th>
            <th align="left">Status</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(bugs ?? []).map((b) => (
            <tr key={b.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{new Date(b.created_at).toLocaleString()}</td>
              <td>{b.route}</td>
              <td>{b.message?.slice(0, 80)}</td>
              <td>{b.status}</td>
              <td>
                <form action="/api/bug-ai-suggest" method="post">
                  <input type="hidden" name="bugId" value={b.id} />
                  {/* simple POST via fetch on client is better, but keep SSR safe */}
                  <Link href={`/admin/bugs/${b.id}`} style={{ marginRight: 12 }}>
                    View
                  </Link>
                  <button
                    formAction="/api/bug-ai-suggest"
                    formMethod="post"
                    name="bugId"
                    value={b.id}
                    style={{ padding: "4px 8px" }}
                  >
                    AI Suggest
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RealtimeClient />
    </main>
  );
}

function RealtimeClient() {
  return (
    // Client-only widget to subscribe
    <script
      dangerouslySetInnerHTML={{
        __html: `
(async function(){
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient("${process.env.NEXT_PUBLIC_SUPABASE_URL}", "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}");
    supabase.channel('bugs').on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bug_events' },
      (payload) => {
        const msg = payload.new?.message || 'New bug';
        if (Notification && Notification.permission === 'granted') {
          new Notification('New Bug', { body: msg });
        } else {
          console.log('[Bug Alert]', msg);
          alert('Bug captured: ' + msg);
        }
      }
    ).subscribe();
    if (Notification && Notification.permission !== 'granted') {
      Notification.requestPermission?.();
    }
  } catch(e){ console.warn('Realtime subscribe failed', e); }
})();
        `.trim(),
      }}
    />
  );
}
