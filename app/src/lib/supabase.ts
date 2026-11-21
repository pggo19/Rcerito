import { createClient } from '@supabase/supabase-js'

// Proyecto Supabase propio de Rcerito (independiente de R0).
// La clave publicable es pública por diseño: la seguridad la dan las políticas RLS.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://aoqgwvrdhsiezjvandun.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_dRjmfgT4_7qQGoToBS-yKQ_cB_N0Mnd'

export const supabase = createClient(url, key, {
  auth: { persistSession: true, storageKey: 'rcerito-auth' },
})
