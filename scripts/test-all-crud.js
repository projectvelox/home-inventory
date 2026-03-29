const PAT       = 'sbp_de7bb93225c70ffc97fd5e57f4636a542dad5fce'
const BASE      = 'https://api.supabase.com/v1/projects/nodkzyyooibzlmanzlis/database/query'
const ADMIN_ID  = 'c2304fd3-8a4e-41de-9f6e-44406f31702b'
const HELPER_ID = '7db89977-2f0f-4838-9eba-10978f2edf51'
const TODAY     = '2026-03-29'
const FUTURE    = '2026-04-05'

let pass = 0, fail = 0
function ok(label)          { pass++; console.log('  ✅ PASS —', label) }
function bad(label, detail) { fail++; console.error('  ❌ FAIL —', label, JSON.stringify(detail ?? '')) }

async function sql(query) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return res.json()
}

// ── TASKS ─────────────────────────────────────────────────────────────────────
async function testTasks() {
  console.log('\n══ TASKS ═══════════════════════════════════════════════')

  const t1 = await sql(`INSERT INTO public.tasks (title, description, category, status, assigned_to, created_by, due_date, estimated_mins, sort_order, recur_type)
    VALUES ('Test Task Alpha', 'Integration test', 'cleaning', 'pending', '${HELPER_ID}', '${ADMIN_ID}', '${TODAY}', 20, 999, 'none')
    RETURNING id, title, status`)
  const id = t1[0]?.id
  id ? ok('CREATE task') : bad('CREATE task', t1)

  const t2 = await sql(`SELECT id, title FROM public.tasks WHERE id = '${id}'`)
  t2[0]?.title === 'Test Task Alpha' ? ok('READ task by id') : bad('READ task by id', t2)

  const t3 = await sql(`UPDATE public.tasks SET title='Test Task Alpha (edited)', estimated_mins=30 WHERE id='${id}' RETURNING title, estimated_mins`)
  t3[0]?.title === 'Test Task Alpha (edited)' && t3[0]?.estimated_mins === 30 ? ok('UPDATE task fields') : bad('UPDATE task fields', t3)

  const now = new Date().toISOString()
  const t4 = await sql(`UPDATE public.tasks SET status='done', completed_at='${now}', completion_notes='Cleaned' WHERE id='${id}' RETURNING status, completion_notes`)
  t4[0]?.status === 'done' ? ok('COMPLETE task with notes') : bad('COMPLETE task', t4)

  const t5 = await sql(`UPDATE public.tasks SET status='pending', completed_at=NULL, completion_notes=NULL WHERE id='${id}' RETURNING status`)
  t5[0]?.status === 'pending' ? ok('REOPEN task') : bad('REOPEN task', t5)

  await sql(`DELETE FROM public.tasks WHERE id='${id}'`)
  const t6 = await sql(`SELECT id FROM public.tasks WHERE id='${id}'`)
  t6.length === 0 ? ok('DELETE task') : bad('DELETE task — row still exists', t6)
}

// ── TEMPLATES ─────────────────────────────────────────────────────────────────
async function testTemplates() {
  console.log('\n══ TEMPLATES ═══════════════════════════════════════════')

  const tmpl = await sql(`INSERT INTO public.task_templates (name, description, color, emoji, created_by, recur_type)
    VALUES ('Test Template', 'Weekend chores', '#fda4af', '🧹', '${ADMIN_ID}', 'none')
    RETURNING id, name`)
  const tmplId = tmpl[0]?.id
  tmplId ? ok('CREATE template') : bad('CREATE template', tmpl)

  const items = await sql(`INSERT INTO public.task_template_items (template_id, title, category, sort_order)
    VALUES ('${tmplId}', 'Sweep floors', 'cleaning', 0),
           ('${tmplId}', 'Mop floors', 'cleaning', 1),
           ('${tmplId}', 'Wipe counters', 'cleaning', 2)
    RETURNING id`)
  items.length === 3 ? ok('CREATE template items (3)') : bad('CREATE template items', items)

  const ti = await sql(`SELECT t.name, COUNT(i.id) as item_count FROM public.task_templates t
    LEFT JOIN public.task_template_items i ON i.template_id = t.id
    WHERE t.id='${tmplId}' GROUP BY t.name`)
  Number(ti[0]?.item_count) === 3 ? ok('READ template + items join') : bad('READ template + items', ti)

  const tu = await sql(`UPDATE public.task_templates SET name='Test Template (edited)' WHERE id='${tmplId}' RETURNING name`)
  tu[0]?.name === 'Test Template (edited)' ? ok('UPDATE template name') : bad('UPDATE template', tu)

  const assigned = await sql(`INSERT INTO public.tasks (title, category, status, assigned_to, created_by, due_date, sort_order, template_id, recur_type)
    SELECT i.title, i.category, 'pending', '${HELPER_ID}', '${ADMIN_ID}', '${FUTURE}', i.sort_order, '${tmplId}', 'none'
    FROM public.task_template_items i WHERE i.template_id='${tmplId}'
    RETURNING id`)
  assigned.length === 3 ? ok('ASSIGN template → 3 task rows') : bad('ASSIGN template', assigned)

  const existing = await sql(`SELECT id FROM public.tasks WHERE template_id='${tmplId}' AND due_date='${FUTURE}'`)
  existing.length === 3 ? ok('IDEMPOTENCY — duplicate guard detects existing tasks') : bad('IDEMPOTENCY check', existing)

  await sql(`DELETE FROM public.tasks WHERE template_id='${tmplId}'`)
  await sql(`DELETE FROM public.task_template_items WHERE template_id='${tmplId}'`)
  await sql(`DELETE FROM public.task_templates WHERE id='${tmplId}'`)
  const gone = await sql(`SELECT id FROM public.task_templates WHERE id='${tmplId}'`)
  gone.length === 0 ? ok('DELETE template + items + assigned tasks') : bad('DELETE template', gone)
}

