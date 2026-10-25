-- Earth Online world persistence. Worker service-role secret only; never expose it to clients.
create table if not exists public.earth_online_worlds (
  room_id text primary key check (char_length(room_id) between 1 and 24),
  world_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.earth_online_worlds enable row level security;
-- No anon/authenticated policies: only the authenticated Worker service role may read/write.
create index if not exists earth_online_worlds_updated_at_idx
  on public.earth_online_worlds (updated_at desc);
