// Create helper accounts: Daddy Jo, Nene Ella, Wowa Grace
const PAT  = 'sbp_de7bb93225c70ffc97fd5e57f4636a542dad5fce'
const BASE = 'https://api.supabase.com/v1/projects/nodkzyyooibzlmanzlis/database/query'

async function sql(query) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const data = await res.json()
  if (data?.message) console.error('  SQL error:', data.message)
  return Array.isArray(data) ? data : []
}

const USERS = [
  { email: 'daddyjo@home.app',    displayName: 'Daddy Jo',    avatar: '👨',  password: '123072' },
  { email: 'neneella@home.app',   displayName: 'Nene Ella',   avatar: '👩',  password: '123072' },
  { email: 'wowagrace@home.app',  displayName: 'Wowa Grace',  avatar: '👵',  password: '123072' },
]

async function createUser({ email, displayName, avatar, password }) {
  process.stdout.write(`  ${displayName} (${email})...`)

  // Step 1: Check if user already exists
  const existing = await sql(`SELECT id FROM auth.users WHERE email = '${email}' LIMIT 1`)
  let userId = existing[0]?.id

  if (!userId) {
    // Step 2: Insert new auth user
    const inserted = await sql(`
      INSERT INTO auth.users (
        id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, is_sso_user,
        confirmation_token, recovery_token,
        email_change, email_change_token_new, email_change_token_current,
        email_change_confirm_status
      ) VALUES (
        gen_random_uuid(), 'authenticated', 'authenticated',
        '${email}',
        crypt('${password}', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        false, false, '', '', '', '', '', 0
      )
      RETURNING id
    `)
    userId = inserted[0]?.id
    if (!userId) { console.log(' ✗ Insert failed'); return }

    // Step 3: Insert auth identity (for email login)
    await sql(`
      INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        '${email}',
        '${userId}',
        jsonb_build_object('sub', '${userId}', 'email', '${email}'),
        'email',
        NOW(), NOW()
      )
      ON CONFLICT (provider_id, provider) DO NOTHING
    `)

    process.stdout.write(' created auth ✓')
  } else {
    process.stdout.write(' exists')
  }

  // Step 4: Upsert profile (works for both new and existing users)
  await sql(`
    INSERT INTO public.profiles (id, display_name, avatar, role)
    VALUES ('${userId}', '${displayName}', '${avatar}', 'helper')
    ON CONFLICT (id) DO UPDATE
      SET display_name = '${displayName}',
          avatar       = '${avatar}',
          role         = 'helper'
  `)
  console.log(' profile ✓')
}

async function main() {
  console.log('\nCreating helper accounts...\n')
  for (const u of USERS) await createUser(u)

  console.log('\nHelper profiles in DB:')
  const profiles = await sql(`
    SELECT p.display_name, p.avatar, p.role, u.email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.role = 'helper'
    ORDER BY p.display_name
  `)
  for (const p of profiles) console.log(`  ${p.avatar}  ${p.display_name} — ${p.email}`)
  console.log()
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
