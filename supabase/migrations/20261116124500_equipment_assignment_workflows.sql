create or replace function public.assign_equipment(
  p_equipment_id uuid,
  p_project_id uuid,
  p_staff_id uuid default null,
  p_notes text default null
) returns uuid
language plpgsql security invoker set search_path=public,pg_temp
as $$
declare v_equipment public.equipment%rowtype; v_assignment_id uuid; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_equipment from public.equipment where id=p_equipment_id for update;
  if not found then raise exception 'Equipment not found or access denied'; end if;
  if not public.has_org_permission(v_equipment.organization_id,'equipment.update') then raise exception 'You do not have permission to assign equipment'; end if;
  if v_equipment.status not in ('available','assigned') then raise exception 'Equipment is not available for assignment'; end if;
  if exists(select 1 from public.equipment_assignments a where a.equipment_id=p_equipment_id and a.returned_at is null) then raise exception 'Equipment already has an active assignment'; end if;
  if not exists(select 1 from public.projects p where p.id=p_project_id and p.organization_id=v_equipment.organization_id) then raise exception 'Project does not belong to this organisation'; end if;
  if p_staff_id is not null and not exists(select 1 from public.staff s where s.id=p_staff_id and s.organization_id=v_equipment.organization_id) then raise exception 'Staff member does not belong to this organisation'; end if;
  insert into public.equipment_assignments(organization_id,equipment_id,project_id,staff_id,assigned_by,notes)
  values(v_equipment.organization_id,p_equipment_id,p_project_id,p_staff_id,v_user,p_notes) returning id into v_assignment_id;
  update public.equipment set status='assigned',updated_at=now() where id=p_equipment_id;
  return v_assignment_id;
end; $$;

create or replace function public.return_equipment(p_assignment_id uuid,p_notes text default null)
returns boolean language plpgsql security invoker set search_path=public,pg_temp
as $$
declare v_assignment public.equipment_assignments%rowtype; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_assignment from public.equipment_assignments where id=p_assignment_id for update;
  if not found then raise exception 'Assignment not found or access denied'; end if;
  if not public.has_org_permission(v_assignment.organization_id,'equipment.update') then raise exception 'You do not have permission to return equipment'; end if;
  if v_assignment.returned_at is not null then raise exception 'Equipment has already been returned'; end if;
  update public.equipment_assignments set returned_at=now(),notes=coalesce(p_notes,notes) where id=p_assignment_id;
  update public.equipment set status='available',updated_at=now() where id=v_assignment.equipment_id and organization_id=v_assignment.organization_id;
  return true;
end; $$;
revoke all on function public.assign_equipment(uuid,uuid,uuid,text) from public,anon;
revoke all on function public.return_equipment(uuid,text) from public,anon;
grant execute on function public.assign_equipment(uuid,uuid,uuid,text) to authenticated;
grant execute on function public.return_equipment(uuid,text) to authenticated;