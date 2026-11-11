-- BuildFlow VEA foundation
-- Applies to the dedicated buildflow-dev Supabase project first.
-- No existing BuildFlow operational tables or records are modified.

create table if not exists public.vea_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null default 'New executive conversation',
  status text not null default 'open'
    check (status in ('open', 'archived', 'handed_off')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table if not exists public.vea_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null,
  sender_type text not null
    check (sender_type in ('user', 'assistant', 'agent', 'human', 'system')),
  sender_user_id uuid references auth.users(id) on delete set null,
  agent_key text,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint vea_messages_conversation_org_fkey
    foreign key (conversation_id, organization_id)
    references public.vea_conversations(id, organization_id) on delete cascade
);

create table if not exists public.vea_agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid,
  requested_by uuid not null references auth.users(id) on delete restrict,
  agent_key text not null
    check (agent_key in (
      'executive_admin',
      'business_finance',
      'project_intelligence',
      'procurement',
      'people_workforce',
      'research_documents',
      'delegation_accountability',
      'risk_compliance',
      'executive_orchestrator'
    )),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed', 'needs_approval', 'cancelled')),
  input_summary text,
  output_summary text,
  model_id text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint vea_agent_runs_conversation_org_fkey
    foreign key (conversation_id, organization_id)
    references public.vea_conversations(id, organization_id) on delete set null
);

create table if not exists public.vea_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid,
  agent_run_id uuid references public.vea_agent_runs(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  assigned_to uuid references auth.users(id) on delete set null,
  action_key text not null,
  action_category text not null
    check (action_category in ('external_communication', 'record_change', 'financial', 'contractual', 'employment', 'legal', 'other')),
  summary text not null,
  rationale text,
  proposed_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  decision_note text,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint vea_approvals_conversation_org_fkey
    foreign key (conversation_id, organization_id)
    references public.vea_conversations(id, organization_id) on delete set null
);

create table if not exists public.vea_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null
    check (actor_type in ('user', 'human_assistant', 'agent', 'system')),
  event_key text not null,
  resource_type text,
  resource_id uuid,
  outcome text not null default 'recorded'
    check (outcome in ('recorded', 'allowed', 'blocked', 'approved', 'rejected', 'failed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vea_conversations_org_updated_idx
  on public.vea_conversations (organization_id, updated_at desc);
create index if not exists vea_messages_conversation_created_idx
  on public.vea_messages (conversation_id, created_at);
create index if not exists vea_agent_runs_org_created_idx
  on public.vea_agent_runs (organization_id, created_at desc);
create index if not exists vea_agent_runs_status_idx
  on public.vea_agent_runs (organization_id, status, created_at desc);
create index if not exists vea_approvals_org_status_idx
  on public.vea_approvals (organization_id, status, created_at desc);
create index if not exists vea_audit_events_org_created_idx
  on public.vea_audit_events (organization_id, created_at desc);

alter table public.vea_conversations enable row level security;
alter table public.vea_messages enable row level security;
alter table public.vea_agent_runs enable row level security;
alter table public.vea_approvals enable row level security;
alter table public.vea_audit_events enable row level security;

revoke all on public.vea_conversations from anon;
revoke all on public.vea_messages from anon;
revoke all on public.vea_agent_runs from anon;
revoke all on public.vea_approvals from anon;
revoke all on public.vea_audit_events from anon;

grant select, insert on public.vea_conversations to authenticated;
grant select, insert on public.vea_messages to authenticated;
grant select, insert on public.vea_agent_runs to authenticated;
grant select, insert on public.vea_approvals to authenticated;
grant select on public.vea_audit_events to authenticated;

create policy vea_conversations_select_org
  on public.vea_conversations for select to authenticated
  using ((select private.is_active_org_member(organization_id)));

create policy vea_conversations_insert_creator
  on public.vea_conversations for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select private.is_active_org_member(organization_id))
  );

create policy vea_messages_select_org
  on public.vea_messages for select to authenticated
  using ((select private.is_active_org_member(organization_id)));

create policy vea_messages_insert_human_sender
  on public.vea_messages for insert to authenticated
  with check (
    sender_type in ('user', 'human')
    and sender_user_id = (select auth.uid())
    and (select private.is_active_org_member(organization_id))
  );

create policy vea_agent_runs_select_org
  on public.vea_agent_runs for select to authenticated
  using ((select private.is_active_org_member(organization_id)));

create policy vea_agent_runs_insert_requester
  on public.vea_agent_runs for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and (select private.is_active_org_member(organization_id))
  );

create policy vea_approvals_select_org
  on public.vea_approvals for select to authenticated
  using ((select private.is_active_org_member(organization_id)));

create policy vea_approvals_insert_requester
  on public.vea_approvals for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and (select private.is_active_org_member(organization_id))
  );

create policy vea_audit_events_select_org
  on public.vea_audit_events for select to authenticated
  using ((select private.is_active_org_member(organization_id)));

-- Deliberately no authenticated UPDATE/DELETE policies:
-- approvals, agent outcomes, and audit records must be changed only by
-- trusted server-side code after authorization and approval checks.
