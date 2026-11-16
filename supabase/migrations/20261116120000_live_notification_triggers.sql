-- Tenant-scoped in-app notifications for key operational events.
create policy "Users can read their own organisation notifications"
on public.notifications for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = notifications.organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
);

create policy "Users can mark their own notifications as read"
on public.notifications for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = notifications.organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.organization_members m
    where m.organization_id = notifications.organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
);

create or replace function private.create_buildflow_notifications()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  row_data jsonb := to_jsonb(new);
  org_id uuid;
  actor_id uuid;
  record_title text;
  record_message text;
  record_link text;
  recipient record;
begin
  org_id := nullif(row_data->>'organization_id', '')::uuid;
  actor_id := coalesce(
    nullif(row_data->>'created_by', '')::uuid,
    nullif(row_data->>'requested_by', '')::uuid,
    nullif(row_data->>'sender_user_id', '')::uuid,
    nullif(row_data->>'actor_user_id', '')::uuid
  );

  if tg_op = 'UPDATE' and (to_jsonb(old)->>'status') is not distinct from (row_data->>'status') then
    return new;
  end if;

  record_title := case tg_table_name
    when 'projects' then 'Project created or updated'
    when 'tasks' then 'Task created or status changed'
    when 'risks' then 'Risk created or status changed'
    when 'quality_issues' then 'Quality issue created or status changed'
    when 'safety_incidents' then 'Safety incident created or status changed'
    when 'work_orders' then 'Workshop order created or status changed'
    when 'purchase_orders' then 'Purchase order created or status changed'
    when 'invoices' then 'Invoice created or status changed'
    when 'calendar_events' then 'Calendar event created'
    else 'BuildFlow update'
  end;

  record_message := coalesce(
    nullif(row_data->>'title', ''),
    nullif(row_data->>'name', ''),
    nullif(row_data->>'description', ''),
    nullif(row_data->>'invoice_number', ''),
    nullif(row_data->>'po_number', ''),
    'A record in your organisation workspace changed.'
  );
  record_link := case tg_table_name
    when 'projects' then 'projects'
    when 'tasks' then 'ops-tasks'
    when 'risks' then 'mgmt-risk'
    when 'quality_issues' then 'mgmt-risk'
    when 'safety_incidents' then 'mgmt-risk'
    when 'work_orders' then 'mgmt-workshop'
    when 'purchase_orders' then 'ops-procurement'
    when 'invoices' then 'finance'
    when 'calendar_events' then 'ops-tasks'
    else null
  end;

  for recipient in
    select m.user_id
    from public.organization_members m
    where m.organization_id = org_id
      and m.status = 'active'
      and m.user_id is distinct from actor_id
  loop
    insert into public.notifications (organization_id, user_id, type, title, message, is_read, link)
    values (
      org_id,
      recipient.user_id,
      case when tg_table_name in ('risks','quality_issues','safety_incidents') then 'alert'
           when tg_table_name in ('invoices','purchase_orders') then 'warning'
           else 'info' end,
      record_title,
      record_message,
      false,
      record_link
    );
  end loop;

  return new;
end;
$$;

revoke all on function private.create_buildflow_notifications() from public, anon, authenticated;

drop trigger if exists notify_projects on public.projects;
create trigger notify_projects after insert or update of status on public.projects
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_tasks on public.tasks;
create trigger notify_tasks after insert or update of status on public.tasks
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_risks on public.risks;
create trigger notify_risks after insert or update of status on public.risks
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_quality_issues on public.quality_issues;
create trigger notify_quality_issues after insert or update of status on public.quality_issues
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_safety_incidents on public.safety_incidents;
create trigger notify_safety_incidents after insert or update of status on public.safety_incidents
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_work_orders on public.work_orders;
create trigger notify_work_orders after insert or update of status on public.work_orders
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_purchase_orders on public.purchase_orders;
create trigger notify_purchase_orders after insert or update of status on public.purchase_orders
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_invoices on public.invoices;
create trigger notify_invoices after insert or update of status on public.invoices
for each row execute function private.create_buildflow_notifications();

drop trigger if exists notify_calendar_events on public.calendar_events;
create trigger notify_calendar_events after insert on public.calendar_events
for each row execute function private.create_buildflow_notifications();
