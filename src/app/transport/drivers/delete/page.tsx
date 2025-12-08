// src/app/transport/drivers/delete/page.tsx

import { redirect } from "next/navigation";

export default function DriverDeletePage() {
  // Yahan future mein agar aap server action / API call se delete karna chahein
  // to wo logic add kar sakte hain.

  // Filhaal simple redirect, taki page ek valid module ho
  redirect("/transport/drivers");

  // Next.js redirect ke baad yahan tak nahi aata,
  // lekin type-safety ke liye ek fallback return likh dete hain.
  return null;
}
