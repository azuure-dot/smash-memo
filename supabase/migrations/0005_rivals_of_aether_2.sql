-- Smash Memo — adds Rivals of Aether II as a third game.
-- Run in the Supabase SQL editor after 0004_profiles.sql.

alter type public.game add value if not exists 'roa2';

-- Default stagelist for new matchups. Rivals of Aether II uses its competitive pool
-- (dragdown.wiki/wiki/RoA2/Stages): 5 starters, then 5 counterpicks.
-- Changing these lists only affects matchups created afterwards.
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
      'Aetherian Forest', 'Godai Delta', 'Hodojo', 'Julesvale', 'Metal Refinery',
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
