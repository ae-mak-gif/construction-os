# BuildFlow Pilot Release — 13 November 2026

## Release position

**Target:** supervised pilot acceptance, not general availability.

**Environment boundary**
- Git branch: `fix/auth-client-access-stabilisation`
- Supabase: Development project `buildflow-dev` (`amqknbijdjpcapwkeyyh`)
- Vercel: Preview deployments only
- Pull request: #3 — remains Draft and unmerged
- Production Supabase project, Production environment variables and Production deployments: untouched

## Stage 1 — Authentication, tenant isolation and account access

**Status: user-confirmed browser login pass.**

The user has confirmed that all six accounts now sign in successfully:
- Primary Admin
- Organisation Admin
- Project Manager
- Finance User
- Site Manager
- External Client

Database/RLS checks previously confirmed the five internal memberships resolve to one active organisation and the expected roles. The external client has no internal organisation membership and is routed to the client portal using its explicit client access link.

The client portal exposes only the explicitly shared pilot project progress and updates. Documents and financials remain disabled.

## Stage 2 — Core operational workflows

### 2.1 CRM → client → project → team

**Backend acceptance: passed in an authenticated rollback-only test.**
- Created a test enquiry.
- Converted its linked prospect to an active client.
- Created a project linked to that client.
- Assigned the Project Manager and confirmed project membership.

All test records were rolled back; no test customer/project data was retained.

### 2.2 Programme → site diary → progress

**Backend acceptance: passed in an authenticated rollback-only test.**
- Created a programme activity against a project.
- Created a site diary against the same project.
- Confirmed both records were visible in the organisation-scoped test session.

All test records were rolled back.

### 2.3 BOQ → procurement → purchase order → goods receipt

**Implementation added; database receipt logic tested.**
- Operations screens no longer substitute sample tasks, BOQ items, purchase requests, suppliers or inventory when live tables are empty.
- Procurement now reads live purchase requests, purchase orders, suppliers, inventory items and receipt transactions.
- An authorised user can create a purchase request, approve it into a purchase order, and post partial or final goods receipts.
- The goods-receipt RPC updates inventory quantity, records the receipt transaction and updates the PO status atomically.
- A rollback-only test posted two partial receipts, confirmed stock increased by the exact received quantity and the PO moved to received; an over-receipt was rejected.

**Browser acceptance still required:** test the new Procurement screen with an authorised account and a real pilot supplier/item.

### 2.4 Budget → cost → invoice → payment → reporting

**Implementation present; full browser journey still requires acceptance.**
- Finance screen reads live project budgets, invoices, payments and expenses.
- Project actual-cost reporting now uses the Cost Control budget actual amounts consistently across the dashboard, project view and Finance screen.
- Invoice creation, issue, pending payment recording, payment confirmation and reversal actions are wired to the database.
- Payment confirmation/reversal are implemented as atomic database functions with finance-approval checks and invoice-balance protection.

**Browser acceptance still required:** create a draft invoice, issue it, record a pending payment, confirm it, and verify the invoice balance/status and Finance totals. Use test values only.

### 2.5 Variation → approval → revised contract position

**Backend acceptance: passed in an authenticated rollback-only test.**
- Variation decisions are handled by an atomic database function.
- Approval requires `variations.approve`.
- An approved amount is applied to the related project's contract value in the same transaction as the variation decision.
- Rejection records a final decision without changing the project contract value.
- The test verified both paths; all test records and contract-value changes were rolled back.

## Stage 3 — Onboarding and tier enforcement

**Status: pilot provisioning works; commercial tier enforcement is not release-ready.**
- The six pilot identities and their roles have been provisioned and login-tested.
- The pilot organisation and client access are configured.
- Role/permission enforcement exists at the database and application levels.

The current release does not yet have a verified end-to-end subscription/entitlement lifecycle (plan selection, billing state, feature entitlements, upgrade/downgrade and enforcement). For this supervised pilot, provision one organisation and manage access manually. Do not sell or represent paid tier enforcement as complete.

## Stage 4 — VEA first usable release

**Implementation connected; live browser smoke test still required.**
- Replaced the old predefined-response demo UI with a real authenticated chat interface.
- Added a same-origin Vercel API proxy that forwards the caller's Supabase JWT to the Supabase `vea-chat` Edge Function; Vercel OIDC is no longer part of the model-provider path.
- Replaced Vercel AI Gateway with the direct Groq OpenAI-compatible chat-completions API using `openai/gpt-oss-20b` on Groq's free developer tier.
- The Development Supabase Edge Function now reads `GROQ_API_KEY` from the project secret store; the key must never be placed in source control or browser code.
- The model context/history and output token budget were reduced to fit the free-tier rate limits.
- The first-wave agents are Executive Orchestrator, Project Intelligence, Finance Intelligence and Procurement Intelligence.
- Context is organisation-scoped and read-only. VEA cannot write, approve, pay, purchase or execute external actions.
- VEA runs and messages are recorded for audit and usage tracking.

**Configuration and browser acceptance still required:** create a Groq API key, save it as `GROQ_API_KEY` in the Development Supabase Edge Function secrets, then send a live question and verify a model-generated answer, conversation persistence and a successful run record. The direct provider path is deployed, but it is not runtime-verified until the secret is configured and the smoke test succeeds.

Workforce, document intelligence, accountability and safety specialist capabilities are explicitly outside this first-wave runtime.

## Stage 5 — Pilot acceptance testing

**Status: account access passed; workflow acceptance outstanding.**

Run these in Preview using the appropriate role:
1. Organisation Admin: create enquiry, convert to client, create project and assign the Project Manager.
2. Project Manager: add a programme activity and update project progress.
3. Site Manager: submit a site diary and verify it appears in the project record.
4. Procurement-authorised user: create a request, issue a PO and post a receipt to an inventory item.
5. Finance-authorised user: create/issue an invoice, record a pending payment, confirm it and verify balances.
6. Organisation Admin: submit a variation for review, approve it and verify the project's contract value changes by the approved amount.
7. External Client: sign in and verify access is limited to the shared pilot project progress/updates.
8. VEA: ask one project, one finance and one procurement question; verify the answers reflect live organisation data and remain read-only.

Do not use real payment details or irreversible commercial records for testing. Use clearly labelled test entries and remove them through approved application workflows after acceptance.

## Stage 6 — Release candidate and safeguards

**Status: Preview candidate available; not approved for Production.**
- Latest changes are on the existing auth/client-access branch.
- PR #3 remains Draft and unmerged.
- Preview deployment must pass lint, TypeScript and Vite build checks.
- Production database migrations, Production environment variables and Production deployment are not authorised by this checklist.

### Known release gates
- Complete the Stage 5 browser acceptance tests.
- Configure the Groq API key in Development Supabase secrets and complete the VEA live provider smoke test; confirm actual free-tier limits and data controls before expanding pilot use.
- Complete the Finance invoice-to-payment browser test.
- Implement and verify subscription/entitlement enforcement before any tier-based commercial launch.
- Enable Supabase leaked-password protection before inviting external pilot users beyond the controlled test group. The current Supabase security advisor reports this protection is disabled.
- Before Production: take a verified backup, review the complete migration set, apply migrations through the approved release process, run tenant/role/client portal smoke tests, and obtain explicit Production deployment approval.

## Pilot decision

A **supervised Preview pilot** may proceed only after the outstanding Stage 5 browser tests pass and the VEA smoke test succeeds. This is not a general-availability or paid-tier launch. Keep PR #3 Draft and do not merge or deploy Production without explicit approval.
