# BuildFlow Pilot Release — 13 November 2026

## Release position

**Target:** supervised pilot acceptance and release-candidate preparation, not general availability.

**Environment boundary**
- Git branch: `fix/auth-client-access-stabilisation`
- Supabase: Development project `buildflow-dev` (`amqknbijdjpcapwkeyyh`)
- Vercel: Preview deployments only
- Pull request: #3 — remains Draft and unmerged
- Production Supabase project, Production environment variables and Production deployments: untouched

## Stage 1 — Authentication, tenant isolation and account access

**Status: user-confirmed browser login pass.**

The user confirmed all six pilot accounts sign in successfully:
- Primary Admin
- Organisation Admin
- Project Manager
- Finance User
- Site Manager
- External Client

The five internal memberships resolve to one active organisation and the expected roles. The external client has no internal organisation membership and is routed to the client portal through explicit client access.

The client portal currently exposes only the shared pilot project's progress and updates. Documents and financials remain disabled.

## Stage 2 — Core operational workflows

### 2.1 CRM → client → project → team

**Backend acceptance: passed in an authenticated rollback-only test.**
- Created a test enquiry.
- Converted its linked prospect to an active client.
- Created a project linked to that client.
- Assigned the Project Manager and confirmed project membership.

All test records were rolled back.

### 2.2 Programme → site diary → progress

**Backend acceptance: passed in an authenticated rollback-only test.**
- Created a programme activity against a project.
- Created a site diary against the same project.
- Confirmed both records were visible in the organisation-scoped test session.

All test records were rolled back.

### 2.3 BOQ → procurement → purchase order → goods receipt

**Implementation added; database receipt logic tested; browser acceptance pending.**
- Operational screens no longer substitute sample tasks, BOQ items, purchase requests, suppliers or inventory when live tables are empty.
- Procurement reads live purchase requests, purchase orders, suppliers, inventory items and receipt transactions.
- The workspace supports purchase-request creation, approval into a PO, and partial/final goods receipts.
- The goods-receipt RPC updates inventory, records the receipt and updates PO status atomically.
- A rollback-only test verified partial receipts, exact stock increments, final PO receipt and rejection of over-receipt.

**Browser acceptance:** use a Procurement-authorised account and a clearly labelled test supplier/item. Create a request, approve/create the PO, post a partial receipt, confirm stock and PO state, then post the balance and confirm final receipt. Capture screenshots or record pass/fail and clean up through approved application workflows.

### 2.4 Budget → cost → invoice → payment → reporting

**Implementation present; full browser journey pending.**
- Finance reads live project budgets, invoices, payments and expenses.
- Project actual-cost reporting uses Cost Control budget actual amounts consistently across Dashboard, Projects and Finance.
- Invoice creation/issue, pending-payment recording, payment confirmation and reversal are wired to database functions.
- Payment confirmation/reversal functions enforce finance approval and invoice-balance protections.

**Browser acceptance:** create a clearly labelled test invoice, issue it, record a pending payment, confirm it, and verify invoice balance/status and Finance totals. Do not use real payment details. Verify reversal only with a test transaction and only if the UI exposes the approved reversal path.

### 2.5 Variation → approval → revised contract position

**Backend acceptance: passed in an authenticated rollback-only test; browser acceptance pending.**
- Variation decisions are handled by an atomic database function.
- Approval requires `variations.approve`.
- Approval updates the approved amount and related project contract value in the same transaction.
- Rejection records a final decision without changing contract value.
- Authenticated rollback-only tests verified both paths and rolled back all test changes.

**Browser acceptance:** submit a clearly labelled test variation, review it as an authorised approver, approve with a known amount and verify the contract value increases by exactly that amount. If testing rejection, verify contract value remains unchanged. Use only test project data.

## Stage 3 — Onboarding and tier enforcement

**Status: pilot provisioning works; commercial tier enforcement is not release-ready.**
- Six pilot identities and their roles have been provisioned and login-tested.
- The pilot organisation and external client access are configured.
- Role and permission enforcement exists at database and application levels.

The end-to-end subscription/entitlement lifecycle is not yet verified: plan selection, billing state, feature entitlements, upgrade/downgrade and enforcement. For the supervised pilot, provision one organisation manually. Do not sell or represent paid-tier enforcement as complete.

