# BuildFlow Virtual Executive Assistant (VEA)

## Product decision

VEA is the executive experience built on top of BuildFlow AI. It is not a second assistant and it does not replace the existing BuildFlow operational modules. The existing AI Assistant is retained as the initial entry point and its capabilities are progressively migrated into the VEA orchestration layer.

## Runtime and deployment boundaries

- Frontend: existing Vite + React + TypeScript application in this repository.
- Source control: feature branch `feature/buildflow-vea-integration-current`; production `main` is not changed by this work.
- Authentication and tenant data: existing Supabase Auth, `organizations`, `organization_members`, and RLS membership helper.
- Development database: dedicated Supabase project `buildflow-dev` (`amqknbijdjpcapwkeyyh`). Apply VEA migrations here first. Do not apply to the production BuildFlow project until separately reviewed.
- Hosting: existing Vercel project linked to this repository. Feature-branch commits should create preview deployments.
- Automation: n8n is an integration/workflow runner, not the authorization boundary or source of truth for agent permissions.

## Logical architecture

1. VEA interface: My Day, Executive Inbox, Business Pulse, Decisions & Approvals, Delegations, Intelligence, and Human Assistant workspace.
2. Executive Orchestrator: interprets requests, chooses the relevant specialist, enforces the action policy, and combines results.
3. Specialist agents: Executive Admin, Business & Finance, Project Intelligence, Procurement, People & Workforce, Research & Documents, Delegation & Accountability, and Risk & Compliance.
4. BuildFlow tools: narrowly scoped read/write operations over existing BuildFlow modules.
5. Human support: human executive assistants receive assigned work and escalations through a restricted workspace.
6. Audit and approval services: every agent run and consequential action is traceable.

## Agent action policy

- Tier A — autonomous: read-only retrieval, summaries, monitoring, draft preparation, and briefings.
- Tier B — approval required: sending external communications, changing calendar commitments, assigning work, and updating business records.
- Tier C — human/CEO decision: payments, contracts, material financial commitments, employment decisions, and legal/commercial judgement.

Agents must not call Supabase with elevated credentials from the browser. Any privileged tool must execute server-side, derive the user from a verified session, resolve the user's active organization membership, check action-specific permission, and write an audit event. A request for approval is not itself permission to execute the action.

## Data foundation

The first VEA migrations add organization-scoped conversations, messages, agent runs, approvals, and audit events. All five tables have RLS enabled. Conversation and message visibility is limited to the creator, assigned human assistant, or an authorised organisation administrator; approvals are limited to their requester, assignee, or administrator; audit events are administrator-only. Composite foreign keys enforce same-organisation references. Browser users cannot update or delete approvals, agent-run outcomes, or audit records. Trusted server-side services will own those operations.

## First authenticated BuildFlow tool

`POST /api/vea/context` is the first read-only VEA context endpoint. It verifies the caller's Supabase session, checks active membership in the requested organisation, then reads only scoped project, task, risk, procurement, invoice, budget and project-cost summaries using the caller's publishable-key session. It does not use a service-role key, perform writes, or call a model. Module data is filtered by `has_org_permission` checks before it is returned. The VEA dashboard uses live organisation data when the endpoint succeeds; sample portfolio data remains explicitly labelled when live context is unavailable.\n\n`POST /api/vea/chat` is the first model-backed agent endpoint scaffold. It independently verifies the bearer session and active organisation membership, checks `agents.view` plus the selected specialist's module permission, and retrieves only the permitted records under the caller's JWT. It calls the Vercel AI Gateway Chat Completions API using server-only `AI_GATEWAY_API_KEY` and `VEA_MODEL` environment variables. It currently exposes four read-only specialist modes: Executive Orchestrator, Project Intelligence, Business & Finance, and Procurement. The remaining specialist roles are still planned. The endpoint does not use a service-role key, does not expose credentials to the browser, and does not execute tool calls or business writes. It returns a clear configuration error until both AI Gateway environment variables are set. Chat history is currently held in the browser session and is not yet persisted to the VEA conversation tables; persistent chat and agent-run audit writes require a separately reviewed server-side persistence path.

## Existing AI Assistant migration

The current `src/pages/AIAssistant.tsx` is a demo implementation backed by `src/data/mockData`; it does not call a model or a server endpoint. Preserve the useful question prompts and demo behavior while replacing its internal response function with a server-side VEA conversation API in a later implementation step. Do not label mock responses as live AI.

## Delivery sequence

1. Establish isolated VEA branch and architecture notes.
2. Add and verify the organisation-scoped data foundation in `buildflow-dev` (completed; five RLS-protected tables and participant-scoped policies).
3. Build the VEA command-centre UI while preserving existing BuildFlow navigation and data (initial Executive Office shell added; existing AI demo is embedded rather than duplicated). The specialist roster includes Executive Admin, Business & Finance, Project Intelligence, Procurement, People & Workforce, Research & Documents, Delegation & Accountability, and Risk & Compliance, coordinated by the Executive Orchestrator.
4. Implement authenticated server-side orchestration and the first read-only agents (Executive, Project, Finance, Procurement) (initial API and UI scaffold added; model credentials and runtime validation still required).
5. Add approvals, audit logging, and action-specific tool permissions before enabling any writes.
6. Add n8n workflows and external integrations after the core permission model is tested.
7. Map feature entitlements and human support hours to the four BuildFlow SaaS tiers. The VEA service tiers remain Essential, Professional, Executive, and Strategic Office, mapped to the corresponding BuildFlow subscription level.

## Current implementation limits

The current app is a Vite SPA with authenticated Vercel serverless read-only context and chat endpoints. The chat endpoint is prepared for Vercel AI Gateway, but it cannot call a model until `AI_GATEWAY_API_KEY` and `VEA_MODEL` are configured in the Vercel Preview environment. The first four agent modes are read-only context-grounded assistants, not autonomous agents with independent tool execution. Persistent conversation history, server-side agent-run records, durable orchestration, specialist tool registries, and human approval workflows are not yet implemented. The original BuildFlow AI Assistant remains preserved in clearly labelled demo mode. Keep all work on `feature/buildflow-vea-integration-current`; do not merge to production until preview, tenant isolation, module permissions, and model usage are tested.
