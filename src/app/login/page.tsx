"use client";

import { FormEvent, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  ArrowRight,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type UserRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "operations"
  | "agent"
  | "staff"
  | "driver";

type UserProfile = {
  id?: string;
  email?: string;
  role: UserRole;
  tenant_id?: string | null;
};

function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createBrowserClient(url, anonKey);
}

function getRedirectPath(role: UserRole, nextPath: string | null) {
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }

  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";

    case "accountant":
      return "/accounts";

    case "operations":
      return "/operations";

    case "agent":
      return "/agent/dashboard";

    default:
      return "/";
  }
}

export default function LoginPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      if (!supabase) {
        setError("Supabase client is not configured.");
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (loginError) {
        setError(loginError.message || "Login failed.");
        return;
      }

      if (!data.session?.access_token || !data.user?.email) {
        setError("Session was not created.");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      const profileRes = await fetch("/api/auth/login-profile", {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });

      const profileJson = await profileRes.json().catch(() => ({}));

      if (!profileRes.ok || !profileJson?.ok) {
        setError(profileJson?.error || "User profile could not be loaded.");
        return;
      }

      const profile = profileJson.user as UserProfile;

      if (!profile?.role) {
        setError("User role not found.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next");

      window.location.href = getRedirectPath(profile.role, nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        setError("Email address is required.");
        return;
      }

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          domain: window.location.hostname,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setError(json?.error || "Password reset request failed.");
        return;
      }

      setSuccess(
        "Password reset link sent. Please check your email and set a new password."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08111f] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-[#07101d] via-[#111d33] to-[#020617]" />
          <div className="absolute left-16 top-16 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute bottom-16 right-12 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between p-14">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
                  <Building2 size={24} />
                </div>

                <div>
                  <h1 className="text-xl font-black">Arfeen Travel Portal</h1>
                  <p className="text-sm text-slate-300">
                    B2B Umrah, Transport & Accounts ERP
                  </p>
                </div>
              </div>

              <div className="mt-24 max-w-xl">
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-amber-300">
                  Secure Portal Access
                </p>

                <h2 className="mt-5 text-5xl font-black leading-tight">
                  Separate, clean and professional login for every role.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-300">
                  Super admin, admin, accountant, operations and agents are
                  redirected to their own protected workspaces.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                ["Role Guarded", "Admin/Agent separation"],
                ["Private Data", "Tenant-wise filtering"],
                ["White Label", "Portal branding ready"],
              ].map((item) => (
                <div
                  key={item[0]}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <p className="font-bold">{item[0]}</p>
                  <p className="mt-2 text-sm text-slate-300">{item[1]}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <form
            onSubmit={mode === "login" ? handleLogin : handleForgotPassword}
            className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-8 text-slate-950 shadow-2xl"
          >
            <div className="mb-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                <ShieldCheck size={16} />
                {mode === "login" ? "Secure Portal Login" : "Password Recovery"}
              </div>

              <h1 className="text-3xl font-black">
                {mode === "login" ? "Welcome back" : "Forgot password?"}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {mode === "login"
                  ? "Login to continue to your Arfeen Travel workspace."
                  : "Enter your tenant registered email. We will send a secure reset link."}
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
                  Email Address
                </span>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                  <Mail size={18} className="text-slate-400" />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    className="h-12 w-full bg-transparent text-sm font-semibold outline-none"
                    placeholder="admin@arfeentravel.com"
                  />
                </div>
              </label>

              {mode === "login" ? (
                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="block text-sm font-bold text-slate-700">
                      Password
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setMode("forgot");
                      }}
                      className="text-xs font-black text-amber-600 hover:text-amber-700"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <Lock size={18} className="text-slate-400" />

                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      required
                      className="h-12 w-full bg-transparent text-sm font-semibold outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </label>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-60"
            >
              {busy
                ? mode === "login"
                  ? "Signing in..."
                  : "Sending reset link..."
                : mode === "login"
                  ? "Login to Portal"
                  : "Send Password Reset Link"}

              <ArrowRight size={18} />
            </button>

            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode("login");
                }}
                className="mt-4 w-full text-center text-sm font-bold text-slate-600 hover:text-slate-950"
              >
                Back to login
              </button>
            ) : null}

            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex gap-2 font-bold">
                <Sparkles size={16} />
                Protected role-based access.
              </div>

              <p className="mt-1 text-amber-800">
                Your portal will only show data and pages allowed for your role.
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}