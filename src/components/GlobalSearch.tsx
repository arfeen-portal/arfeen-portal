'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client';  // ⬅ relative path

export default function GlobalSearch() {
  const router = useRouter();
  const supabase = createClient();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from('global_search_index_v')
      .select('*')
      .ilike('label', `%${q}%`)
      .limit(20);

    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    setResults(data || []);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleClick = (item) => {
    if (item.entity_type === 'agent') {
      router.push(`/admin/agents/${item.id}`);
    } else if (item.entity_type === 'vehicle') {
      router.push(`/admin/vehicles/${item.id}`);
    } else if (item.entity_type === 'package') {
      router.push(`/umrah/packages/${item.id}`);
    } else if (item.entity_type === 'batch') {
      router.push(`/batches/${item.id}/summary`);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search agents, vehicles, packages, batches..."
        className="w-full border rounded-md px-3 py-2 text-sm"
      />
      {loading && (
        <div className="absolute right-3 top-2 text-xs text-gray-400">…</div>
      )}
      {results.length > 0 && (
        <div className="absolute mt-1 w-full bg-white border rounded-md shadow-sm max-h-80 overflow-auto z-20">
          {results.map((item) => (
            <button
              key={`${item.entity_type}-${item.id}`}
              type="button"
              onClick={() => handleClick(item)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between"
            >
              <span>
                <span className="font-medium">{item.label}</span>
                {item.extra && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({item.extra})
                  </span>
                )}
              </span>
              <span className="text-[10px] uppercase text-gray-400">
                {item.entity_type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
