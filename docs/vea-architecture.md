# BuildFlow Virtual Executive Assistant (VEA)

## Product decision

VEA is the executive experience built on top of BuildFlow AI. It does not replace the operational modules or the legacy standalone AI Assistant. The Executive Orchestrator is the user-facing coordinator for specialist analysis.

## Runtime and deployment boundaries

- Frontend: Vite + React + TypeScript.
- Source branch: `feature/buildflow-vea-integration`; production `main` remains untouched.
- Development Supabase project: `amqknbijdjpcapwkeyyh`.
- Vercel Preview uses branch-scoped `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` pointing to development.
- Model provider: Groq API, called only from the Supabase Edge Function. The `GROQ_API_KEY` is a Supabase development Edge Function secret; it must never be committed or exposed to the browser.
- Model: `openai/gpt-oss-20b` through Groq's OpenAI-compatible chat completions endpoint.
- Vercel's API proxy is same-origin and forwards the authenticated Supabase user JWT. It does not require Vercel AI Gateway billing or OIDC.
- Batch changes into coherent checkpoints to protect the Vercel Hobby deployment quota.

## Security and data flow

1. The browser sends a user message and Supabase access token to the same-origin Vercel `/api/vea-chat` function.
2. The Vercel function enforces same-origin POST requests and forwards the user JWT and development Supabase publishable key.
3. The `vea-chat` Edge Function verifies the user with Supabase Auth and invokes `vea-context` using the caller's JWT.
4. `vea-context` requires exactly one active organisation membership and reads business data through the caller's RLS-scoped session.
5. The chat function uses the service-role client only for VEA system records after identity and organisation scope have been verified. It never uses service role to retrieve operational business data.
6. Groq is called server-side using the Supabase secret. No provider key or service-role key is sent to the browser.
7. Conversations, messages, specialist runs, token usage and audit events are persisted with organisation scope.
8. Rate limiting is based on user messages, not specialist run count, so a multi-specialist request does not consume multiple message slots.

## First-wave agent coordination

The first-wave runtime has three domain specialists plus the Executive Orchestrator:

- Project Intelligence — projects, tasks, risks and upcoming calendar records.
- Finance Intelligence — invoice records and due-date summaries.
- Procurement Intelligence — purchase-request visibility.
- Executive Orchestrator — routes the request, coordinates specialists when needed and synthesises their findings.

Routing is deterministic and server-controlled. A focused question invokes only the matching specialist. A cross-functional question invokes the matching specialists in parallel. An executive briefing invokes all three specialists. The Executive Orchestrator then synthesises multi-specialist findings into one response. A general question without a domain match is handled by the Executive Orchestrator against the bounded executive context.

Each specialist receives only its permitted context slice and read-only tool keys. The model cannot select arbitrary tools, change permissions or execute writes. Specialist outputs are treated as untrusted analysis, not instructions to the synthesiser.

## Planned capabilities

People & Workforce, Research & Documents, Delegation & Accountability, and dedicated Risk & Compliance remain planned. Project Intelligence can currently read the existing project risk-register slice, but this is not equivalent to a complete Risk & Compliance capability. The runtime must disclose unavailable specialist datasets and must not invent retrieved records.

## Action policy

- All connected tools are read-only.
- No arbitrary SQL, arbitrary URL fetch, or generic database mutation tool exists.
- No payments, transfers, procurement commitments, contracts, employment decisions, external communications, approvals, or business-record writes are enabled.
- Human approval and action execution remain separate future workflows. Approval alone will never grant execution permission.

## Persistence and audit

- `vea_conversations` stores organisation-scoped conversations.
- `vea_messages` stores user and final assistant messages.
- `vea_agent_runs` stores one record per specialist run and an additional Executive Orchestrator synthesis run for multi-specialist requests.
- `vea_audit_events` records each successful or failed agent run.
- The browser cannot update or delete trusted agent-run outcomes or audit records.

## Verification still required

- Authenticated Preview test with the Groq secret present in development Supabase.
- Unauthenticated and invalid JWT requests are rejected.
- Missing or ambiguous organisation membership is rejected.
- A conversation ID owned by another user or organisation is rejected.
- Same-origin enforcement works.
- Focused, cross-functional and executive-briefing routes select the expected specialists.
- Specialist context slices are bounded and responses are grounded in supplied records.
- Messages, all specialist runs, synthesis run, token usage and audit events persist.
- Rate limits count user messages and provider errors are handled.
- No business write or approval action is exposed.
- Existing BuildFlow modules, data and production remain unchanged.

## Next delivery wave

After first-wave coordination is verified: connect the remaining four specialists to their respective authorised datasets, then add approval proposals and human hand-off. Only later should narrowly scoped writes and external automations be considered, each with action-specific permissions, execution-time rechecks, idempotency and audit.
