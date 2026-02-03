"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    router.refresh();
    router.push("/admin/dashboard");
  }

  return (
    <form onSubmit={onLogin} className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />

      <input
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="Password"
        required
      />

      <button type="submit">Login</button>

      {msg && <p className="text-red-600">{msg}</p>}
    </form>
  );
}
