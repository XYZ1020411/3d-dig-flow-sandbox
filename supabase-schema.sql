-- Run this script in Supabase Dashboard > SQL Editor.
-- Authenticated users can only read/write their own personal save.
create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.player_saves enable row level security;
drop policy if exists "Players read own save" on public.player_saves;
create policy "Players read own save" on public.player_saves for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Players insert own save" on public.player_saves;
create policy "Players insert own save" on public.player_saves for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Players update own save" on public.player_saves;
create policy "Players update own save" on public.player_saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One shared sandbox world for logged-in players. All authenticated players can update it.
create table if not exists public.shared_worlds (
  id text primary key,
  state jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.shared_worlds enable row level security;
drop policy if exists "Authenticated read shared worlds" on public.shared_worlds;
create policy "Authenticated read shared worlds" on public.shared_worlds for select to authenticated using (true);
drop policy if exists "Authenticated create shared worlds" on public.shared_worlds;
create policy "Authenticated create shared worlds" on public.shared_worlds for insert to authenticated with check (auth.uid() = updated_by);
drop policy if exists "Authenticated update shared worlds" on public.shared_worlds;
create policy "Authenticated update shared worlds" on public.shared_worlds for update to authenticated using (true) with check (auth.uid() = updated_by);

-- Enable Realtime for shared-world UPDATE events.
do $$ begin
  alter publication supabase_realtime add table public.shared_worlds;
exception when duplicate_object then null;
when undefined_object then null;
end $$;
