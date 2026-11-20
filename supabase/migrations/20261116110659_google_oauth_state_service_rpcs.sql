create or replace function public.google_oauth_state_create(
  target_state_hash text,
  target_organization_id uuid,
  target_provider text,
  target_user_id uuid,
  target_code_verifier text,
  target_expires_at timestamptz
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;
  if target_provider not in ('google_calendar','google_drive')
     or length(target_state_hash) <> 64
     or length(target_code_verifier) < 32
     or target_expires_at <= now()
     or target_expires_at > now() + interval '15 minutes' then
    raise exception 'invalid OAuth state payload';
  end if;
  insert into private.google_oauth_states(
    state_hash, organization_id, provider, user_id, code_verifier, expires_at
  ) values (
    target_state_hash, target_organization_id, target_provider, target_user_id,
    target_code_verifier, target_expires_at
  );
  return true;
end;
$$;

create or replace function public.google_oauth_state_consume(target_state_hash text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare result jsonb;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;
  delete from private.google_oauth_states
  where state_hash = target_state_hash
    and consumed_at is null
    and expires_at > now()
  returning jsonb_build_object(
    'organization_id', organization_id,
    'provider', provider,
    'user_id', user_id,
    'code_verifier', code_verifier
  ) into result;
  return result;
end;
$$;

revoke all on function public.google_oauth_state_create(text,uuid,text,uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.google_oauth_state_consume(text) from public, anon, authenticated;
grant execute on function public.google_oauth_state_create(text,uuid,text,uuid,text,timestamptz) to service_role;
grant execute on function public.google_oauth_state_consume(text) to service_role;