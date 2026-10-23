-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Adds the 3-metric scoring, favourite dishes and multi-photo support.

alter table public.restaurants
  add column if not exists food_score smallint check (food_score between 1 and 10),
  add column if not exists ambience_score smallint check (ambience_score between 1 and 10),
  add column if not exists value_score smallint check (value_score between 1 and 10),
  add column if not exists price integer check (price >= 0),
  add column if not exists fav_dishes text[] not null default '{}',
  add column if not exists photos text[] not null default '{}';

-- The old 1-5 star column is no longer written by the app.
alter table public.restaurants alter column rating drop not null;

insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true)
on conflict (id) do nothing;

create policy "restaurant photos are readable"
  on storage.objects for select
  using (bucket_id = 'restaurant-photos');

create policy "restaurant photos can be uploaded"
  on storage.objects for insert
  with check (bucket_id = 'restaurant-photos');

create policy "restaurant photos can be deleted"
  on storage.objects for delete
  using (bucket_id = 'restaurant-photos');

-- Only needed if row level security is ON for public.restaurants: lets the app edit spots.
-- (Without an update policy, edits silently change nothing.) Tighten this when you add sign-in.
-- create policy "restaurants can be updated"
--   on public.restaurants for update
--   using (true) with check (true);

-- Same idea for deleting: only needed if row level security is ON. Without it, deletes do nothing.
-- create policy "restaurants can be deleted"
--   on public.restaurants for delete
--   using (true);
