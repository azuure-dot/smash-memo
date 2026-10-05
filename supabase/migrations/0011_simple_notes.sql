-- Smash Memo — "Simple notes": notes about a game that aren't about one matchup (tech, tournament prep…).
-- Run in the Supabase SQL editor after 0010_twitch_videos.sql, BEFORE pushing the matching code.
-- Safe to run again if it was interrupted.
--
-- They live in the same table as matchups, so the Pre-set reminder, the rich-text notes, the videos, sharing,
-- saving, duplicating and account deletion all work for them unchanged. A simple note has a title (1 to 100
-- characters) instead of two characters, and no stagelist.

-- 1. What kind of note a row is (every existing row is a matchup).
alter table public.matchups
  add column if not exists kind text not null default 'matchup' check (kind in ('matchup', 'note'));

-- 2. The simple note's title.
alter table public.matchups
  add column if not exists title text check (title is null or (char_length(title) between 1 and 100 and btrim(title) <> ''));

-- 3. Characters are only required for matchups; a note has a title and no characters.
alter table public.matchups alter column my_character drop not null;
alter table public.matchups alter column opponent_character drop not null;

alter table public.matchups drop constraint if exists matchups_kind_shape;
alter table public.matchups add constraint matchups_kind_shape check (
  (kind = 'matchup' and my_character is not null and opponent_character is not null and title is null)
  or (kind = 'note' and title is not null and my_character is null and opponent_character is null)
);

-- 4. Renaming a note counts as editing it (dashboard order).
drop trigger if exists matchups_touch on public.matchups;
create trigger matchups_touch
  before update of game, my_character, opponent_character, title, content, preset_reminder on public.matchups
  for each row execute function public.touch_updated_at();

-- 5. No default stagelist for simple notes (same lists as 0007 for matchups).
create or replace function public.seed_matchup_stages()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stage_names text[];
begin
  if new.kind = 'note' then
    return new;
  end if;

  if new.game = 'melee' then
    stage_names := array[
      'Battlefield', 'Final Destination', 'Yoshi''s Story',
      'Dream Land', 'Fountain of Dreams', 'Pokémon Stadium'
    ];
  elsif new.game = 'roa2' then
    stage_names := array[
      'Aetherian Forest', 'Godai Delta', 'Hodojo', 'Julesvale', 'Air Armada',
      'Merchant Port', 'Fire Capital', 'Hyperborean Harbor', 'Rock Wall', 'Tempest Peak'
    ];
  else
    stage_names := array[
      'Battlefield', 'Final Destination', 'Small Battlefield', 'Pokémon Stadium 2',
      'Hollow Bastion', 'Smashville', 'Town & City', 'Kalos Pokémon League',
      'Yoshi''s Story'
    ];
  end if;

  insert into public.matchup_stages (matchup_id, user_id, name, position)
  select new.id, new.user_id, s.name, (s.ord - 1)::int
  from unnest(stage_names) with ordinality as s (name, ord);

  return new;
end;
$$;

-- 6. Shared notes send their kind and title.
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
      'kind', m.kind,
      'title', m.title,
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

-- 7. Saved Notes list: also returns kind and title. Its columns change, so it has to be dropped first.
drop function if exists public.list_saved_matchups();
create function public.list_saved_matchups()
returns table (
  id uuid,
  game public.game,
  kind text,
  title text,
  my_character text,
  opponent_character text,
  updated_at timestamptz,
  saved_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.game, m.kind, m.title, m.my_character, m.opponent_character, m.updated_at, s.created_at
  from public.saved_matchups s
  join public.matchups m on m.id = s.matchup_id
  where s.user_id = (select auth.uid())
    and m.is_shared
  order by s.created_at desc;
$$;

revoke all on function public.list_saved_matchups() from public, anon;
grant execute on function public.list_saved_matchups() to authenticated;

-- 8. Duplicating a shared note keeps its kind and title.
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

  insert into public.matchups (user_id, game, kind, title, my_character, opponent_character, content, preset_reminder, copied_from)
  values (uid, src.game, src.kind, src.title, src.my_character, src.opponent_character, src.content, src.preset_reminder, src.id)
  returning id into new_id;

  -- The insert trigger seeded the default stagelist (matchups only): replace it with the source's stages.
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
