-- ============================================================
-- BuildFlow / Tishande Core
-- Migration: 009_communications.sql
-- Purpose: Communications and communication activity logging
-- ============================================================


-- ------------------------------------------------------------
-- MESSAGES
-- ------------------------------------------------------------

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  client_id uuid null
    references public.clients(id)
    on delete set null,

  sender_user_id uuid null
    references auth.users(id)
    on delete set null,

  recipient_user_id uuid null
    references auth.users(id)
    on delete set null,

  subject text,

  content text not null,

  message_type text not null default 'internal'
    check (
      message_type in (
        'internal',
        'client',
        'system'
      )
    ),

  status text not null default 'sent'
    check (
      status in (
        'draft',
        'sent',
        'delivered',
        'read',
        'failed'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messages_org
  on public.messages(organization_id);

create index if not exists idx_messages_project
  on public.messages(project_id);

create index if not exists idx_messages_client
  on public.messages(client_id);

create index if not exists idx_messages_sender
  on public.messages(sender_user_id);

create index if not exists idx_messages_recipient
  on public.messages(recipient_user_id);

create index if not exists idx_messages_created
  on public.messages(
    organization_id,
    created_at
  );


-- ------------------------------------------------------------
-- COMMUNICATION LOGS
-- ------------------------------------------------------------

create table if not exists public.communication_logs (
  id uuid primary key default gen_random_uuid(),

  organization_id uuid not null
    references public.organizations(id)
    on delete cascade,

  project_id uuid null
    references public.projects(id)
    on delete set null,

  client_id uuid null
    references public.clients(id)
    on delete set null,

  contact_id uuid null
    references public.contacts(id)
    on delete set null,

  communication_type text not null
    check (
      communication_type in (
        'email',
        'sms',
        'whatsapp',
        'phone',
        'meeting',
        'note',
        'other'
      )
    ),

  direction text not null default 'outbound'
    check (
      direction in (
        'inbound',
        'outbound'
      )
    ),

  subject text,

  content text,

  external_reference text,

  communication_date timestamptz not null default now(),

  status text not null default 'completed'
    check (
      status in (
        'scheduled',
        'completed',
        'failed',
        'cancelled'
      )
    ),

  created_by uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists idx_communication_logs_org
  on public.communication_logs(organization_id);

create index if not exists idx_communication_logs_project
  on public.communication_logs(project_id);

create index if not exists idx_communication_logs_client
  on public.communication_logs(client_id);

create index if not exists idx_communication_logs_contact
  on public.communication_logs(contact_id);

create index if not exists idx_communication_logs_type
  on public.communication_logs(
    organization_id,
    communication_type
  );

create index if not exists idx_communication_logs_date
  on public.communication_logs(
    organization_id,
    communication_date
  );


-- ------------------------------------------------------------
-- UPDATED_AT TRIGGER
-- ------------------------------------------------------------

drop trigger if exists set_messages_updated_at
  on public.messages;

create trigger set_messages_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();


-- ------------------------------------------------------------
-- ENABLE RLS
-- ------------------------------------------------------------

alter table public.messages enable row level security;

alter table public.communication_logs enable row level security;


-- ------------------------------------------------------------
-- END 009
-- ------------------------------------------------------------