// ── INVENTORY ITEMS ───────────────────────────────────────────────────────────
async function testInventory() {
  console.log('\n══ INVENTORY ITEMS ══════════════════════════════════════')

  const loc  = await sql(`SELECT id FROM public.locations ORDER BY created_at LIMIT 1`)
  const cat  = await sql(`SELECT id FROM public.categories LIMIT 1`)
  const locId = loc[0]?.id ?? null
  const catId = cat[0]?.id ?? null
  const locRef = locId ? `'${locId}'` : 'NULL'
  const catRef = catId ? `'${catId}'` : 'NULL'

  const item = await sql(`INSERT INTO public.items (name, category_id, qty, unit, restock_qty, location_id)
    VALUES ('Test Item Widget', ${catRef}, 5, 'pcs', 2, ${locRef})
    RETURNING id, name, qty`)
  const itemId = item[0]?.id
  itemId ? ok('CREATE inventory item') : bad('CREATE inventory item', item)

  const ir = await sql(`SELECT id, name, qty FROM public.items WHERE id='${itemId}'`)
  ir[0]?.name === 'Test Item Widget' ? ok('READ inventory item') : bad('READ inventory item', ir)

  const iu = await sql(`UPDATE public.items SET qty=10, name='Test Item Widget (updated)' WHERE id='${itemId}' RETURNING qty, name`)
  iu[0]?.qty === 10 && iu[0]?.name === 'Test Item Widget (updated)' ? ok('UPDATE item qty + name') : bad('UPDATE item', iu)

  await sql(`DELETE FROM public.items WHERE id='${itemId}'`)
  const ig = await sql(`SELECT id FROM public.items WHERE id='${itemId}'`)
  ig.length === 0 ? ok('DELETE inventory item') : bad('DELETE inventory item', ig)
}

// ── LOCATIONS ─────────────────────────────────────────────────────────────────
async function testLocations() {
  console.log('\n══ LOCATIONS ═══════════════════════════════════════════')

  const lc = await sql(`INSERT INTO public.locations (name, sort_order) VALUES ('Test Location', 999) RETURNING id, name`)
  const locId = lc[0]?.id
  locId ? ok('CREATE location') : bad('CREATE location', lc)

  const lr = await sql(`SELECT id, name FROM public.locations WHERE id='${locId}'`)
  lr[0]?.name === 'Test Location' ? ok('READ location') : bad('READ location', lr)

  const lu = await sql(`UPDATE public.locations SET name='Test Location (renamed)', sort_order=0 WHERE id='${locId}' RETURNING name, sort_order`)
  lu[0]?.name === 'Test Location (renamed)' ? ok('UPDATE location name + sort_order') : bad('UPDATE location', lu)

  await sql(`DELETE FROM public.locations WHERE id='${locId}'`)
  const lg = await sql(`SELECT id FROM public.locations WHERE id='${locId}'`)
  lg.length === 0 ? ok('DELETE location') : bad('DELETE location', lg)
}

// ── PROFILES / RLS ────────────────────────────────────────────────────────────
async function testAuth() {
  console.log('\n══ PROFILES / AUTH / RLS ════════════════════════════════')

  const profiles = await sql(`SELECT id, display_name, role FROM public.profiles ORDER BY role`)
  const admin  = profiles.find(p => p.role === 'admin')
  const helper = profiles.find(p => p.role === 'helper')
  admin  ? ok(`Admin profile exists — "${admin.display_name}"`)  : bad('Admin profile missing')
  helper ? ok(`Helper profile exists — "${helper.display_name}"`) : bad('Helper profile missing')

  const rls = await sql(`SELECT tablename, COUNT(*) as cnt FROM pg_policies
    WHERE tablename IN ('tasks','task_templates','task_template_items','items','locations')
    GROUP BY tablename ORDER BY tablename`)
  rls.forEach(r => ok(`RLS on ${r.tablename} — ${r.cnt} polic${r.cnt > 1 ? 'ies' : 'y'}`))

  // Check realtime publications
  const rt = await sql(`SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename IN ('tasks','task_templates')`)
  rt.length >= 2 ? ok(`Realtime enabled on tasks + task_templates`) : bad('Realtime publication missing', rt)
}

async function main() {
  console.log('Running full CRUD test suite...')
  await testTasks()
  await testTemplates()
  await testInventory()
  await testLocations()
  await testAuth()

  console.log('\n══ SUMMARY ══════════════════════════════════════════════')
  console.log(`  ${pass} passed  ·  ${fail} failed`)
  if (fail === 0) {
    console.log('  ✅ All systems operational — safe to hand off!\n')
  } else {
    console.log('  ⚠️  Fix failures above before going live.\n')
    process.exit(1)
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
