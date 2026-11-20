-- External client identity must be resolved through a minimal projection.
-- Direct client-table reads expose CRM columns that are not intended for clients.

create or replace function private.get_client_portal_identity()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  active_link_count integer;
  identity_data jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select count(*) into active_link_count
  from public.client_portal_access cpa
  where cpa.user_id = (select auth.uid())
    and cpa.status = 'active';

  if active_link_count <> 1 then
    return null;
  end if;

  select jsonb_build_object(
    'client_id', c.id,
    'organization_id', c.organization_id,
    'name', c.name,
    'status', c.status
  )
  into identity_data
  from public.client_portal_access cpa
  join public.clients c
    on c.id = cpa.client_id
   and c.organization_id = cpa.organization_id
  where cpa.user_id = (select auth.uid())
    and cpa.status = 'active'
    and c.status = 'active';

  return identity_data;
end;
$function$;

revoke all on function private.get_client_portal_identity() from public, anon;
grant execute on function private.get_client_portal_identity() to authenticated;

create or replace function public.get_client_portal_identity()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.get_client_portal_identity();
$function$;

revoke all on function public.get_client_portal_identity() from public, anon;
grant execute on function public.get_client_portal_identity() to authenticated;

drop policy if exists clients_client_portal_select on public.clients;
