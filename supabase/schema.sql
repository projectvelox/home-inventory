-- ============================================================
-- My Home Haven — Supabase Schema
-- Paste this entire file into Supabase > SQL Editor > Run
-- ============================================================

-- PROFILES (extends auth.users with display info + role)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar        text not null default '👤',
  role          text not null default 'helper',
  created_at    timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'helper'))
);

-- CATEGORIES
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  emoji       text not null default '📦',
  color       text not null default '#f9a8d4',
  created_at  timestamptz not null default now()
);

-- ITEMS
create table if not exists public.items (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category_id     uuid references public.categories(id) on delete set null,
  qty             integer not null default 0,
  restock_qty     integer not null default 0,
  full_qty        integer not null default 0,
  unit            text not null default 'pcs',
  notes           text,
  location        text,
  image           text,
  last_restocked  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.categories enable row level security;
alter table public.items      enable row level security;

-- PROFILES policies
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "System can insert profiles"
  on public.profiles for insert with check (true);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- CATEGORIES policies
create policy "Authenticated users can read categories"
  on public.categories for select to authenticated using (true);

create policy "Admins can manage categories"
  on public.categories for all to authenticated
  using   ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ITEMS policies
create policy "Authenticated users can read items"
  on public.items for select to authenticated using (true);

create policy "Admins can insert items"
  on public.items for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Both roles can update items (helper needs qty changes)
create policy "Authenticated users can update items"
  on public.items for update to authenticated
  using (true) with check (true);

create policy "Admins can delete items"
  on public.items for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.categories;

-- ============================================================
-- TRIGGER: Auto-create profile row when a user is created
-- Set display_name, avatar, role via user metadata on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar', '👤'),
    coalesce(new.raw_user_meta_data->>'role', 'helper')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DEFAULT CATEGORIES
-- ============================================================
insert into public.categories (name, emoji, color) values
  ('Groceries',  '🛒', '#86efac'),
  ('Baby Things','🍼', '#bae6fd'),
  ('Cleaning',   '🧹', '#d8b4fe'),
  ('Toiletries', '🧴', '#fdba74'),
  ('Snacks',     '🍪', '#fde68a')
on conflict do nothing;
