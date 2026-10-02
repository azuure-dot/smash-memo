-- Smash Memo — lets a signed-in user delete their own account.
-- Run in the Supabase SQL editor after 0001_init.sql.
--
-- Deleting the auth user cascades to matchups, matchup_stages and quick_notes
-- (all reference auth.users with ON DELETE CASCADE).
-- SECURITY DEFINER is needed because users can't touch auth.users directly;
-- the function only ever deletes the caller's own row (auth.uid()).

create or replace function public.delete_my_account()
returns void
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

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
