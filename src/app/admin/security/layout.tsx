import { redirect } from "next/navigation";
import { getRequestUser } from "@/lib/auth/getRequestUser";

export default async function AdminSecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getRequestUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}