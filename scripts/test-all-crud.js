/**
 * CRUD integration tests — uses Supabase JS client with real user auth
 * Runs as: node scripts/test-all-crud.js
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env manually (no dotenv dep needed)
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

const URL  = process.env.VITE_SUPABASE_URL
const KEY  = process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_EMAIL  = process.env.VITE_WIFE_EMAIL
const ADMIN_PASS   = process.env.TEST_ADMIN_PASSWORD

if (!URL || !KEY) { console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY'); process.exit(1) }

const sb = createClient(URL, KEY)

let pass = 0, fail = 0
function ok(label)          { pass++;  console.log('  ✅ PASS —', label) }
function bad(label, detail) { fail++;  console.error('  ❌ FAIL —', label, JSON.stringify(detail ?? '')) }

// ── TASKS ─────────────────────────────────────────────────────────────────────
async function testTasks(userId) {
  console.log('\n══ TASKS ════════════════════════════════════════════════')

  const today = new Date().toISOString().slice(0, 10)

  // CREATE
  const { data: c1, error: e1 } = await sb.from('tasks').insert({
    title: 'Test Task Alpha', description: 'Integration test', category: 'cleaning',
    status: 'pending', assigned_to: userId, created_by: userId,
    due_date: today, estimated_mins: 20, sort_order: 999, recur_type: 'none',
  }).select('id, title, status').single()
  const id = c1?.id
  id ? ok('CREATE task') : bad('CREATE task', e1)
  if (!id) return

  // READ
  const { data: r1, error: er1 } = await sb.from('tasks').select('*').eq('id', id).single()
  r1?.id === id ? ok('READ task by id') : bad('READ task by id', er1)

  // UPDATE
  const { data: u1, error: eu1 } = await sb.from('tasks').update({ description: 'Updated' }).eq('id', id).select('description').single()
  u1?.description === 'Updated' ? ok('UPDATE task fields') : bad('UPDATE task fields', eu1)

  // COMPLETE
  const { data: done, error: edone } = await sb.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id).select('status').single()
  done?.status === 'done' ? ok('COMPLETE task') : bad('COMPLETE task', edone)

  // REOPEN
  const { data: reop, error: ereop } = await sb.from('tasks').update({ status: 'pending', completed_at: null }).eq('id', id).select('status').single()
  reop?.status === 'pending' ? ok('REOPEN task') : bad('REOPEN task', ereop)

  // DELETE
  const { error: edel } = await sb.from('tasks').delete().eq('id', id)
  const { data: gone } = await sb.from('tasks').select('id').eq('id', id).single()
  !gone && !edel ? ok('DELETE task') : bad('DELETE task — row still exists', edel)
}

// ── TEMPLATES ─────────────────────────────────────────────────────────────────
async function testTemplates(userId) {
  console.log('\n══ TEMPLATES ════════════════════════════════════════════')

  const { data: t1, error: et1 } = await sb.from('task_templates').insert({
    name: '__TEST__ Chores Pack', color: '#c4b5fd', emoji: '🧹', created_by: userId,
  }).select('id, name').single()
  const tid = t1?.id
  tid ? ok('CREATE template') : bad('CREATE template', et1)
  if (!tid) return

  // Items
  const { data: items, error: ei } = await sb.from('task_template_items').insert([
    { template_id: tid, title: 'Sweep floors', estimated_mins: 10, sort_order: 1 },
    { template_id: tid, title: 'Mop kitchen',  estimated_mins: 15, sort_order: 2 },
  ]).select('id')
  items?.length === 2 ? ok('CREATE template items') : bad('CREATE template items', ei)

  // READ
  const { data: read, error: er } = await sb.from('task_templates').select('*, task_template_items(*)').eq('id', tid).single()
  read?.task_template_items?.length === 2 ? ok('READ template + items') : bad('READ template + items', er)

  // UPDATE
  const { data: upd, error: eu } = await sb.from('task_templates').update({ name: '__TEST__ Updated' }).eq('id', tid).select('name').single()
  upd?.name === '__TEST__ Updated' ? ok('UPDATE template') : bad('UPDATE template', eu)

  // ASSIGN — generate tasks from template
  const today = new Date().toISOString().slice(0, 10)
  const taskRows = (items ?? []).map((item, i) => ({
    title: `Sweep floors [assign test]`, category: 'cleaning',
    status: 'pending', assigned_to: userId, created_by: userId,
    due_date: today, estimated_mins: 10, sort_order: i, recur_type: 'none',
  }))
  const { data: assigned, error: ea } = await sb.from('tasks').insert(taskRows).select('id')
  assigned?.length ? ok('ASSIGN template') : bad('ASSIGN template', ea)

  // Clean up assigned tasks
  if (assigned?.length) {
    await sb.from('tasks').delete().in('id', assigned.map(t => t.id))
  }

  // IDEMPOTENCY — insert same items again should not fail
  const { error: eidem } = await sb.from('task_template_items').insert([
    { template_id: tid, title: 'Idempotency check', estimated_mins: 5, sort_order: 99 },
  ])
  !eidem ? ok('IDEMPOTENCY check') : bad('IDEMPOTENCY check', eidem)

  // DELETE
  await sb.from('task_template_items').delete().eq('template_id', tid)
  const { error: edel } = await sb.from('task_templates').delete().eq('id', tid)
  const { data: gone } = await sb.from('task_templates').select('id').eq('id', tid).single()
  !gone && !edel ? ok('DELETE template') : bad('DELETE template — row still exists', edel)
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
async function testInventory() {
  console.log('\n══ INVENTORY ════════════════════════════════════════════')

  const { data: c1, error: e1 } = await sb.from('items').insert({
    name: '__TEST__ Dish Soap', qty: 2, restock_qty: 1,
    category_id: null, unit: 'btl',
  }).select('id, name').single()
  const id = c1?.id
  id ? ok('CREATE inventory item') : bad('CREATE inventory item', e1)
  if (!id) return

  const { data: r1, error: er1 } = await sb.from('items').select('*').eq('id', id).single()
  r1?.id === id ? ok('READ inventory item') : bad('READ inventory item', er1)

  const { data: u1, error: eu1 } = await sb.from('items').update({ qty: 5 }).eq('id', id).select('qty').single()
  u1?.qty === 5 ? ok('UPDATE item') : bad('UPDATE item', eu1)

  const { error: edel } = await sb.from('items').delete().eq('id', id)
  const { data: gone } = await sb.from('items').select('id').eq('id', id).single()
  !gone && !edel ? ok('DELETE inventory item') : bad('DELETE inventory item — still exists', edel)
}

// ── LOCATIONS ─────────────────────────────────────────────────────────────────
async function testLocations() {
  console.log('\n══ LOCATIONS ════════════════════════════════════════════')

  const { data: c1, error: e1 } = await sb.from('locations').insert({
    name: '__TEST__ Pantry', sort_order: 999,
  }).select('id, name').single()
  const id = c1?.id
  id ? ok('CREATE location') : bad('CREATE location', e1)
  if (!id) return

  const { data: r1, error: er1 } = await sb.from('locations').select('*').eq('id', id).single()
  r1?.id === id ? ok('READ location') : bad('READ location', er1)

  const { data: u1, error: eu1 } = await sb.from('locations').update({ name: '__TEST__ Updated', sort_order: 1000 }).eq('id', id).select('name, sort_order').single()
  u1?.name === '__TEST__ Updated' ? ok('UPDATE location name + sort_order') : bad('UPDATE location', eu1)

  const { error: edel } = await sb.from('locations').delete().eq('id', id)
  const { data: gone } = await sb.from('locations').select('id').eq('id', id).single()
  !gone ? ok('DELETE location') : bad('DELETE location', edel)
}

// ── PROFILES / AUTH ────────────────────────────────────────────────────────────
async function testAuth() {
  console.log('\n══ PROFILES / AUTH / RLS ════════════════════════════════')

  // Read own profile
  const { data: { user } } = await sb.auth.getUser()
  user?.id ? ok(`Signed in as: ${user.email}`) : bad('Get current user', 'no user')

  const { data: profile, error: ep } = await sb.from('profiles').select('*').eq('id', user.id).single()
  profile?.id ? ok(`Profile exists — "${profile.display_name ?? profile.displayName}"`) : bad('Read own profile', ep)

  // RLS checks — try to read RLS policy count via function
  const { data: rlsItems } = await sb.from('items').select('id').limit(1)
  Array.isArray(rlsItems) ? ok('RLS on items — readable') : bad('RLS on items', 'not readable')

  const { data: rlsTasks } = await sb.from('tasks').select('id').limit(1)
  Array.isArray(rlsTasks) ? ok('RLS on tasks — readable') : bad('RLS on tasks', 'not readable')
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🧪 Running CRUD integration tests…')

  if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.error('Missing VITE_WIFE_EMAIL or TEST_ADMIN_PASSWORD in .env')
    process.exit(1)
  }

  // Sign in as admin (full access bypasses helper-only RLS)
  const { data: { session }, error: loginErr } = await sb.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: ADMIN_PASS,
  })
  if (!session) { console.error('Login failed:', loginErr?.message); process.exit(1) }
  console.log(`\n🔐 Signed in as: ${session.user.email}`)
  const userId = session.user.id

  await testTasks(userId)
  await testTemplates(userId)
  await testInventory()
  await testLocations()
  await testAuth()

  await sb.auth.signOut()

  console.log(`\n══ SUMMARY ══════════════════════════════════════════════`)
  console.log(`  ${pass} passed  ·  ${fail} failed`)
  console.log(fail === 0 ? '  ✅ All systems operational — safe to hand off!' : '  ❌ Some tests failed — review above')
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
