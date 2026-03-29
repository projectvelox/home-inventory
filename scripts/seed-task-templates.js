/**
 * Seed task templates for Ate Lea:
 *  - Daily Household Chores (Filipino home)
 *  - Weekly Deep Clean
 *  - Baby Care Daily (newborn ~2 months)
 *
 * Run: node scripts/seed-task-templates.js
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

// ── Template definitions ─────────────────────────────────────────────────────
const TEMPLATES = [
  // ─── 1. Daily Household Chores ────────────────────────────────────────────
  {
    name: 'Daily Household Chores',
    description: 'Everyday cleaning and tidying for the whole house',
    color: '#34d399',   // mint
    emoji: '🧹',
    items: [
      { title: 'Mag-walis ng lahat ng kwarto at sala (sweep all rooms)',   category: 'cleaning', estimated_mins: 20, sort_order: 1 },
      { title: 'Mag-mop ng kitchen at comfort room floors',               category: 'cleaning', estimated_mins: 15, sort_order: 2 },
      { title: 'Hugasan ang mga pinggan at cooking utensils',             category: 'cooking',  estimated_mins: 20, sort_order: 3 },
      { title: 'Punasan ang countertop, stovetop, at dining table',       category: 'cleaning', estimated_mins: 10, sort_order: 4 },
      { title: 'Linisin ang CR sink, faucet, at toilet bowl',             category: 'cleaning', estimated_mins: 15, sort_order: 5 },
      { title: 'Basain ang trash bins at palitan ng bag',                 category: 'cleaning', estimated_mins: 5,  sort_order: 6 },
      { title: 'I-fold at i-ayos ang mga damit na natuyo',                category: 'laundry',  estimated_mins: 15, sort_order: 7 },
      { title: 'Punasan ang mga light switches at door handles',          category: 'cleaning', estimated_mins: 5,  sort_order: 8 },
      { title: 'I-vacuum o mag-walis ng sala furniture',                  category: 'cleaning', estimated_mins: 10, sort_order: 9 },
      { title: 'Ayusin ang mga gamit sa sala at silid',                   category: 'other',    estimated_mins: 10, sort_order: 10 },
    ],
  },

  // ─── 2. Weekly Deep Clean ─────────────────────────────────────────────────
  {
    name: 'Weekly Deep Clean',
    description: 'Thorough weekly cleaning of the whole house',
    color: '#60a5fa',   // blue
    emoji: '🪣',
    items: [
      { title: 'Deep clean CR — floor tiles, toilet, shower area, mirror', category: 'cleaning',  estimated_mins: 30, sort_order: 1 },
      { title: 'Banlawan ang mga floor rugs at doormat',                  category: 'laundry',   estimated_mins: 20, sort_order: 2 },
      { title: 'Palitan ng bagong sheet at unan cover ang lahat ng higaan', category: 'laundry', estimated_mins: 20, sort_order: 3 },
      { title: 'Punasan ang loob ng ref at ayusin ang pagkain',           category: 'cleaning',  estimated_mins: 20, sort_order: 4 },
      { title: 'Linisin ang loob ng microwave at toaster oven',           category: 'cleaning',  estimated_mins: 15, sort_order: 5 },
      { title: 'Punasan ang lahat ng cabinet doors at shelves',           category: 'cleaning',  estimated_mins: 20, sort_order: 6 },
      { title: 'Mag-mop ng lahat ng floor areas',                         category: 'cleaning',  estimated_mins: 25, sort_order: 7 },
      { title: 'Punasan ang mga bintana at glass doors',                  category: 'cleaning',  estimated_mins: 20, sort_order: 8 },
      { title: 'Linisin ang mga basurahan at i-disinfect',                category: 'cleaning',  estimated_mins: 10, sort_order: 9 },
      { title: 'Mag-ayos ng linen closet at storage areas',               category: 'other', estimated_mins: 15, sort_order: 10 },
      { title: 'I-check ang pantry at grocery list (what needs restocking)', category: 'other', estimated_mins: 10, sort_order: 11 },
      { title: 'Linisin ang lababo at drainage',                          category: 'cleaning',  estimated_mins: 10, sort_order: 12 },
    ],
  },

  // ─── 3. Daily Baby Care ───────────────────────────────────────────────────
  {
    name: 'Daily Baby Care (2-Month-Old)',
    description: 'Newborn care routine — sterilizing, feeding prep, and keeping baby\'s area clean',
    color: '#f9a8d4',   // blush/pink
    emoji: '👶',
    items: [
      { title: 'I-sterilize ang lahat ng baby bottles at pacifiers',       category: 'other',  estimated_mins: 20, sort_order: 1 },
      { title: 'I-clean at i-sterilize ang breast pump parts',             category: 'other',  estimated_mins: 15, sort_order: 2 },
      { title: 'Ihanda ang nursing station (tubig, snacks para kay Mommy)', category: 'other',  estimated_mins: 5,  sort_order: 3 },
      { title: 'Linisin at i-disinfect ang baby changing station',         category: 'other',  estimated_mins: 10, sort_order: 4 },
      { title: 'I-replenish ang diapers, wipes, at alcohol sa changing area', category: 'other', estimated_mins: 5, sort_order: 5 },
      { title: 'Punasan ang baby crib rails at tabi',                      category: 'other',  estimated_mins: 5,  sort_order: 6 },
      { title: 'Mag-laba ng baby clothes at burp cloths',                  category: 'laundry',    estimated_mins: 15, sort_order: 7 },
      { title: 'I-fold at i-ayos ang baby clothes sa drawer',              category: 'laundry',    estimated_mins: 10, sort_order: 8 },
      { title: 'Ihanda ang bath supplies para sa baby bath',               category: 'other',  estimated_mins: 10, sort_order: 9 },
      { title: 'I-sanitize ang baby toys at teethers (kahit hindi pa ginagamit)', category: 'other', estimated_mins: 10, sort_order: 10 },
    ],
  },

  // ─── 4. Weekly Baby Care ──────────────────────────────────────────────────
  {
    name: 'Weekly Baby Care (2-Month-Old)',
    description: 'Weekly deeper baby care — crib sheets, stock check, and organization',
    color: '#c4b5fd',   // lavender
    emoji: '🍼',
    items: [
      { title: 'Palitan ng crib sheet at changing pad cover',              category: 'other',  estimated_mins: 15, sort_order: 1 },
      { title: 'I-check at i-restock ang baby essentials (diapers, wipes, formula/breastmilk bags)', category: 'other', estimated_mins: 10, sort_order: 2 },
      { title: 'I-organize ang baby drawer — sorted by size at type',      category: 'other', estimated_mins: 15, sort_order: 3 },
      { title: 'Deep clean baby crib at bassinet',                         category: 'other',  estimated_mins: 20, sort_order: 4 },
      { title: 'Linisin ang baby swing, bouncer, at play mat',             category: 'other',  estimated_mins: 15, sort_order: 5 },
      { title: 'I-wash ang baby blankets at swaddle cloths',               category: 'laundry',    estimated_mins: 20, sort_order: 6 },
      { title: 'I-check ang baby medicine cabinet (nasal aspirator, thermometer, gripe water, etc.)', category: 'other', estimated_mins: 10, sort_order: 7 },
      { title: 'Linisin ang nursing pillow cover',                         category: 'laundry',    estimated_mins: 10, sort_order: 8 },
      { title: 'Mag-prepare ng bag for pedia visit or outing (kung may lakad)', category: 'other', estimated_mins: 15, sort_order: 9 },
    ],
  },
]

// ── Seed function ────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding task templates…\n')

  // Sign in as admin
  const { data: { session }, error: loginErr } = await sb.auth.signInWithPassword({
    email:    process.env.VITE_WIFE_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD,
  })
  if (!session) { console.error('Login failed:', loginErr?.message); process.exit(1) }
  console.log(`🔐 Signed in as: ${session.user.email}\n`)
  const adminId = session.user.id

  let created = 0, skipped = 0

  for (const tmpl of TEMPLATES) {
    // Skip if already exists
    const { data: existing } = await sb
      .from('task_templates')
      .select('id')
      .eq('name', tmpl.name)
      .eq('created_by', adminId)
      .single()

    if (existing?.id) {
      console.log(`  ⏭  Already exists — "${tmpl.name}"`)
      skipped++
      continue
    }

    // Create template
    const { data: created_tmpl, error: tmplErr } = await sb
      .from('task_templates')
      .insert({
        name:        tmpl.name,
        description: tmpl.description,
        color:       tmpl.color,
        emoji:       tmpl.emoji,
        created_by:  adminId,
      })
      .select('id')
      .single()

    if (tmplErr || !created_tmpl?.id) {
      console.error(`  ❌ Failed to create "${tmpl.name}":`, tmplErr?.message)
      continue
    }

    // Create items
    const itemRows = tmpl.items.map(item => ({
      template_id:    created_tmpl.id,
      title:          item.title,
      category:       item.category,
      estimated_mins: item.estimated_mins,
      sort_order:     item.sort_order,
    }))

    const { error: itemsErr } = await sb.from('task_template_items').insert(itemRows)
    if (itemsErr) {
      console.error(`  ⚠  Template created but items failed for "${tmpl.name}":`, itemsErr.message)
    } else {
      console.log(`  ✅ Created "${tmpl.name}" — ${tmpl.items.length} tasks`)
      created++
    }
  }

  await sb.auth.signOut()

  console.log(`\n🎉 Done! ${created} templates created, ${skipped} already existed.`)
}

seed().catch(e => { console.error('Fatal:', e); process.exit(1) })
