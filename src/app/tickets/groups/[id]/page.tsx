import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function GroupTicketDetailPage({ params }: PageProps) {
  const id = params.id;

  const { data, error } = await supabase
    .from("group_tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    notFound();
  }

  const g: any = data;

  return (
    <div className="p-6 space-y-4">
      <Link href="/tickets/groups" className="text-sm text-blue-600 underline">
        ← Back to groups
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Group {g.group_code || g.id}
          </h1>
          <p className="text-sm text-gray-600">
            {g.origin} → {g.destination} | {g.airline || "Airline N/A"}
          </p>
        </div>
        <span className="text-xs rounded-full px-3 py-1 bg-gray-100 text-gray-700">
          Status: {g.status || "unknown"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-sm">
        <div className="border rounded p-4 space-y-1">
          <h2 className="font-semibold mb-2">Basic Info</h2>
          <p>
            <span className="font-medium">Group code: </span>
            {g.group_code || "—"}
          </p>
          <p>
            <span className="font-medium">Airline: </span>
            {g.airline || "—"}
          </p>
          <p>
            <span className="font-medium">Route: </span>
            {g.origin} → {g.destination}
          </p>
          <p>
            <span className="font-medium">Departure: </span>
            {g.departure_date || "—"}
          </p>
          <p>
            <span className="font-medium">Return: </span>
            {g.return_date || "—"}
          </p>
        </div>

        <div className="border rounded p-4 space-y-1">
          <h2 className="font-semibold mb-2">Capacity & Pricing</h2>
          <p>
            <span className="font-medium">Total seats: </span>
            {g.total_seats ?? "—"}
          </p>
          <p>
            <span className="font-medium">Sold seats: </span>
            {g.sold_seats ?? "—"}
          </p>
          <p>
            <span className="font-medium">Currency: </span>
            {g.currency || "—"}
          </p>
          <p>
            <span className="font-medium">Seat price: </span>
            {g.seat_price != null
              ? `${g.currency || ""} ${g.seat_price}`
              : "—"}
          </p>
        </div>
      </div>

      {g.notes && (
        <div className="border rounded p-4 text-sm">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="whitespace-pre-wrap text-gray-700">{g.notes}</p>
        </div>
      )}
    </div>
  );
}
