// src/lib/supabaseAdminSafe.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdminSafe = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);
