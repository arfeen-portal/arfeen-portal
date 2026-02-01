'use client';

import AiLeadsCard from '@/components/dashboard/AiLeadsCard';

export default function AdminAiLeadsPage() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">AI Leads</h1>
      <p className="text-sm text-gray-500 mb-4">
        AI Umrah Planner aur public landing page se aane wali leads.
      </p>
      <AiLeadsCard />
    </div>
  );
}
