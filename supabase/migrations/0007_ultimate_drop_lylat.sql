-- Smash Memo — Ultimate: Lylat Cruise is no longer in the default stagelist (owner's request, 2026-10-02).
-- Run in the Supabase SQL editor after 0006_roa2_air_armada.sql.
-- Only affects matchups created afterwards: existing ones keep their Lylat Cruise row.

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
      'Yoshi''s Story'
    ];
  end if;

  insert into public.matchup_stages (matchup_id, user_id, name, position)
  select new.id, new.user_id, s.name, (s.ord - 1)::int
  from unnest(stage_names) with ordinality as s (name, ord);

  return new;
end;
$$;
