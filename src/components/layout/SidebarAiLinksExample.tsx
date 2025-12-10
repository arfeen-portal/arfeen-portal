'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/ai-umrah-planner', label: 'AI Umrah Planner (Public)' },
  { href: '/(dashboard)/ai/umrah-planner', label: 'AI Planner (Dashboard)' },
  { href: '/(dashboard)/ai/crowd-forecast', label: 'Crowd Forecast' },
  { href: '/(dashboard)/ai/assistant', label: 'AI Assistant Chat' },
  { href: '/(dashboard)/transport/agent-ai-booking', label: 'Agent AI – Transport' },
  { href: '/(dashboard)/hotels/agent-ai-booking', label: 'Agent AI – Hotels' },
  { href: '/(dashboard)/admin/ai-analytics', label: 'AI Analytics' },
  { href: '/(dashboard)/admin/ai-leads', label: 'AI Leads' }
];

export default function SidebarAiLinksExample() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen p-4 space-y-2">
      <h2 className="text-sm font-semibold mb-2">AI Modules (Example)</h2>
      <nav className="space-y-1 text-sm">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded ${
                active ? 'bg-slate-700' : 'hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
