"use client";

import { useEffect, useState } from "react";
import { clientLogout } from "@/lib/auth/clientLogout";
import { supabaseClient } from '@/lib/supabaseClient';

import type { User } from "@supabase/supabase-js";
export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseClient;

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    await clientLogout();
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="text-sm px-3 py-1 border rounded-full hover:bg-gray-50"
      >
        Login
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
        {user.email}
      </span>
      <button
        onClick={handleLogout}
        className="px-3 py-1 border rounded-full hover:bg-gray-50"
      >
        Logout
      </button>
    </div>
  );
}
