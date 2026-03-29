import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Bypass the Web Lock mechanism — it causes "lock was stolen" errors when
      // two tabs (or a cached page + new deploy) initialize the client simultaneously.
      // Our app is a single SPA; there's no benefit to cross-tab session locking.
      lock: (_name, _timeout, fn) => fn(),
    },
  }
)
