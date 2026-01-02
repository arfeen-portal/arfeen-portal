"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    await supabase.auth.signOut();
    router.push("/login");
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
