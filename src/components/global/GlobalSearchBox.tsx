// src/components/global/GlobalSearchBox.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SEARCH_ROUTES } from '@/config/searchRoutes';

export function GlobalSearchBox() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return SEARCH_ROUTES.filter((route) => {
      const label = route.label.toLowerCase();
      const path = route.path.toLowerCase();
      const keywords = (route.keywords || []).join(' ').toLowerCase();

      return (
        label.includes(q) ||
        path.includes(q) ||
        keywords.includes(q)
      );
    }).slice(0, 8);
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(path);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[0]) {
      handleSelect(results[0].path);
    }
  };

  return (
    <div className="relative w-full max-w-xs">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query) setIsOpen(true);
          }}
          placeholder="Search modules… (e.g. agents, tickets)"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-64 overflow-y-auto text-sm">
            {results.map((route) => (
              <li
                key={route.path}
                className="cursor-pointer px-3 py-2 hover:bg-slate-100"
                onMouseDown={(e) => {
                  // onBlur se pehle click handle ho jaye
                  e.preventDefault();
                  handleSelect(route.path);
                }}
              >
                <div className="font-medium">{route.label}</div>
                <div className="text-xs text-slate-500">{route.path}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
