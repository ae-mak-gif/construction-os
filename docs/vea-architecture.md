# BuildFlow Virtual Executive Assistant (VEA)

## Product decision

VEA is the executive experience built on top of BuildFlow AI. It is not a second assistant and it does not replace the existing BuildFlow operational modules. The VEA command centre now hosts the live conversational workspace; the legacy standalone AI Assistant remains unchanged for other routes.

## Runtime and deployment boundaries

- Frontend: existing Vite + React + TypeScript application.
- Source control: `feature/buildflow-vea-integration`; production `main` is not changed by this work.
- Development database: dedicated Supabase project `amqknbijdjpcapwkeyyh`. Production Supabase remains isolated.
- Vercel Preview variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are now branch-scoped to the VEA feature branch and point to development.
- AI Gateway authentication uses Vercel deployment OIDC. No long-lived provider key is exposed in the browser or committed to source.
- Model: `openai/gpt-4.1-mini`, selected from the live AI Gateway catalogue for tool-use support and low per-token pricing.
- Hosting: keep deployments batched into coherent checkpoints to protect the Hobby deployment quota.

## Security and data flow

1. The browser sends a user message and Supabase access token to the same-origin Vercel `/api/vea-chat` function.
2. The Vercel function enforces same-origin POST requests and forwards the verified session token plus the deployment-scoped `x-vercel-oidc-token` to the development Supabase Edge Function.
3. The `vea-chat` Edge Function verifies the Supabase user with `auth.getUser` and calls the existing `vea-context` function using the caller's JWT.
4. `vea-context` requires exactly one active organisation membership and reads BuildFlow data through the caller's RLS-scoped session.
5. The chat function uses the Supabase service-role client only for VEA system records after identity and organisation scope have been verified. It never uses service role to retrieve operational business data.
6. The Edge Function calls AI Gateway with the Vercel OIDC token. The token and all server credentials remain server-side.
7. Conversations, user/agent messages, agent runs, token usage and audit events are persisted with organisation scope.
8. A per-user short-window rate limit is enforced server-side.

## First-wave agents and tools

The Executive Orchestrator routes to four first-wave specialist agents:

- Executive Orchestrator — cross-functional briefings and prioritisation.
- Project Intelligence — project status, tasks, delivery dates, risks and calendar.
- Finance Intelligence — invoice status and due dates.
- Procurement Intelligence — purchase-request visibility.

The model receives only the data slice allowed for the selected agent. The read-only tool catalogue is server-enforced and includes executive context, projects, tasks, risks, invoices, purchase requests and upcoming calendar records. Tool keys are recorded with every agent run.

The People & Workforce, Research & Documents, Delegation & Accountability, and Risk & Compliance capabilities remain planned; the runtime must not claim those specialist datasets are connected.

## Action policy

- All connected tools are read-only.
- No arbitrary SQL, arbitrary URL fetch, or generic database mutation tool exists.
- No model-selected tool names or permissions are trusted.
- No payments, transfers, procurement commitments, contracts, employment decisions, legal commitments, external communications, approvals, or business-record writes are enabled.
- Human approval and action execution remain separate future workflows. Approval alone will never grant execution permission.

## Persistence and audit

- `vea_conversations` stores the organisation-scoped conversation and title.
- `vea_messages` stores both user and agent messages.
- `vea_agent_runs` records selected specialist, model, tool keys, status, timestamps and token usage.
- `vea_audit_events` records successful and failed agent runs.
- The browser cannot update or delete trusted agent-run outcomes or audit records.

## Verification still required

The code and development Edge Function must pass the following end-to-end checks in the Vercel Preview deployment:

- unauthenticated and invalid JWT requests are rejected;
- no active or multiple active organisation memberships are rejected;
- a conversation ID owned by another user or organisation is rejected;
- same-origin enforcement and OIDC forwarding work on the deployed Vercel function;
- the four first-wave routes return answers grounded in their allowed data slices;
- messages, agent runs, token usage and audit events are persisted;
- rate limits and AI Gateway credit/budget failures are handled;
- no business write or approval action is exposed;
- existing BuildFlow modules, data and production remain unchanged.

## Next delivery wave

After the first-wave runtime is verified: implement the remaining four specialists, then approval proposals and human hand-off, then narrowly scoped write actions with re-checks, action-specific permissions, idempotency and audit. Only after that should n8n and external integrations be connected.
