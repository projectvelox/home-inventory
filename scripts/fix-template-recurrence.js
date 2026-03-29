/**
 * One-time fix: set recur_type on the 4 seeded task templates.
 * Run: node scripts/fix-template-recurrence.js
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

const FIXES = [
  { name: 'Daily Household Chores',       recur_type: 'daily'  },
  { name: 'Weekly Deep Clean',            recur_type: 'weekly' },
  { name: 'Daily Baby Care (2-Month-Old)',  recur_type: 'daily'  },
  { name: 'Weekly Baby Care (2-Month-Old)', recur_type: 'weekly' },
]

async function run() {
  const { data: { session }, error: loginErr } = await sb.auth.signInWithPassword({
    email:    process.env.VITE_WIFE_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
  })
  if (!session) { console.error('Login failed:', loginErr?.message); process.exit(1) }
  console.log(`🔐 Signed in as: ${session.user.email}\n`)

  for (const fix of FIXES) {
    const { data, error } = await sb
      .from('task_templates')
      .update({ recur_type: fix.recur_type })
      .eq('name', fix.name)
      .select('id, name, recur_type')

    if (error) {
      console.error(`  ❌ Failed to update "${fix.name}":`, error.message)
    } else if (!data?.length) {
      console.log(`  ⏭  Not found — "${fix.name}"`)
    } else {
      console.log(`  ✅ Set recur_type=${fix.recur_type} on "${fix.name}"`)
    }
  }

  await sb.auth.signOut()
  console.log('\n🎉 Done!')
}

run().catch(e => { console.error('Fatal:', e); process.exit(1) })
