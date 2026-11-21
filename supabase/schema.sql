-- =============================================================================
-- Portfolio CMS schema for Supabase
-- Run this whole file once in Supabase Dashboard → SQL Editor → New query.
-- It is idempotent: running it again will not drop your data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Admins
-- Only users listed here can write content. Signing up alone grants nothing.
-- After creating your user in Authentication → Users, run:
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- security definer so policies can call it without exposing the admins table
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Admins can see themselves" on public.admins;
create policy "Admins can see themselves" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- updated_at helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profile (single row, id is always 1)
-- -----------------------------------------------------------------------------
create table if not exists public.profile (
  id            smallint primary key default 1 check (id = 1),
  full_name     text not null default 'Your Name',
  headline      text not null default 'Full-Stack Developer',
  bio           text not null default '',
  location      text,
  availability  text,
  email         text,
  avatar_url    text,
  resume_url    text,
  updated_at    timestamptz not null default now()
);

insert into public.profile (id) values (1) on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Socials
-- -----------------------------------------------------------------------------
create table if not exists public.socials (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null,
  url         text not null,
  icon        text not null default 'website',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  short_description  text not null default '',
  description        text not null default '',          -- Markdown
  tech_stack         text[] not null default '{}',
  live_url           text,
  source_url         text,
  thumbnail_url      text,
  featured           boolean not null default false,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Experience (end_date null = "Present")
-- -----------------------------------------------------------------------------
create table if not exists public.experience (
  id           uuid primary key default gen_random_uuid(),
  role         text not null,
  company      text not null,
  location     text,
  start_date   date not null,
  end_date     date,
  description  text not null default '',                -- Markdown bullet points
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Education (end_year null = "Present")
-- -----------------------------------------------------------------------------
create table if not exists public.education (
  id           uuid primary key default gen_random_uuid(),
  institution  text not null,
  degree       text not null,
  start_year   integer not null,
  end_year     integer,
  details      text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Blogs
-- -----------------------------------------------------------------------------
create table if not exists public.blogs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  cover_url     text,
  excerpt       text not null default '',
  content       text not null default '',               -- Markdown
  published     boolean not null default false,
  published_at  timestamptz,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists blogs_published_idx on public.blogs (published, published_at desc);

-- -----------------------------------------------------------------------------
-- Triggers + RLS for all content tables
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['profile', 'socials', 'projects', 'experience', 'education', 'blogs']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Admins can insert" on public.%I', t);
    execute format('drop policy if exists "Admins can update" on public.%I', t);
    execute format('drop policy if exists "Admins can delete" on public.%I', t);

    execute format(
      'create policy "Admins can insert" on public.%I
         for insert to authenticated with check (public.is_admin())', t);
    execute format(
      'create policy "Admins can update" on public.%I
         for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format(
      'create policy "Admins can delete" on public.%I
         for delete to authenticated using (public.is_admin())', t);
  end loop;

  -- Everything except blogs is fully public to read.
  foreach t in array array['profile', 'socials', 'projects', 'experience', 'education']
  loop
    execute format('drop policy if exists "Public can read" on public.%I', t);
    execute format(
      'create policy "Public can read" on public.%I for select using (true)', t);
  end loop;
end $$;

-- The profile row must never be deleted or duplicated.
drop policy if exists "Admins can delete" on public.profile;
drop policy if exists "Admins can insert" on public.profile;

-- Blogs: the public sees only published posts; admins see drafts too.
drop policy if exists "Public can read published blogs" on public.blogs;
create policy "Public can read published blogs" on public.blogs
  for select using (published = true or public.is_admin());

-- -----------------------------------------------------------------------------
-- Storage buckets (public read, admin write)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880,  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']),
  ('resumes', 'resumes', true, 10485760, array['application/pdf']),
  ('media',   'media',   true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio files are publicly readable" on storage.objects;
create policy "Portfolio files are publicly readable" on storage.objects
  for select using (bucket_id in ('avatars', 'resumes', 'media'));

drop policy if exists "Admins can upload portfolio files" on storage.objects;
create policy "Admins can upload portfolio files" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars', 'resumes', 'media') and public.is_admin());

drop policy if exists "Admins can update portfolio files" on storage.objects;
create policy "Admins can update portfolio files" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatars', 'resumes', 'media') and public.is_admin())
  with check (bucket_id in ('avatars', 'resumes', 'media') and public.is_admin());

drop policy if exists "Admins can delete portfolio files" on storage.objects;
create policy "Admins can delete portfolio files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatars', 'resumes', 'media') and public.is_admin());
