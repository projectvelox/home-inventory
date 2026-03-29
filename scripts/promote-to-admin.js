/**
 * Promote Daddy Jo, Nene Ella, and Wowa Grace to admin role in the profiles table.
 * Run: node scripts/promote-to-admin.js
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    raw.split('\n').forEach(line => {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].trim()
    })
  } catch {}
}
loadEnv()

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const PROMOTE = [
  { label: 'Daddy Jo',   email: process.env.VITE_DADDYJO_EMAIL },
  { label: 'Nene Ella',  email: process.env.VITE_NENEELLA_EMAIL },
  { label: 'Wowa Grace', email: process.env.VITE_WOWAGRACE_EMAIL },
]

async function run() {
  // Sign in as admin to use their auth token
  const { data: { session }, error: loginErr } = await sb.auth.signInWithPassword({
    email:    process.env.VITE_WIFE_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
  })
  if (!session) { console.error('Login failed:', loginErr?.message); process.exit(1) }
  console.log(`🔐 Signed in as: ${session.user.email}\n`)

  for (const u of PROMOTE) {
    // Look up profile by email via auth (admin can see all users via profiles join)
    const { data: profile, error: fetchErr } = await sb
      .from('profiles')
      .select('id, display_name, role')
      .eq('email', u.email)
      .maybeSingle()

    if (fetchErr) {
      // profiles table may not have email column — look up via auth users list isn't available with anon key
      // Try updating by display_name match instead
      const { data: byName, error: nameErr } = await sb
        .from('profiles')
        .update({ role: 'admin' })
        .ilike('display_name', `%${u.label.split(' ')[1] ?? u.label}%`)
        .select('id, display_name, role')
      if (nameErr || !byName?.length) {
        console.error(`  ❌ Could not find "${u.label}": ${nameErr?.message ?? 'not found'}`)
      } else {
        console.log(`  ✅ Promoted "${byName[0].display_name}" → admin`)
      }
      continue
    }

    if (!profile) {
      console.log(`  ⏭  Profile not found for ${u.email} — they may not have signed in yet`)
      continue
    }

    if (profile.role === 'admin') {
      console.log(`  ✓  ${u.label} is already admin`)
      continue
    }

    const { error: upErr } = await sb
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id)

    if (upErr) {
      console.error(`  ❌ Failed to promote ${u.label}: ${upErr.message}`)
    } else {
      console.log(`  ✅ Promoted "${u.label}" (${u.email}) → admin`)
    }
  }

  await sb.auth.signOut()
  console.log('\n🎉 Done!')
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
