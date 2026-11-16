-- Tighten VEA conversation privacy and enforce same-tenant references.
-- Applies after 20261111000100_buildflow_vea_foundation.sql.

alter table public.vea_conversations
  add column if not exists assigned_human_user_id uuid references auth.users(id) on delete set null;

alter table public.vea_agent_runs
  add constraint vea_agent_runs_id_org_key unique (id, organization_id);
alter table public.vea_agent_runs
  drop constraint if exists vea_agent_runs_conversation_org_fkey;
alter table public.vea_agent_runs
  add constraint vea_agent_runs_conversation_org_fkey
  foreign key (conversation_id, organization_id)
  references public.vea_conversations(id, organization_id)
  on delete set null (conversation_id);

alter table public.vea_approvals
  drop constraint if exists vea_approvals_conversation_org_fkey;
alter table public.vea_approvals
  add constraint vea_approvals_conversation_org_fkey
  foreign key (conversation_id, organization_id)
  references public.vea_conversations(id, organization_id)
  on delete set null (conversation_id);
alter table public.vea_approvals
  drop constraint if exists vea_approvals_agent_run_id_fkey;
alter table public.vea_approvals
  add constraint vea_approvals_agent_run_org_fkey
  foreign key (agent_run_id, organization_id)
  references public.vea_agent_runs(id, organization_id)
  on delete set null (agent_run_id);

drop policy if exists vea_conversations_select_org on public.vea_conversations;
drop policy if exists vea_conversations_insert_creator on public.vea_conversations;
drop policy if exists vea_messages_select_org on public.vea_messages;
drop policy if exists vea_messages_insert_human_sender on public.vea_messages;
drop policy if exists vea_agent_runs_select_org on public.vea_agent_runs;
drop policy if exists vea_approvals_select_org on public.vea_approvals;
drop policy if exists vea_approvals_insert_requester on public.vea_approvals;
drop policy if exists vea_audit_events_select_org on public.vea_audit_events;

create policy vea_conversations_select_participants
  on public.vea_conversations for select to authenticated
  using (
    (select private.is_active_org_member(organization_id))
    and (
      created_by = (select auth.uid())
      or assigned_human_user_id = (select auth.uid())
      or exists (
        select 1 from public.organization_members om
        join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
        where om.organization_id = vea_conversations.organization_id
          and om.user_id = (select auth.uid()) and om.status = 'active'
          and lower(r.name) in ('admin', 'administrator', 'owner', 'ceo', 'director')
      )
    )
  );

create policy vea_conversations_insert_creator
  on public.vea_conversations for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.is_active_org_member(organization_id))
    and (
      assigned_human_user_id is null
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = vea_conversations.organization_id
          and om.user_id = vea_conversations.assigned_human_user_id
          and om.status = 'active'
      )
    )
  );

create policy vea_messages_select_participant
  on public.vea_messages for select to authenticated
  using (
    (select private.is_active_org_member(organization_id))
    and exists (
      select 1 from public.vea_conversations c
      where c.id = vea_messages.conversation_id
        and c.organization_id = vea_messages.organization_id
        and (
          c.created_by = (select auth.uid())
          or c.assigned_human_user_id = (select auth.uid())
          or exists (
            select 1 from public.organization_members om
            join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
            where om.organization_id = c.organization_id
              and om.user_id = (select auth.uid()) and om.status = 'active'
              and lower(r.name) in ('admin', 'administrator', 'owner', 'ceo', 'director')
          )
        )
    )
  );

create policy vea_messages_insert_participant
  on public.vea_messages for insert to authenticated
  with check (
    sender_type in ('user', 'human')
    and sender_user_id = (select auth.uid())
    and (select private.is_active_org_member(organization_id))
    and exists (
      select 1 from public.vea_conversations c
      where c.id = vea_messages.conversation_id
        and c.organization_id = vea_messages.organization_id
        and (
          c.created_by = (select auth.uid())
          or c.assigned_human_user_id = (select auth.uid())
          or exists (
            select 1 from public.organization_members om
            join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
            where om.organization_id = c.organization_id
              and om.user_id = (select auth.uid()) and om.status = 'active'
              and lower(r.name) in ('admin', 'administrator', 'owner', 'ceo', 'director')
          )
        )
    )
  );

create policy vea_agent_runs_select_participant
  on public.vea_agent_runs for select to authenticated
  using (
    (select private.is_active_org_member(organization_id))
    and (
      requested_by = (select auth.uid())
      or exists (
        select 1 from public.vea_conversations c
        where c.id = vea_agent_runs.conversation_id
          and c.organization_id = vea_agent_runs.organization_id
          and (
            c.created_by = (select auth.uid())
            or c.assigned_human_user_id = (select auth.uid())
            or exists (
              select 1 from public.organization_members om
              join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
              where om.organization_id = c.organization_id
                and om.user_id = (select auth.uid()) and om.status = 'active'
                and lower(r.name) in ('admin', 'administrator', 'owner', 'ceo', 'director')
            )
          )
      )
    )
  );

create policy vea_approvals_select_participant
  on public.vea_approvals for select to authenticated
  using (
    (select private.is_active_org_member(organization_id))
    and (
      requested_by = (select auth.uid())
      or assigned_to = (select auth.uid())
      or exists (
        select 1 from public.organization_members om
        join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
        where om.organization_id = vea_approvals.organization_id
          and om.user_id = (select auth.uid()) and om.status = 'active'
          and lower(r.name) in ('admin', 'administrator', 'owner', 'ceo', 'director')
      )
    )
  );

create policy vea_approvals_insert_requester
  on public.vea_approvals for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and (select private.is_active_org_member(organization_id))
    and (
      assigned_to is null
      or exists (
        select 1 from public.organization_members om
        where om.organization_id = vea_approvals.organization_id
          and om.user_id = vea_approvals.assigned_to
          and om.status = 'active'
      )
    )
  );

create policy vea_audit_events_select_admin
  on public.vea_audit_events for select to authenticated
  using (
    (select private.is_active_org_member(organization_id))
    and exists (
      select 1 from public.organization_members om
      join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
      where om.organization_id = vea_audit_events.organization_id
        and om.user_id = (select auth.uid()) and om.status = 'active'
        and lower(r.name) in ('admin', 'administrator', 'owner', 'ceo', 'director')
    )
  );
