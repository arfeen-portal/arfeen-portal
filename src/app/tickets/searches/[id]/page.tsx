import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function FlightSearchDetailPage({ params }: PageProps) {
  const id = params.id;

  const { data, error } = await supabase
    .from("flight_search_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    notFound();
  }

  const s: any = data;

  return (
    <div className="p-6 space-y-4">
      <Link
        href="/tickets/searches"
        className="text-sm text-blue-600 underline"
      >
        ← Back to searches
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {s.origin} → {s.destination}
          </h1>
          <p className="text-sm text-gray-600">
            {s.depart_date} {s.return_date ? ` / Return ${s.return_date}` : ""}
          </p>
        </div>
        <Link
          href={`/tickets/searches/${id}/offers`}
          className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
        >
          View offers log
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <div className="border rounded p-4 space-y-1">
          <h2 className="font-semibold mb-2">Passengers</h2>
          <p>
            Adults: <span className="font-medium">{s.adults}</span>
          </p>
          <p>
            Children: <span className="font-medium">{s.children}</span>
          </p>
          <p>
            Infants: <span className="font-medium">{s.infants}</span>
          </p>
          <p>
            Cabin: <span className="font-medium">{s.cabin_class}</span>
          </p>
        </div>

        <div className="border rounded p-4 space-y-1">
          <h2 className="font-semibold mb-2">Meta</h2>
          <p>
            Created at:{" "}
            {s.created_at
              ? new Date(s.created_at).toLocaleString()
              : "—"}
          </p>
          <p>Search ID: {s.id}</p>
          {s.source && (
            <p>
              Source: <span className="font-medium">{s.source}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