The agreed tier names to carry into the future entitlement design are **Essential, Professional, Executive and Strategic Office**. Their feature matrix and pricing still require explicit product decisions.

## Stage 4 — VEA first usable release

**Implementation connected; live provider smoke test pending.**
- The former predefined-response demo UI has been replaced with authenticated chat.
- The same-origin Vercel API route forwards the caller's Supabase JWT to the Supabase `vea-chat` Edge Function.
- The Edge Function calls Groq directly through the OpenAI-compatible Chat Completions API using `openai/gpt-oss-20b`.
- Vercel AI Gateway and Vercel OIDC are not required for the current model-provider path.
- The Development Edge Function reads `GROQ_API_KEY` from Supabase project secrets. Never place the key in source control, browser code or chat.
- Context is organisation-scoped and read-only. VEA cannot write, approve, pay, purchase or execute external actions.
- First-wave agents: Executive Orchestrator, Project Intelligence, Finance Intelligence and Procurement Intelligence.
- VEA runs and messages are logged for audit and usage tracking.

**Configuration and acceptance pending:** create a Groq API key and save it as `GROQ_API_KEY` in Development Supabase Edge Function secrets. Then test one project, one finance and one procurement question from the Preview UI. Verify grounded answers, conversation persistence, successful run/audit records and read-only behaviour. Confirm current Groq rate limits and data controls before using sensitive customer information. Do not paste the key into ChatGPT or commit it.

Workforce, document intelligence, accountability and safety specialist capabilities remain outside this first-wave runtime.

## Stage 5 — Pilot acceptance testing

**Status: account access passed; operational browser UAT outstanding.**

Use the latest READY Preview deployment from branch `fix/auth-client-access-stabilisation`:
- Latest Preview deployment: `dpl_5qiGPPtx2L7y2kf82537fGPz95nB`
- Preview URL: https://construction-os-git-fix-auth-cl-a2f3ad-aemakazhe-9121s-projects.vercel.app

Execute and record each case with account/role, date, expected result, actual result, pass/fail and evidence reference:

1. **Organisation Admin — CRM/project:** create enquiry, convert to client, create project and assign Project Manager.
2. **Project Manager — programme/progress:** add a programme activity and update project progress.
3. **Site Manager — site diary:** submit a diary entry and verify it appears against the correct project.
4. **Procurement-authorised user — purchasing:** create request, approve/create PO, post partial and final receipt, verify stock and PO state.
5. **Finance-authorised user — finance:** create/issue invoice, record pending payment, confirm it and verify invoice balance and Finance totals.
6. **Organisation Admin/authorised approver — variation:** submit, approve and verify the contract value changes by the approved amount; test rejection separately if practical.
7. **External Client — client portal:** sign in and verify only the shared pilot project's progress/updates are visible; documents and financials must remain inaccessible.
8. **Role boundaries — least privilege:** verify Project Manager cannot view Finance, Finance cannot update project delivery, Site Manager cannot view Finance, and none can administer roles unless explicitly authorised.
9. **VEA — read-only intelligence:** after the Groq secret is configured, ask project, finance and procurement questions; verify live organisation-scoped context, persistence and no write/action capability.

Do not use real payment details or irreversible commercial records. Use clearly labelled test entries and remove them through approved application workflows after acceptance. A backend/database test does not substitute for browser acceptance.

## Stage 6 — Release candidate package and safeguards

**Status: Preview candidate exists; release-candidate sign-off is not yet earned.**
- Latest Preview deployment is READY.
- Lint, TypeScript and Vite build checks passed for the earlier application-code Preview. Confirm the latest docs-only Preview remains READY before UAT.
- PR #3 remains Draft and unmerged.
- No Production database migrations, Production environment variables or Production deployment are authorised.

Before declaring the supervised-pilot release candidate complete, assemble and review:
- [ ] Stage 5 UAT evidence and pass/fail register.
- [ ] Seeded, clearly labelled pilot/demo data and a documented reset/cleanup procedure.
- [ ] Short user guides for Organisation Admin, Project Manager, Finance User, Site Manager and External Client.
- [ ] Administrator guide covering invitations, membership, role assignment and client-share permissions.
- [ ] Known-limitations register with owner, severity and workaround.
- [ ] Backup and recovery procedure, including a verified Development backup/restore exercise.
- [ ] Security review covering tenant isolation, role permissions, client portal scope, storage and secrets.
- [ ] VEA provider smoke-test evidence and data-handling decision.
- [ ] Pilot acceptance/sign-off record with outstanding issues and explicit go/no-go decision.

