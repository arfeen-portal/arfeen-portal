import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PackageCalculatorInline from '@/components/calculator/PackageCalculatorInline';

type PageProps = {
  params: { id: string };
};

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase env vars are missing');
  }

  return createClient(url, anonKey);
}

export default async function UmrahPackagePricingPage({ params }: PageProps) {
  const supabase = getSupabaseServer();

  // We only need a few columns that we are sure exist
  const { data: pkg, error } = await supabase
    .from('umrah_packages')
    .select('id, name, code')
    .eq('id', params.id)
    .single();

  if (error || !pkg) {
    console.error('Error loading package for pricing:', error);
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Package pricing</h1>
        <div className="text-xs text-gray-500">
          ID: <span className="font-mono">{pkg.id}</span>
        </div>
      </div>

      <PackageCalculatorInline pkg={pkg} />
    </div>
  );
}
