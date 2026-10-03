-- Smash Memo — YouTube video resources attached to a matchup note.
-- Run in the Supabase SQL editor after 0007_ultimate_drop_lylat.sql.
--
-- Only the 11-character YouTube video id is stored (never a raw URL), so nothing else can ever end up
-- in the embedded player. Same security model as the rest: owners read/write their own rows through RLS;
-- other people only see videos of a shared note through get_shared_matchup().

create table public.matchup_videos (
  id            uuid primary key default gen_random_uuid(),
  matchup_id    uuid not null references public.matchups (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  video_id      text not null check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  title         text check (char_length(title) <= 200),
  start_seconds integer check (start_seconds between 0 and 86400),
  created_at    timestamptz not null default now(),
  unique (matchup_id, video_id)
);

create index matchup_videos_matchup_idx on public.matchup_videos (matchup_id, created_at);

alter table public.matchup_videos enable row level security;

create policy "Own matchup videos" on public.matchup_videos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.matchups m
      where m.id = matchup_id and m.user_id = (select auth.uid())
    )
  );

grant select, insert, delete on public.matchup_videos to authenticated;

-- ---------------------------------------------------------------------------
-- Shared notes now include their videos.
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
    ), '[]'::jsonb),
    'videos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'matchup_id', v.matchup_id, 'video_id', v.video_id,
        'title', v.title, 'start_seconds', v.start_seconds, 'created_at', v.created_at
      ) order by v.created_at)
      from public.matchup_videos v where v.matchup_id = m.id
    ), '[]'::jsonb)
  )
  from public.matchups m
  left join public.profiles p on p.id = m.user_id
  where m.id = p_id
    and (m.is_shared or m.user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Duplicating a shared note also copies its videos.
-- ---------------------------------------------------------------------------
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

  insert into public.matchups (user_id, game, my_character, opponent_character, content, copied_from)
  values (uid, src.game, src.my_character, src.opponent_character, src.content, src.id)
  returning id into new_id;

  -- The insert trigger seeded the default stagelist: replace it with the source's stages.
  delete from public.matchup_stages where matchup_id = new_id;

  insert into public.matchup_stages (matchup_id, user_id, name, status, is_custom, position)
  select new_id, uid, st.name, st.status, st.is_custom, st.position
  from public.matchup_stages st
  where st.matchup_id = src.id;

  insert into public.quick_notes (matchup_id, user_id, body, created_at)
  select new_id, uid, q.body, q.created_at
  from public.quick_notes q
  where q.matchup_id = src.id;

  insert into public.matchup_videos (matchup_id, user_id, video_id, title, start_seconds, created_at)
  select new_id, uid, v.video_id, v.title, v.start_seconds, v.created_at
  from public.matchup_videos v
  where v.matchup_id = src.id;

  return new_id;
end;
$$;
