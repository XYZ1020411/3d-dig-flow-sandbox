-- 3D Dig & Flow Sandbox: database schema
-- Target project: xjfphzwhbmegybdofsgj
-- Safe to re-run: creates game tables and replaces only policies on these tables.

create table if not exists public.player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.player_saves enable row level security;
drop policy if exists "Players read own save" on public.player_saves;
drop policy if exists "Players insert own save" on public.player_saves;
drop policy if exists "Players update own save" on public.player_saves;
drop policy if exists "Players can read own save" on public.player_saves;
drop policy if exists "Players can insert own save" on public.player_saves;
drop policy if exists "Players can update own save" on public.player_saves;
create policy "Players read own save" on public.player_saves
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Players insert own save" on public.player_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Players update own save" on public.player_saves
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update on public.player_saves to authenticated;

create table if not exists public.shared_worlds (
  id text primary key,
  state jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.shared_worlds enable row level security;
drop policy if exists "Authenticated read shared worlds" on public.shared_worlds;
drop policy if exists "Authenticated create shared worlds" on public.shared_worlds;
drop policy if exists "Authenticated update shared worlds" on public.shared_worlds;
drop policy if exists "Authenticated players can read shared worlds" on public.shared_worlds;
drop policy if exists "Authenticated players can publish shared worlds" on public.shared_worlds;
drop policy if exists "Authenticated players can update shared worlds" on public.shared_worlds;
create policy "Authenticated read shared worlds" on public.shared_worlds
  for select to authenticated using (true);
create policy "Authenticated create shared worlds" on public.shared_worlds
  for insert to authenticated with check ((select auth.uid()) = updated_by);
create policy "Authenticated update shared worlds" on public.shared_worlds
  for update to authenticated using (true)
  with check ((select auth.uid()) = updated_by);
grant select, insert, update on public.shared_worlds to authenticated;
create index if not exists shared_worlds_updated_by_idx on public.shared_worlds(updated_by);

-- Realtime publishes shared-world updates (not personal saves).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shared_worlds'
  ) then
    alter publication supabase_realtime add table public.shared_worlds;
  end if;
end $$;
