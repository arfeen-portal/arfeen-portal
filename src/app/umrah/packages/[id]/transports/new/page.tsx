import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import { notFound } from "next/navigation";
import UmrahPackageTransportForm from "@/components/umrah/UmrahPackageTransportForm";

export const dynamic = "force-dynamic";

export default async function NewPackageTransportPage({ params }: any) {
  const { id } = params;

  const { data: pkg, error } = await supabase
    .from("umrah_packages")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !pkg) {
    return notFound();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <a
        href={`/umrah/packages/${id}/transports`}
        className="text-blue-600 text-sm"
      >
        &larr; Back to transports
      </a>

      <h1 className="text-xl font-bold">
        Add transport to: <span className="font-normal">{pkg.name}</span>
      </h1>

      <UmrahPackageTransportForm packageId={pkg.id} />
    </div>
  );
}
