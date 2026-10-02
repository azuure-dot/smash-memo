-- Smash Memo — Rivals of Aether II: "Metal Refinery" becomes "Air Armada" (owner's request, 2026-10-02).
-- Run in the Supabase SQL editor after 0005_rivals_of_aether_2.sql.

-- 1. Existing Rivals 2 matchups: rename the stage, keeping its Prefer / Avoid status and position.
--    Skipped for a matchup that already has a stage called "Air Armada" (stage names are unique per matchup).
update public.matchup_stages ms
set name = 'Air Armada'
from public.matchups m
where m.id = ms.matchup_id
  and m.game = 'roa2'
  and ms.name = 'Metal Refinery'
  and not exists (
    select 1 from public.matchup_stages other
    where other.matchup_id = ms.matchup_id and other.name = 'Air Armada'
  );

-- 2. New Rivals 2 matchups get "Air Armada" in their default stagelist.
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
  elsif new.game = 'roa2' then
    stage_names := array[
      'Aetherian Forest', 'Godai Delta', 'Hodojo', 'Julesvale', 'Air Armada',
      'Merchant Port', 'Fire Capital', 'Hyperborean Harbor', 'Rock Wall', 'Tempest Peak'
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
