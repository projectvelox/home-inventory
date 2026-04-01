// Reset passwords for Mommy, Daddy, Nene
const PAT  = 'sbp_12446ed50065d684a4326af43052d3b99545fbe2'
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

const TARGETS = [
  { email: 'admin@jo.com',        name: 'Mommy (My Love)' },
  { email: 'daddyjo@home.app',    name: 'Daddy Jo' },
  { email: 'neneella@home.app',   name: 'Nene Ella' },
  { email: 'wowagrace@home.app',  name: 'Wowa Grace' },
]

const PASSWORD = '123072'

async function main() {
  console.log('\nResetting passwords...\n')
  for (const { email, name } of TARGETS) {
    process.stdout.write(`  ${name} (${email})...`)
    const result = await sql(`
      UPDATE auth.users
      SET encrypted_password = crypt('${PASSWORD}', gen_salt('bf')),
          updated_at = NOW()
      WHERE email = '${email}'
      RETURNING id
    `)
    if (result[0]?.id) {
      console.log(' ✓ password updated')
    } else {
      console.log(' ✗ user not found')
    }
  }
  console.log('\nDone.\n')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
