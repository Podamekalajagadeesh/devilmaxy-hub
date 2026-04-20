-- Run this once on an existing database to enable social profile fields.
alter table if exists users
  add column if not exists avatar_url text,
  add column if not exists bio text;

-- Storage setup for profile/chat uploads.
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public read chat-media" on storage.objects;
create policy "Public read chat-media"
on storage.objects
for select
to public
using (bucket_id = 'chat-media');

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Authenticated upload chat-media" on storage.objects;
drop policy if exists "Public upload chat-media" on storage.objects;
create policy "Public upload chat-media"
on storage.objects
for insert
to public
with check (bucket_id = 'chat-media');

drop policy if exists "Authenticated upload avatars" on storage.objects;
drop policy if exists "Public upload avatars" on storage.objects;
create policy "Public upload avatars"
on storage.objects
for insert
to public
with check (bucket_id = 'avatars');
