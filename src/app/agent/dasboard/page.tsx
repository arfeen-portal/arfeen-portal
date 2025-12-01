'use client';

import { useEffect, useState } from 'react';

export default function AgentDashboardPage() {
  // TODO: yahan real agentId auth se lo
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const agentId = '00000000-0000-0000-0000-000000000000'; // temp
      const res = await fetch(`/api/agents/wallet-summary?agentId=${agentId}`);
      const json = await res.json();
      if (res.ok) setBalance(json.balance);
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Wallet Balance"
          value={
            balance === null ? '—' : `${balance.toLocaleString('en-US')} SAR`
          }
        />
        <Card title="Bookings" value="Coming soon" />
        <Card title="Training" value="Umrah Business Classroom →" href="/training" />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href?: string;
}) {
  const Component: any = href ? 'a' : 'div';
  return (
    <Component
      href={href}
      className="bg-white rounded-xl shadow-sm px-4 py-3 flex flex-col justify-between hover:shadow-md transition text-xs"
    >
      <span className="text-gray-500">{title}</span>
      <span className="text-lg font-semibold mt-1">{value}</span>
    </Component>
  );
}
