# BuildFlow Virtual Executive Assistant (VEA)

## Product decision

VEA is the executive experience built on top of BuildFlow AI. It is not a second assistant and it does not replace the existing BuildFlow operational modules. The existing AI Assistant is retained as the initial entry point and its capabilities are progressively migrated into the VEA orchestration layer.

## Runtime and deployment boundaries

- Frontend: existing Vite + React + TypeScript application in this repository.
- Source control: feature branch `feature/buildflow-vea-integration`; production `main` is not changed by this work.
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


## Specialist-agent registry and routing contract

The source-controlled catalogue is `src/lib/vea-agents.ts`. It defines eight specialist capabilities and the first routing hints:

- Executive Orchestrator — cross-functional briefings, prioritisation and delegation coordination.
- Project Intelligence — project health, programme, milestones, tasks and delivery risks.
- Finance Intelligence — budgets, invoices, cash flow and cost variance.
- Procurement Intelligence — purchase requests, purchase orders, supplier records and materials visibility.
- People & Workforce — workforce capacity and resource allocation; it must not make HR decisions.
- Research & Documents — authorised document retrieval, evidence extraction and summaries.
- Delegation & Accountability — commitments, ownership and follow-up visibility.
- Risk & Compliance — project, safety, quality and compliance risk visibility.

The registry is a capability contract, not a live agent runtime. The current release only advertises capabilities and status; no model-driven routing or specialist execution is claimed. All agents inherit a read-only policy. The first delivery wave is Executive, Project, Finance and Procurement. The remaining four follow after the first wave is tested.


The initial tool allow-list is defined in `src/lib/vea-tools.ts`. It names only bounded read operations for executive context, projects, tasks, risks, invoices, purchase requests and upcoming calendar events. Each entry is explicitly marked `not_connected`; this prevents the catalogue from being mistaken for a working tool runtime. Server-side implementations must derive the caller identity from the verified JWT, use the caller's RLS-scoped session, and validate the requested agent/tool pair against these registries. No arbitrary SQL, arbitrary URL fetch, or generic database mutation tool is permitted.

## Orchestration contract

1. Authenticate the caller using the Supabase JWT; reject missing, invalid or expired sessions.
2. Resolve exactly one active organisation membership. If a user has multiple active memberships, require explicit organisation selection rather than guessing.
3. Route only to an allow-listed agent key from the source-controlled registry. Model output must never invent tools or permissions.
4. Load only the minimum context needed for that agent, using the caller's JWT and existing RLS policies.
5. Start with read-only tools: summaries, search, analysis, monitoring and draft preparation.
6. Record each conversation, message and agent run with organisation scope and actor identity.
7. Do not execute writes, approvals, payments, procurement commitments, contract actions or HR decisions in the initial runtime.
8. When a future action requires approval, create a proposal for a human; approval is not execution authority. Re-check the approver's permission and the underlying action permission at execution time.
9. Record tool invocation, outcome, model identifier and token usage in the audit trail. Do not store secrets or unnecessary sensitive content in logs.

## First-wave acceptance tests

- An unauthenticated request is rejected.
- A user without active organisation membership is rejected.
- A user with multiple active memberships is asked to select an organisation.
- A user cannot retrieve another organisation's VEA conversations, messages, runs or business records.
- Only registered agent keys can be selected.
- Model output cannot expand the tool allow-list or turn on write permissions.
- The four first-wave agents cannot perform writes or approval actions.
- Existing BuildFlow modules, records, demo data and navigation remain unaffected.

## Existing AI Assistant migration

The current `src/pages/AIAssistant.tsx` is a demo implementation backed by `src/data/mockData`; it does not call a model or a server endpoint. Preserve the useful question prompts and demo behavior while replacing its internal response function with a server-side VEA conversation API in a later implementation step. Do not label mock responses as live AI.

## Delivery sequence

1. Establish isolated VEA branch and architecture notes.
2. Add and verify the organisation-scoped data foundation in `buildflow-dev` (completed; five RLS-protected tables and participant-scoped policies).
3. Build the VEA command-centre UI while preserving existing BuildFlow navigation and data (initial Executive Office shell added; existing AI demo is embedded rather than duplicated; dashboard now calls a live read-only context endpoint).
4. Implement authenticated server-side orchestration and the first read-only agents (Executive, Project, Finance, Procurement). The first read-only context endpoint is deployed to buildflow-dev as Supabase Edge Function `vea-context`, with JWT verification enabled and user-scoped queries using the caller's JWT (no service-role key). It returns organisation-scoped summary data from projects, tasks, risks, purchase requests, invoices and calendar events.
5. Add approvals, audit logging, and action-specific tool permissions before enabling any writes.
6. Add n8n workflows and external integrations after the core permission model is tested.
7. Map feature entitlements and human support hours to the four BuildFlow SaaS tiers.

## Current implementation limits

The current app is a Vite SPA with no connected model provider. The VEA dashboard uses an authenticated, read-only Supabase Edge Function; no service-role key is used for business-data retrieval. The existing chat remains labelled as demo mode until a model provider is configured. The latest Vercel preview build completed successfully. Do not expose model/API credentials in client code, and do not enable agent writes until server-side model routing, tool permissions, approval checks and audit coverage are implemented and tested.
