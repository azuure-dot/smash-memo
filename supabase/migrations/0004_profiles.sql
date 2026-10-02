-- Smash Memo — user profiles (username + avatar) and avatar storage.
-- Run in the Supabase SQL editor after 0003_note_sharing.sql.
--
-- Same security model as sharing: profiles are NOT publicly readable (that would let anyone list
-- every user). A profile is only exposed as the "author" of a note, through get_shared_matchup(),
-- which requires the note's exact id.

-- ---------------------------------------------------------------------------
-- Profiles: one row per user, created on first save from the Account page.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  username   text check (
    char_length(username) between 2 and 24
    and username = btrim(username)
    and username !~ '[[:cntrl:]]'
  ),
  -- Only a file in this user's own folder of our public "avatars" bucket.
  avatar_url text check (
    avatar_url ~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/avatars/' || id::text || '/[A-Za-z0-9._-]+$')
  ),
  updated_at timestamptz not null default now()
);

-- Usernames are unique regardless of case ("Mango" and "mango" can't both exist).
create unique index profiles_username_unique on public.profiles (lower(username));

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

create policy "Own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, insert, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Avatar storage: public bucket, 2 MB max, jpeg / png / webp only (enforced by Supabase).
-- Files live at avatars/<user id>/<file>; users can only write in their own folder.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets are readable by URL without any policy. These only cover the API:
-- no one can list other users' folders.
create policy "Avatars: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Avatars: list own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Avatars: delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Shared notes now include their author's public profile (username + avatar only).
-- ---------------------------------------------------------------------------
create or replace function public.get_shared_matchup(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'matchup', jsonb_build_object(
      'id', m.id,
      'game', m.game,
      'my_character', m.my_character,
      'opponent_character', m.opponent_character,
      'content', m.content,
      'updated_at', m.updated_at
    ),
    'author', jsonb_build_object('username', p.username, 'avatar_url', p.avatar_url),
    'is_owner', m.user_id = (select auth.uid()),
    'is_saved', exists (
      select 1 from public.saved_matchups s
      where s.matchup_id = m.id and s.user_id = (select auth.uid())
    ),
    'stages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', st.id, 'matchup_id', st.matchup_id, 'name', st.name,
        'status', st.status, 'is_custom', st.is_custom, 'position', st.position
      ) order by st.position)
      from public.matchup_stages st where st.matchup_id = m.id
    ), '[]'::jsonb),
    'quick_notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.id, 'matchup_id', q.matchup_id, 'body', q.body,
        'created_at', q.created_at, 'updated_at', q.updated_at
      ) order by q.created_at)
      from public.quick_notes q where q.matchup_id = m.id
    ), '[]'::jsonb)
  )
  from public.matchups m
  left join public.profiles p on p.id = m.user_id
  where m.id = p_id
    and (m.is_shared or m.user_id = (select auth.uid()));
$$;
