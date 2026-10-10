-- Website partner / research-access requests (created 2026-10-10). RLS on, no policies: only the server (postgres role) writes.
create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('partner','research')),
  name text not null,
  email text not null,
  organisation text,
  role text,
  country text,
  interests text[] not null default '{}',
  message text,
  source_page text,
  status text not null default 'new'
);
alter table contact_requests enable row level security;
