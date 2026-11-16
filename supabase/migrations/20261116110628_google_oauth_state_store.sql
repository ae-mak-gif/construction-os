create table if not exists private.google_oauth_states (
  state_hash text primary key,
  organization_id uuid not null,
  provider text not null check (provider in ('google_calendar','google_drive')),
  user_id uuid not null,
  code_verifier text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);
alter table private.google_oauth_states enable row level security;
revoke all on private.google_oauth_states from anon, authenticated;
grant all on private.google_oauth_states to service_role;
create index if not exists google_oauth_states_expiry_idx
  on private.google_oauth_states (expires_at);
