alter table public.projects
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create or replace function private.stamp_project_creator()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  if tg_op='INSERT' then
    if (select auth.uid()) is not null then new.created_by := (select auth.uid()); end if;
  elsif new.created_by is distinct from old.created_by then
    raise exception 'Project creator identity cannot be changed' using errcode='42501';
  end if;
  return new;
end;
$function$;
revoke all on function private.stamp_project_creator() from public, anon, authenticated;
drop trigger if exists stamp_project_creator on public.projects;
create trigger stamp_project_creator before insert or update of created_by on public.projects
for each row execute function private.stamp_project_creator();

drop policy if exists project_scope_select_guard on public.projects;
create policy project_scope_select_guard on public.projects
as restrictive for select to authenticated
using (private.can_access_project(id) or created_by=(select auth.uid()));
