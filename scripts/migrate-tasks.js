// Run DB migrations for the tasks system
const PAT  = 'sbp_de7bb93225c70ffc97fd5e57f4636a542dad5fce'
const BASE = 'https://api.supabase.com/v1/projects/nodkzyyooibzlmanzlis/database/query'

async function sql(query) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok || text.includes('"error"') || text.includes('"message"')) {
    // Ignore "already exists" errors
    if (text.includes('already exists')) { process.stdout.write(' (already exists)'); return }
    console.error('\n  ERROR:', text.slice(0, 200))
  }
}

const migrations = [
  // RLS Policies — task_templates
  `create policy "Read task templates"
     on public.task_templates for select to authenticated using (true)`,
  `create policy "Admins manage task templates"
     on public.task_templates for all to authenticated
     using   ((select role from public.profiles where id = auth.uid()) = 'admin')
     with check ((select role from public.profiles where id = auth.uid()) = 'admin')`,

  // RLS Policies — task_template_items
  `create policy "Read template items"
     on public.task_template_items for select to authenticated using (true)`,
  `create policy "Admins manage template items"
     on public.task_template_items for all to authenticated
     using   ((select role from public.profiles where id = auth.uid()) = 'admin')
     with check ((select role from public.profiles where id = auth.uid()) = 'admin')`,

  // RLS Policies — tasks
  `create policy "Admins manage tasks"
     on public.tasks for all to authenticated
     using   ((select role from public.profiles where id = auth.uid()) = 'admin')
     with check ((select role from public.profiles where id = auth.uid()) = 'admin')`,
  `create policy "Helpers read own tasks"
     on public.tasks for select to authenticated
     using (
       (select role from public.profiles where id = auth.uid()) = 'helper'
       and assigned_to = auth.uid()
     )`,
  `create policy "Helpers update own tasks"
     on public.tasks for update to authenticated
     using (
       (select role from public.profiles where id = auth.uid()) = 'helper'
       and assigned_to = auth.uid()
     )
     with check (
       (select role from public.profiles where id = auth.uid()) = 'helper'
       and assigned_to = auth.uid()
     )`,

  // Realtime
  `alter publication supabase_realtime add table public.tasks`,
  `alter publication supabase_realtime add table public.task_templates`,
  `alter publication supabase_realtime add table public.task_template_items`,

  // Also ensure profiles has role column and helper role is allowed
  `do $$ begin
     if not exists (
       select 1 from pg_constraint
       where conname = 'profiles_role_check' and conrelid = 'public.profiles'::regclass
     ) then null; end if;
   end $$`,
]

console.log('Running task system migrations...\n')
for (const q of migrations) {
  const label = q.trim().split('\n')[0].slice(0, 60)
  process.stdout.write(`  • ${label}...`)
  await sql(q)
  process.stdout.write(' ✓\n')
}
console.log('\nAll migrations complete.')
