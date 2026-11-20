-- Expose only project updates explicitly shared with the authenticated client.
-- The caller cannot supply a client_id or organization_id; identity is derived
-- from auth.uid() and checked against active access and share records.

create or replace function private.get_client_portal_updates(target_project_id uuid)
returns table (
  update_id uuid,
  title text,
  content text,
  progress_percent numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    u.id,
    u.title,
    u.content,
    case when s.can_view_progress then u.progress_percent else null end,
    u.created_at
  from public.project_updates u
  join public.client_project_shares s
    on s.project_id = u.project_id
   and s.organization_id = u.organization_id
  join public.client_portal_access a
    on a.organization_id = s.organization_id
   and a.client_id = s.client_id
  join public.clients c
    on c.id = s.client_id
   and c.organization_id = s.organization_id
  join public.projects p
    on p.id = s.project_id
   and p.organization_id = s.organization_id
  where u.project_id = target_project_id
    and a.user_id = (select auth.uid())
    and a.status = 'active'
    and c.status = 'active'
    and s.status = 'active'
    and s.can_view_updates = true
    and p.client_id = s.client_id
  order by u.created_at desc;
$function$;

revoke all on function private.get_client_portal_updates(uuid) from public, anon;
grant execute on function private.get_client_portal_updates(uuid) to authenticated;

create or replace function public.get_client_portal_updates(target_project_id uuid)
returns table (
  update_id uuid,
  title text,
  content text,
  progress_percent numeric,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select * from private.get_client_portal_updates(target_project_id);
$function$;

revoke all on function public.get_client_portal_updates(uuid) from public, anon;
grant execute on function public.get_client_portal_updates(uuid) to authenticated;

comment on function public.get_client_portal_updates(uuid) is
  'Returns only updates for a project actively shared with the authenticated external client, respecting the updates and progress share flags.';
