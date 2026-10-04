-- Smash Memo — Video Resources accept Twitch VODs and highlights, next to YouTube videos.
-- Run in the Supabase SQL editor after 0009_preset_reminder.sql, BEFORE pushing the matching code.
--
-- Same rule as before: only an id is stored, never a raw URL. A Twitch video id is a number
-- (twitch.tv/videos/2873706344). Twitch thumbnails can't be built from the id, so their address is stored too,
-- but only if it points to Twitch's image server.

-- 1. Which site the video comes from (existing rows are YouTube videos).
alter table public.matchup_videos
  add column provider text not null default 'youtube' check (provider in ('youtube', 'twitch'));

-- 2. Twitch thumbnail (null for YouTube, whose thumbnail is derived from the id).
alter table public.matchup_videos
  add column thumbnail_url text check (
    thumbnail_url is null
    or (char_length(thumbnail_url) <= 500 and thumbnail_url ~ '^https://static-cdn\.jtvnw\.net/[A-Za-z0-9_./%-]+$')
  );

-- 3. Remove the old YouTube-only rules on video_id (the 11-character check and the per-note uniqueness),
--    found by what they check rather than by name.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.matchup_videos'::regclass
      and contype in ('c', 'u')
      and pg_get_constraintdef(oid) like '%video_id%'
  loop
    execute format('alter table public.matchup_videos drop constraint %I', c.conname);
  end loop;
end $$;

-- 4. The id format now depends on the site.
alter table public.matchup_videos add constraint matchup_videos_video_id_check check (
  (provider = 'youtube' and video_id ~ '^[A-Za-z0-9_-]{11}$')
  or (provider = 'twitch' and video_id ~ '^[0-9]{1,15}$')
);

-- 5. "Same video twice in a note" now means same site + same id.
alter table public.matchup_videos
  add constraint matchup_videos_matchup_provider_video_key unique (matchup_id, provider, video_id);

-- 6. Shared notes send the new fields.
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
      'preset_reminder', m.preset_reminder,
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
    'videos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'matchup_id', v.matchup_id, 'provider', v.provider, 'video_id', v.video_id,
        'title', v.title, 'thumbnail_url', v.thumbnail_url, 'start_seconds', v.start_seconds,
        'created_at', v.created_at
      ) order by v.created_at)
      from public.matchup_videos v where v.matchup_id = m.id
    ), '[]'::jsonb)
  )
  from public.matchups m
  left join public.profiles p on p.id = m.user_id
  where m.id = p_id
    and (m.is_shared or m.user_id = (select auth.uid()));
$$;

-- 7. Duplicating a shared note copies the new fields too.
create or replace function public.duplicate_shared_matchup(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid    uuid := auth.uid();
  src    public.matchups;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into src
  from public.matchups m
  where m.id = p_id and (m.is_shared or m.user_id = uid);
  if not found then
    raise exception 'This note does not exist or is no longer shared';
  end if;

  insert into public.matchups (user_id, game, my_character, opponent_character, content, preset_reminder, copied_from)
  values (uid, src.game, src.my_character, src.opponent_character, src.content, src.preset_reminder, src.id)
  returning id into new_id;

  -- The insert trigger seeded the default stagelist: replace it with the source's stages.
  delete from public.matchup_stages where matchup_id = new_id;

  insert into public.matchup_stages (matchup_id, user_id, name, status, is_custom, position)
  select new_id, uid, st.name, st.status, st.is_custom, st.position
  from public.matchup_stages st
  where st.matchup_id = src.id;

  insert into public.matchup_videos (matchup_id, user_id, provider, video_id, title, thumbnail_url, start_seconds, created_at)
  select new_id, uid, v.provider, v.video_id, v.title, v.thumbnail_url, v.start_seconds, v.created_at
  from public.matchup_videos v
  where v.matchup_id = src.id;

  return new_id;
end;
$$;
