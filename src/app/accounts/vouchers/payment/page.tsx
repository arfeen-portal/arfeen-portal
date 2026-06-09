import JournalEntryForm from "@/components/accounting/JournalEntryForm";

export const dynamic = "force-dynamic";

async function getEntry(id: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(`${base}/api/accounting/journal/${id}`, {
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load entry");
  return json;
}

export default async function EditJournalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEntry(id);

  return <JournalEntryForm mode="edit" entryId={id} initialData={data} />;
}