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

The first VEA migration adds organization-scoped conversations, messages, agent runs, approvals, and audit events. All five tables have RLS enabled. Authenticated users can read only their active organization. Browser users may create their own conversations, human messages, agent-run requests, and approval requests. Browser users cannot update or delete approvals, agent-run outcomes, or audit records. Trusted server-side services will own those operations.

## Existing AI Assistant migration

The current `src/pages/AIAssistant.tsx` is a demo implementation backed by `src/data/mockData`; it does not call a model or a server endpoint. Preserve the useful question prompts and demo behavior while replacing its internal response function with a server-side VEA conversation API in a later implementation step. Do not label mock responses as live AI.

## Delivery sequence

1. Establish isolated VEA branch and architecture notes.
2. Add and verify the organization-scoped data foundation in `buildflow-dev`.
3. Build the VEA command-centre UI while preserving existing BuildFlow navigation and data.
4. Implement authenticated server-side orchestration and the first read-only agents (Executive, Project, Finance, Procurement).
5. Add approvals, audit logging, and action-specific tool permissions before enabling any writes.
6. Add n8n workflows and external integrations after the core permission model is tested.
7. Map feature entitlements and human support hours to the four BuildFlow SaaS tiers.

## Current implementation limits

The current app is a Vite SPA with no established server-side AI route, no connected model provider, and no Supabase Edge Functions in the development project. Do not install an agent framework or expose model/API credentials in client code until the server runtime, model routing, and environment variables are selected and tested.
