-- Smash Memo — Matchup template: the Notes every new matchup starts with (set in Account → Matchup template).
-- Run in the Supabase SQL editor after 0011_simple_notes.sql. Safe to run again.
--
-- Stored on the user's own profile row, so the existing "Own profile" RLS policy already applies: nobody else
-- can read or change it (get_shared_matchup() only ever exposes username and avatar). Same rich-text JSON as
-- matchups.content; it is copied into a matchup when it's created, so editing the template later never
-- changes notes already written. Simple notes and duplicated notes don't use it.

alter table public.profiles
  add column if not exists matchup_template jsonb check (
    matchup_template is null
    or (jsonb_typeof(matchup_template) = 'object' and octet_length(matchup_template::text) <= 200000)
  );