### Release gates

- Complete Stage 5 browser acceptance.
- Configure `GROQ_API_KEY` in Development and pass the VEA live smoke test, or explicitly defer VEA from the pilot scope and document that limitation.
- Complete the Finance invoice-to-payment browser test.
- Implement and verify subscription/entitlement enforcement before any tier-based commercial launch.
- Enable Supabase leaked-password protection before inviting external pilot users beyond the controlled test group. Current Development Security Advisor reports this protection disabled.
- Before Production: take and verify a backup, review the complete migration set, apply migrations through the approved release process, run tenant/role/client portal smoke tests, and obtain explicit Production deployment approval.

## Stage 7 — Controlled pilot operation

**Entry criteria:** Stage 5 accepted; Stage 6 release candidate signed off; pilot scope and support contacts agreed.

- Deploy only to an explicitly approved isolated pilot environment/customer workspace.
- Start with one controlled organisation and a limited set of named users.
- Use seeded or approved pilot data; confirm data ownership, access and retention expectations.
- Run a short onboarding session and collect structured feedback.
- Track defects, workflow completion, user friction, response times and support requests.
- Review tenant isolation and role boundaries during the pilot, not only before it.
- Maintain a rollback/disable plan and a named decision-maker for pausing the pilot.

**Exit criteria:** agreed pilot success measures met, no unresolved critical security/data-integrity issues, and a documented pilot decision.

## Stage 8 — Operational readiness and resilience

**Entry criteria:** controlled pilot evidence demonstrates stable core workflows.

- Establish application, API, database and VEA monitoring with actionable alerts.
- Define incident severity, response ownership, escalation and customer communications.
- Verify scheduled backups and perform a restore/recovery drill.
- Add audit-log review, access review, key rotation and offboarding procedures.
- Define support hours, response targets, maintenance windows and release/change control.
- Load-test critical workflows and confirm performance/cost envelopes.
- Document data retention, export, deletion and customer offboarding procedures.

**Exit criteria:** operational controls are tested, owners are assigned and recovery/support procedures are usable.

## Stage 9 — Commercial readiness

**Entry criteria:** operational readiness established and product packaging decisions approved.

- Implement the four agreed plan names: Essential, Professional, Executive and Strategic Office.
- Define a centrally managed feature/usage entitlement matrix; enforce it server-side, not only by hiding UI controls.
- Implement organisation provisioning, invitations, seat/member lifecycle, plan changes, billing state, upgrade/downgrade, suspension and cancellation.
- Integrate and test the selected payment/billing provider, receipts, failed-payment handling and reconciliation.
- Finalise pricing, terms, privacy notice, data-processing terms, acceptable-use policy and customer support commitments.
- Define onboarding, migration, training and account-management processes.
- Test plan limits, denied features, grace periods and billing edge cases.

**Exit criteria:** paid entitlements and billing are end-to-end tested, customer terms are approved, and support ownership is in place. Do not market paid plans before this gate.

## Stage 10 — Production launch and scale

**Entry criteria:** Stages 8 and 9 complete; explicit launch approval obtained.

- Approve the production release plan, migration set, environment variables and deployment target.
- Take a verified pre-release backup and rehearse rollback.
- Apply migrations through the approved production release process.
- Deploy with a staged rollout and immediate smoke tests for authentication, tenant isolation, project workflows, finance, procurement, client portal and VEA.
- Monitor error rates, latency, usage, costs and support signals during launch.
- Expand customer onboarding gradually against capacity and service targets.
- Run post-launch reviews and prioritise improvements from measured usage and customer feedback.

**Exit criteria:** production stability and customer-support targets are met over the agreed observation period.

## Pilot decision

BuildFlow is currently a **supervised Preview candidate**, not a generally available or paid-tier product. Stages 5 and 6 are the immediate work. Stages 7–10 are the agreed forward roadmap, not work completed. Keep PR #3 Draft and do not merge or deploy Production without explicit approval.
