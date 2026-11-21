-- El cliente no debe poder activarse el Pro ni tocar columnas sensibles.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, xp, gems, streak, last_study_date) on public.profiles to authenticated;
revoke insert on public.profiles from anon;
revoke insert, update, delete on public.questions from anon, authenticated;
revoke insert, update, delete on public.exams from anon, authenticated;
revoke update, delete on public.answers from anon, authenticated;
revoke all on public.answers from anon;
revoke all on public.question_reports from anon;
revoke update, delete, select on public.question_reports from authenticated;

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
