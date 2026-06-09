import { requirePageRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function AccountantSecurityPage() {
  const user = await requirePageRole(["admin", "accountant"]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Accountant Protected Page
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Is page ko admin aur accountant access kar sakte hain.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="text-sm text-slate-500">Logged-in Role</div>
        <div className="mt-1 text-lg font-semibold text-slate-900">{user.role}</div>
      </div>
    </div>
  );
}