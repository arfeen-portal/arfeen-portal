// src/app/admin/bugs/page.tsx
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminBugsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">AI Bug Helper</h1>

      <p className="text-sm text-gray-600">
        Yahan se aap portal ke issues ka short description bhej sakte hain
        aur AI se likely cause + fix ka suggestion le sakte hain.
      </p>

      <p className="text-sm text-gray-600">
        Neeche wala button sirf example link hai, aap baad me isay real form
        ya page pe point kar sakte hain.
      </p>

      <Link
        href="#"
        className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
      >
        Open bug report tool
      </Link>
    </div>
  );
}
