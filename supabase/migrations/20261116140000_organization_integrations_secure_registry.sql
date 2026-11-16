create table if not exists public.organization_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('resend_email','meta_whatsapp','paynow_sms','google_calendar','google_drive','paynow_payments')),
  status text not null default 'disconnected' check (status in ('disconnected','pending_setup','connected','error')),
  account_label text,
  metadata jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  last_error text,
  connected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);
create index if not exists organization_integrations_org_idx on public.organization_integrations(organization_id);
alter table public.organization_integrations enable row level security;
drop policy if exists organization_integrations_admin_read on public.organization_integrations;
create policy organization_integrations_admin_read on public.organization_integrations
for select to authenticated
using (private.has_org_permission(organization_id, 'organization.manage_members'));
create table if not exists private.organization_integration_secrets (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('resend_email','meta_whatsapp','paynow_sms','google_calendar','google_drive','paynow_payments')),
  vault_secret_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (organization_id, provider)
);
revoke all on private.organization_integration_secrets from anon, authenticated;
revoke all on public.organization_integrations from anon;
grant select on public.organization_integrations to authenticated;
grant all on public.organization_integrations to service_role;
create or replace function public.user_can_manage_integrations(target_organization_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public, private
as $$ select private.has_org_permission(target_organization_id, 'organization.manage_members'); $$;
revoke all on function public.user_can_manage_integrations(uuid) from public, anon;
grant execute on function public.user_can_manage_integrations(uuid) to authenticated;
create or replace function public.integration_secret_store(target_organization_id uuid, target_provider text, target_secret text)
returns uuid language plpgsql security definer
set search_path = pg_catalog, public, private, vault
as $$
declare existing_id uuid; secret_id uuid;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then raise exception 'service role required'; end if;
  if target_secret is null or length(target_secret) < 8 or length(target_secret) > 20000 then raise exception 'invalid secret payload'; end if;
  if target_provider not in ('resend_email','meta_whatsapp','paynow_sms','google_calendar','google_drive','paynow_payments') then raise exception 'unsupported provider'; end if;
  select vault_secret_id into existing_id from private.organization_integration_secrets where organization_id=target_organization_id and provider=target_provider;
  if existing_id is null then
    secret_id := vault.create_secret(target_secret, 'buildflow:' || target_organization_id::text || ':' || target_provider, 'BuildFlow organisation integration credential');
    insert into private.organization_integration_secrets(organization_id,provider,vault_secret_id) values(target_organization_id,target_provider,secret_id);
  else
    perform vault.update_secret(existing_id,target_secret,'buildflow:' || target_organization_id::text || ':' || target_provider,'BuildFlow organisation integration credential',null);
    secret_id := existing_id;
    update private.organization_integration_secrets set updated_at=now() where organization_id=target_organization_id and provider=target_provider;
  end if;
  return secret_id;
end; $$;
revoke all on function public.integration_secret_store(uuid,text,text) from public, anon, authenticated;
grant execute on function public.integration_secret_store(uuid,text,text) to service_role;
create or replace function public.integration_secret_read(target_organization_id uuid,target_provider text)
returns text language plpgsql security definer
set search_path = pg_catalog, public, private, vault
as $$
declare result text;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then raise exception 'service role required'; end if;
  select ds.decrypted_secret into result from private.organization_integration_secrets s join vault.decrypted_secrets ds on ds.id=s.vault_secret_id where s.organization_id=target_organization_id and s.provider=target_provider;
  return result;
end; $$;
revoke all on function public.integration_secret_read(uuid,text) from public, anon, authenticated;
grant execute on function public.integration_secret_read(uuid,text) to service_role;
create or replace function public.integration_secret_delete(target_organization_id uuid,target_provider text)
returns boolean language plpgsql security definer
set search_path = pg_catalog, public, private, vault
as $$
declare secret_id uuid;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then raise exception 'service role required'; end if;
  select vault_secret_id into secret_id from private.organization_integration_secrets where organization_id=target_organization_id and provider=target_provider;
  if secret_id is null then return false; end if;
  delete from vault.secrets where id=secret_id;
  delete from private.organization_integration_secrets where organization_id=target_organization_id and provider=target_provider;
  return true;
end; $$;
revoke all on function public.integration_secret_delete(uuid,text) from public, anon, authenticated;
grant execute on function public.integration_secret_delete(uuid,text) to service_role;
