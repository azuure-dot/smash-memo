-- Smash Mémo — note sharing, saved notes and duplication.
-- Run in the Supabase SQL editor after 0002_delete_account.sql.
--
-- Security model: non-owners NEVER get direct SELECT access to matchups / stages / quick notes.
-- A policy like "anyone can read rows where is_shared" would let anyone with the public API key
-- list every shared note of every user. Instead, shared notes are only reachable through the
-- SECURITY DEFINER functions below, which require the exact (random, unguessable) note id —
-- i.e. you need the link. Existing "own rows" policies are unchanged: only owners can write.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
alter table public.matchups
  add column is_shared   boolean not null default false,
  add column copied_from uuid; -- id of the shared note this one was duplicated from (informational, no FK)

-- Users may now hold several notes for the same matchup (e.g. their own + a duplicated one).
do $$
declare
  c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.matchups'::regclass and contype = 'u';
  if c is not null then
    execute format('alter table public.matchups drop constraint %I', c);
  end if;
end;
$$;

-- Toggling sharing should not count as an edit (it would reorder the dashboard).
drop trigger matchups_touch on public.matchups;
create trigger matchups_touch
  before update of game, my_character, opponent_character, content on public.matchups
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Saved notes: bookmarks to other users' shared notes.
-- ---------------------------------------------------------------------------
create table public.saved_matchups (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  matchup_id uuid not null references public.matchups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, matchup_id)
);

create index saved_matchups_matchup_idx on public.saved_matchups (matchup_id);

alter table public.saved_matchups enable row level security;

-- Users can see and remove their own bookmarks. Adding one goes through save_shared_matchup().
create policy "Own saved matchups (read)" on public.saved_matchups
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Own saved matchups (delete)" on public.saved_matchups
  for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.saved_matchups to authenticated;

-- ---------------------------------------------------------------------------
-- Read a note by id: works for its owner, or for anyone (even signed out) if it is shared.
-- Returns null when the note doesn't exist or isn't shared.
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
  where m.id = p_id
    and (m.is_shared or m.user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Bookmark someone else's shared note. Returns false if it isn't shared (or is your own).
-- ---------------------------------------------------------------------------
create or replace function public.save_shared_matchup(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.matchups m
    where m.id = p_id and m.is_shared and m.user_id <> uid
  ) then
    return false;
  end if;

  insert into public.saved_matchups (user_id, matchup_id)
  values (uid, p_id)
  on conflict do nothing;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- The caller's bookmarks. Notes whose author stopped sharing them are left out.
-- ---------------------------------------------------------------------------
create or replace function public.list_saved_matchups()
returns table (
  id uuid,
  game public.game,
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
  select m.id, m.game, m.my_character, m.opponent_character, m.updated_at, s.created_at
  from public.saved_matchups s
  join public.matchups m on m.id = s.matchup_id
  where s.user_id = (select auth.uid())
    and m.is_shared
  order by s.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Deep copy of a shared note (title, stage statuses, rich text, quick notes)
-- into the caller's account. Returns the new note's id.
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

  return new_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what. Supabase grants EXECUTE to everyone by default: tighten it.
-- ---------------------------------------------------------------------------
revoke all on function public.get_shared_matchup(uuid)       from public;
revoke all on function public.save_shared_matchup(uuid)      from public, anon;
revoke all on function public.list_saved_matchups()          from public, anon;
revoke all on function public.duplicate_shared_matchup(uuid) from public, anon;

grant execute on function public.get_shared_matchup(uuid)       to anon, authenticated;
grant execute on function public.save_shared_matchup(uuid)      to authenticated;
grant execute on function public.list_saved_matchups()          to authenticated;
grant execute on function public.duplicate_shared_matchup(uuid) to authenticated;
