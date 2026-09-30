-- Smash Notes — initial schema
-- Run in the Supabase SQL editor, or with `supabase db push` if you use the CLI.
-- Users live in Supabase's built-in auth.users table; every row below is owned by one user.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.game as enum ('ultimate', 'melee');
create type public.stage_status as enum ('neutral', 'prefer', 'avoid');

-- ---------------------------------------------------------------------------
-- Matchups: one row per "[My Character] vs [Opponent]" note.
-- `content` holds the rich-text editor document (Tiptap JSON).
-- ---------------------------------------------------------------------------
create table public.matchups (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game               public.game not null,
  my_character       text not null check (char_length(my_character) between 1 and 60),
  opponent_character text not null check (char_length(opponent_character) between 1 and 60),
  content            jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, game, my_character, opponent_character)
);

create index matchups_user_updated_idx on public.matchups (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Stage preferences: one row per stage per matchup (defaults + custom ones).
-- ---------------------------------------------------------------------------
create table public.matchup_stages (
  id          uuid primary key default gen_random_uuid(),
  matchup_id  uuid not null references public.matchups (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  status      public.stage_status not null default 'neutral',
  is_custom   boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (matchup_id, name)
);

create index matchup_stages_matchup_idx on public.matchup_stages (matchup_id, position);

-- ---------------------------------------------------------------------------
-- Quick notes: short sub-notes attached to a matchup.
-- ---------------------------------------------------------------------------
create table public.quick_notes (
  id          uuid primary key default gen_random_uuid(),
  matchup_id  uuid not null references public.matchups (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index quick_notes_matchup_idx on public.quick_notes (matchup_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger matchups_touch before update on public.matchups
  for each row execute function public.touch_updated_at();

create trigger quick_notes_touch before update on public.quick_notes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Seed the default stagelist whenever a matchup is created.
-- ---------------------------------------------------------------------------
create or replace function public.seed_matchup_stages()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  stage_names text[];
begin
  if new.game = 'melee' then
    stage_names := array[
      'Battlefield', 'Final Destination', 'Yoshi''s Story',
      'Dream Land', 'Fountain of Dreams', 'Pokémon Stadium'
    ];
  else
    stage_names := array[
      'Battlefield', 'Final Destination', 'Small Battlefield', 'Pokémon Stadium 2',
      'Hollow Bastion', 'Smashville', 'Town & City', 'Kalos Pokémon League',
      'Yoshi''s Story', 'Lylat Cruise'
    ];
  end if;

  insert into public.matchup_stages (matchup_id, user_id, name, position)
  select new.id, new.user_id, s.name, (s.ord - 1)::int
  from unnest(stage_names) with ordinality as s (name, ord);

  return new;
end;
$$;

create trigger matchups_seed_stages after insert on public.matchups
  for each row execute function public.seed_matchup_stages();

-- ---------------------------------------------------------------------------
-- Row Level Security: users only ever see and change their own rows.
-- ---------------------------------------------------------------------------
alter table public.matchups       enable row level security;
alter table public.matchup_stages enable row level security;
alter table public.quick_notes    enable row level security;

create policy "Own matchups" on public.matchups
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Own matchup stages" on public.matchup_stages
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.matchups m
      where m.id = matchup_id and m.user_id = (select auth.uid())
    )
  );

create policy "Own quick notes" on public.quick_notes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.matchups m
      where m.id = matchup_id and m.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete
  on public.matchups, public.matchup_stages, public.quick_notes
  to authenticated;
