-- =====================================================================
-- Abhyudaya Events — Supabase schema & security rules
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is idempotent.
--
-- Security model
--   * Visitors (anon key) can ONLY read site content and submit enquiries.
--   * Only users listed in public.admins can edit content, read/manage
--     enquiries, or upload files. Being signed in is not enough.
--   * Passwords are handled by Supabase Auth (server-side, hashed);
--     nothing secret is ever sent to the browser.
-- =====================================================================

-- ---------- admins allowlist ----------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "admins: read own row" on public.admins;
create policy "admins: read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());
-- No insert/update/delete policies: admins are added only from the SQL editor.

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- website content (single JSON document) ----------
create table if not exists public.site_content (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null,
  rev        int not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.site_content enable row level security;

drop policy if exists "content: public read" on public.site_content;
create policy "content: public read" on public.site_content
  for select to anon, authenticated using (true);
-- No write policies: saving only happens through save_content() below,
-- which checks admin rights and refuses out-of-date saves.

create table if not exists public.content_history (
  id       bigserial primary key,
  data     jsonb not null,
  rev      int not null,
  saved_at timestamptz not null default now(),
  saved_by uuid references auth.users (id) on delete set null
);
alter table public.content_history enable row level security;

drop policy if exists "history: admin read" on public.content_history;
create policy "history: admin read" on public.content_history
  for select to authenticated using (public.is_admin());

create or replace function public.save_content(new_data jsonb, expected_rev int)
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  cur_rev  int;
  cur_data jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if jsonb_typeof(new_data) <> 'object' then
    raise exception 'invalid content';
  end if;

  select rev, data into cur_rev, cur_data from public.site_content where id = 1 for update;

  if cur_rev is null then
    insert into public.site_content (id, data, rev, updated_by) values (1, new_data, 1, auth.uid());
    return 1;
  end if;

  -- someone saved newer content since this admin loaded it: never overwrite it
  if cur_rev <> expected_rev then
    raise exception 'stale' using errcode = 'P0001';
  end if;

  insert into public.content_history (data, rev, saved_by) values (cur_data, cur_rev, auth.uid());
  -- keep the last 50 versions
  delete from public.content_history
   where id in (select id from public.content_history order by id desc offset 50);

  update public.site_content
     set data = new_data, rev = cur_rev + 1, updated_at = now(), updated_by = auth.uid()
   where id = 1;
  return cur_rev + 1;
end;
$$;
revoke all on function public.save_content(jsonb, int) from public, anon;
grant execute on function public.save_content(jsonb, int) to authenticated;

-- ---------- enquiries (contact form) ----------
create table if not exists public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text check (email is null or char_length(email) <= 160),
  phone      text check (phone is null or char_length(phone) <= 30),
  event_type text check (event_type is null or char_length(event_type) <= 80),
  event_date text check (event_date is null or char_length(event_date) <= 30),
  guests     text check (guests is null or char_length(guests) <= 30),
  budget     text check (budget is null or char_length(budget) <= 30),
  message    text check (message is null or char_length(message) <= 2000),
  status     text not null default 'new' check (status in ('new', 'contacted', 'booked', 'closed')),
  created_at timestamptz not null default now(),
  constraint enquiries_contact_present check (coalesce(email, '') <> '' or coalesce(phone, '') <> '')
);
alter table public.enquiries enable row level security;

-- visitors may only add a brand-new enquiry; they can never read any back
drop policy if exists "enquiries: public insert" on public.enquiries;
create policy "enquiries: public insert" on public.enquiries
  for insert to anon, authenticated with check (status = 'new');

drop policy if exists "enquiries: admin read" on public.enquiries;
create policy "enquiries: admin read" on public.enquiries
  for select to authenticated using (public.is_admin());

drop policy if exists "enquiries: admin update" on public.enquiries;
create policy "enquiries: admin update" on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "enquiries: admin delete" on public.enquiries;
create policy "enquiries: admin delete" on public.enquiries
  for delete to authenticated using (public.is_admin());

-- ---------- file storage for uploads ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 20971520,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- anyone can view files (bucket is public); only admins can add, change or remove them
drop policy if exists "media: admin insert" on storage.objects;
create policy "media: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin update" on storage.objects;
create policy "media: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin delete" on storage.objects;
create policy "media: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
