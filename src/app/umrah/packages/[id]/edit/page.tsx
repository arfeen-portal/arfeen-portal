// src/app/umrah/packages/[id]/edit/page.tsx

import { supabase } from "@/lib/supabaseClient";
import UmrahPackageForm from "@/components/umrah/UmrahPackageForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditUmrahPackagePage({ params }: any) {
  const { id } = params;

  const { data, error } = await supabase
    .from("umrah_packages")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <a href="/umrah/packages" className="text-blue-600">
        &larr; Back to packages
      </a>

      <h1 className="text-2xl font-bold mt-4 mb-4">Edit Umrah Package</h1>

      <UmrahPackageForm existing={data} />
    </div>
  );
}
