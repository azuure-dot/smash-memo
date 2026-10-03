-- Smash Memo — Quick Notes become a single "Pre-Set Reminder" text on each note.
-- Run in the Supabase SQL editor after 0008_matchup_videos.sql.
--
-- Nothing is lost: every existing quick note is copied into the new field (one "• " line each, oldest first),
-- and the old table is only renamed to quick_notes_legacy and locked away from the app. Once you've checked
-- your reminders, you can delete it for good with:  drop table public.quick_notes_legacy;

-- 1. New field.
alter table public.matchups
  add column preset_reminder text check (char_length(preset_reminder) <= 5000);

-- 2. Copy existing quick notes into it. Done before step 3, so this doesn't change updated_at
--    (the dashboard order stays the same).
update public.matchups m
set preset_reminder = left(q.text, 5000)
from (
  select matchup_id, string_agg('• ' || body, E'\n' order by created_at) as text
  from public.quick_notes
  group by matchup_id
) q
where q.matchup_id = m.id;

-- 3. Editing the reminder now counts as editing the note.
drop trigger matchups_touch on public.matchups;
create trigger matchups_touch
  before update of game, my_character, opponent_character, content, preset_reminder on public.matchups
  for each row execute function public.touch_updated_at();

-- 4. Retire the old table: renamed, no longer reachable through the API (RLS stays on, grants removed).
alter table public.quick_notes rename to quick_notes_legacy;
revoke all on public.quick_notes_legacy from anon, authenticated;

-- 5. Shared notes: send the reminder instead of the quick notes.
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

-- 6. Duplicating a shared note copies the reminder (and no longer touches quick notes).
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

  insert into public.matchup_videos (matchup_id, user_id, video_id, title, start_seconds, created_at)
  select new_id, uid, v.video_id, v.title, v.start_seconds, v.created_at
  from public.matchup_videos v
  where v.matchup_id = src.id;

  return new_id;
end;
$$;
