'use client';

import React from 'react';

export default function AccountsHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Accounting</h1>
        <p className="text-sm text-muted-foreground">
          Invoices, ledgers and financial reports for Arfeen Travel portal.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          title="Invoices"
          description="View, print and download invoices generated from bookings."
          href="/accounts/invoices"
        />
        <Card
          title="Trial Balance"
          description="(Future) Accounting reports from chart of accounts."
          href="#"
          disabled
        />
        <Card
          title="Agent Statements"
          description="(Future) Agent-wise statement & aging report."
          href="#"
          disabled
        />
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  href,
  disabled,
}: {
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  const className =
    'border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between';

  if (disabled) {
    return (
      <div className={className + ' opacity-60'}>
        <div>
          <h2 className="text-sm font-semibold mb-1">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="mt-3 text-[11px] text-muted-foreground">
          Coming soon
        </span>
      </div>
    );
  }

  return (
    <a href={href} className={className + ' hover:shadow-md transition-shadow'}>
      <div>
        <h2 className="text-sm font-semibold mb-1">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="mt-3 text-[11px] text-blue-600 font-semibold">
        Open
      </span>
    </a>
  );
}
