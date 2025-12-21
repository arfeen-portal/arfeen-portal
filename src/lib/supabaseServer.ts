import { createClient } from '@supabase/supabase-js'

function getEnv(name: string) {
  const v = process.env[name]
  return v && v.length > 0 ? v : null
}

// ✅ Server-only (service role) client — BUT build-safe
export function getSupabaseServerClient() {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  // ❗ build time pe throw mat karo — null return karo
  if (!url || !serviceKey) return null

  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}

// ✅ Compatible name (tumhare purane imports na tootain)
export function createSupabaseServerClient() {
  return getSupabaseServerClient()
}
