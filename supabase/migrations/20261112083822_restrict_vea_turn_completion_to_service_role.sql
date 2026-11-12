create or replace function public.vea_complete_agent_turn(
  p_run_id uuid,
  p_conversation_id uuid,
  p_agent_key text,
  p_response text,
  p_model_id text,
  p_actor_user_id uuid,
  p_input_tokens integer default null,
  p_output_tokens integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run public.vea_agent_runs%rowtype;
  v_message_id uuid;
begin
  if p_actor_user_id is null then raise exception 'Verified actor identity required' using errcode = '42501'; end if;
  if p_response is null or length(trim(p_response)) = 0 or length(p_response) > 12000 then raise exception 'Invalid assistant response' using errcode = '22023'; end if;
  if p_input_tokens is not null and p_input_tokens < 0 then raise exception 'Invalid input token count' using errcode = '22023'; end if;
  if p_output_tokens is not null and p_output_tokens < 0 then raise exception 'Invalid output token count' using errcode = '22023'; end if;

  select * into v_run from public.vea_agent_runs
   where id = p_run_id and conversation_id = p_conversation_id and requested_by = p_actor_user_id
   for update;
  if not found then raise exception 'Agent run not found for this actor' using errcode = '42501'; end if;
  if v_run.status not in ('queued', 'running') or v_run.agent_key <> p_agent_key then raise exception 'Agent run state or agent key is invalid' using errcode = '42501'; end if;
  if not exists (select 1 from public.organization_members om where om.organization_id = v_run.organization_id and om.user_id = p_actor_user_id and om.status = 'active') then
    raise exception 'Active organisation membership required' using errcode = '42501';
  end if;

  insert into public.vea_messages (organization_id, conversation_id, sender_type, sender_user_id, agent_key, content, metadata)
  values (v_run.organization_id, p_conversation_id, 'assistant', null, p_agent_key, p_response,
    jsonb_build_object('model_id', p_model_id, 'agent_run_id', p_run_id))
  returning id into v_message_id;

  update public.vea_agent_runs set status = 'completed', output_summary = left(p_response, 1000),
    model_id = p_model_id, input_tokens = p_input_tokens, output_tokens = p_output_tokens,
    started_at = coalesce(started_at, created_at), completed_at = now()
  where id = p_run_id;

  insert into public.vea_audit_events (organization_id, actor_user_id, actor_type, event_key, resource_type, resource_id, outcome, details)
  values (v_run.organization_id, p_actor_user_id, 'agent', 'vea.agent_run.completed', 'vea_agent_run', p_run_id, 'recorded',
    jsonb_build_object('conversation_id', p_conversation_id, 'agent_key', p_agent_key, 'model_id', p_model_id,
      'input_tokens', p_input_tokens, 'output_tokens', p_output_tokens));
  return v_message_id;
end;
$function$;

create or replace function public.vea_fail_agent_run(
  p_run_id uuid,
  p_actor_user_id uuid,
  p_error_code text default 'MODEL_REQUEST_FAILED'
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run public.vea_agent_runs%rowtype;
begin
  if p_actor_user_id is null then raise exception 'Verified actor identity required' using errcode = '42501'; end if;
  select * into v_run from public.vea_agent_runs where id = p_run_id and requested_by = p_actor_user_id for update;
  if not found then raise exception 'Agent run not found for this actor' using errcode = '42501'; end if;
  if v_run.status not in ('queued', 'running') then raise exception 'Agent run is no longer active' using errcode = '42501'; end if;
  if not exists (select 1 from public.organization_members om where om.organization_id = v_run.organization_id and om.user_id = p_actor_user_id and om.status = 'active') then
    raise exception 'Active organisation membership required' using errcode = '42501';
  end if;

  update public.vea_agent_runs set status = 'failed', output_summary = 'The model request failed.',
    completed_at = now(), metadata = coalesce(metadata, '{}'::jsonb) ||
      jsonb_build_object('error_code', left(coalesce(p_error_code, 'MODEL_REQUEST_FAILED'), 80))
  where id = p_run_id;

  insert into public.vea_audit_events (organization_id, actor_user_id, actor_type, event_key, resource_type, resource_id, outcome, details)
  values (v_run.organization_id, p_actor_user_id, 'agent', 'vea.agent_run.failed', 'vea_agent_run', p_run_id, 'failed',
    jsonb_build_object('error_code', left(coalesce(p_error_code, 'MODEL_REQUEST_FAILED'), 80)));
end;
$function$;

drop function if exists public.vea_complete_agent_turn(uuid, uuid, text, text, text, integer, integer);
drop function if exists public.vea_fail_agent_run(uuid, text);
revoke all on function public.vea_complete_agent_turn(uuid, uuid, text, text, text, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.vea_fail_agent_run(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.vea_complete_agent_turn(uuid, uuid, text, text, text, uuid, integer, integer) to service_role;
grant execute on function public.vea_fail_agent_run(uuid, uuid, text) to service_role;
