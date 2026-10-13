-- Videos are private until the owner generates a shareable link.
-- Sharing, revoking (which rotates short_id) and trimming go through the API
-- with the service role after an ownership check, so no new user grants.

alter table public.videos
  add column is_shared boolean not null default false;

-- Only shared, ready videos count views.
create or replace function public.increment_view(short_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.videos v
     set view_count = v.view_count + 1
   where v.short_id = increment_view.short_id
     and v.status = 'ready'
     and v.is_shared;
$$;
