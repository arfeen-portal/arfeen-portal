// src/app/login/LoginCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    // IMPORTANT: make the server see the new cookie
    router.refresh();
    router.push("/admin/dashboard");
  }

  return (
    <form onSubmit={onLogin} style={{ maxWidth: 360 }}>
      <h3>Supplier Login</h3>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        required
      />
      <input
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="Password"
        type="password"
        required
      />
      <button type="submit">Login</button>
      {msg && <p style={{ color: "red" }}>{msg}</p>}
    </form>
  );
}
