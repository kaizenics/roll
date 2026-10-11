-- Roll initial schema: profiles, videos, RLS, view counter.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile for every new auth user (magic link or OAuth).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  short_id text unique not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled recording'
    check (char_length(title) between 1 and 120),
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'ready', 'errored')),
  mux_upload_id text,
  mux_asset_id text,
  mux_playback_id text,
  duration_seconds numeric,
  aspect_ratio text,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index videos_owner_id_idx on public.videos (owner_id, created_at desc);
create index videos_short_id_idx on public.videos (short_id);
create index videos_mux_upload_id_idx on public.videos (mux_upload_id);
create index videos_mux_asset_id_idx on public.videos (mux_asset_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

alter table public.videos enable row level security;

create policy "videos_select_own" on public.videos
  for select using (auth.uid() = owner_id);

create policy "videos_insert_own" on public.videos
  for insert with check (auth.uid() = owner_id);

create policy "videos_update_own" on public.videos
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "videos_delete_own" on public.videos
  for delete using (auth.uid() = owner_id);

-- Column-level grants: users can never set status/playback/asset fields
-- themselves. Mux-managed columns are written only by the service role
-- (webhook handler).
revoke insert, update on public.videos from anon, authenticated;
grant insert (id, owner_id, short_id, title, mux_upload_id) on public.videos to authenticated;
grant update (title) on public.videos to authenticated;

-- ---------------------------------------------------------------------------
-- view counter (public, no RLS bypass beyond this single column)
-- ---------------------------------------------------------------------------
create or replace function public.increment_view(short_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.videos v
     set view_count = v.view_count + 1
   where v.short_id = increment_view.short_id
     and v.status = 'ready';
$$;

revoke all on function public.increment_view(text) from public;
grant execute on function public.increment_view(text) to anon, authenticated, service_role;
