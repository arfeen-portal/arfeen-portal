"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function prepareSession() {
      try {
        if (!supabase) {
          setError("Supabase client is not configured.");
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setError(exchangeError.message || "Reset link is invalid or expired.");
            return;
          }
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          setError("Reset session not found. Please request a new reset link.");
          return;
        }

        setReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    }

    prepareSession();
  }, [supabase]);

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (!supabase) {
        setError("Supabase client is not configured.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || "Password update failed.");
        return;
      }

      setSuccess("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08111f] px-5 py-10 text-white">
      <form
        onSubmit={handleReset}
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-8 text-slate-950 shadow-2xl"
      >
        <div className="mb-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            <ShieldCheck size={16} />
            Secure Password Reset
          </div>

          <h1 className="text-3xl font-black">Set new password</h1>

          <p className="mt-2 text-sm text-slate-500">
            Create a new password for your portal account.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              New Password
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Lock size={18} className="text-slate-400" />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                disabled={!ready}
                className="h-12 w-full bg-transparent text-sm font-semibold outline-none disabled:opacity-60"
                placeholder="Minimum 8 characters"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Confirm Password
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Lock size={18} className="text-slate-400" />

              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
                disabled={!ready}
                className="h-12 w-full bg-transparent text-sm font-semibold outline-none disabled:opacity-60"
                placeholder="Confirm password"
              />
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={busy || !ready}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-60"
        >
          {busy ? "Updating..." : "Update Password"}
          <ArrowRight size={18} />
        </button>
      </form>
    </main>
  );
}