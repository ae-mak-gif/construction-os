# BuildFlow Pilot UAT and Known-Limitations Register

**Release:** supervised Preview pilot  
**Date prepared:** 13 November 2026  
**Branch:** `fix/auth-client-access-stabilisation`  
**Preview:** https://construction-4lot9f87z-aemakazhe-9121s-projects.vercel.app  
**Pilot project:** BuildFlow Pilot Project (`BF-PILOT-001`)  
**Environment:** Development Supabase + Vercel Preview only

> This is an execution record, not evidence that the browser tests have passed. Complete the actual-result, outcome and evidence fields during testing. Do not enter real payment credentials or use irreversible commercial records.

## 1. Test accounts and role allocation

Use the already provisioned pilot accounts. Do not create duplicate identities.

| Test role | Account | Primary acceptance focus |
|---|---|---|
| Primary Admin | `aemakazhe@gmail.com` | Organisation-level administration and oversight |
| Organisation Admin | `adminsancara@gmail.com` | CRM, clients, projects, team and variation oversight |
| Project Manager | `tishandecos@gmail.com` | Programme, progress and project delivery |
| Finance User | `tishande.ai@gmail.com` | Budgets, invoices, payments and financial reporting |
| Site Manager | `fe.colloquio@live.co.za` | Site diary and site delivery updates |
| External Client | `anesumakazhe@gmail.com` | Client portal scope and shared updates only |

The external client is not an internal organisation member. Its pilot share is limited to project progress and updates; documents and financials are disabled.

## 2. Browser acceptance record

For each test, record the tester, date/time, actual result, pass/fail and a screenshot or other evidence reference. Mark **Blocked** rather than Pass if a prerequisite is missing.

| ID | Tester role | Test | Expected result | Status |
|---|---|---|---|---|
| UAT-01 | Organisation Admin | Create enquiry, convert to client, create linked project and assign Project Manager | Client/project links persist; assigned PM can access the project | Not run |
| UAT-02 | Project Manager | Create programme activity and update project progress | Activity and progress persist against the correct project | Not run |
| UAT-03 | Site Manager | Submit site diary entry | Diary persists and appears against the correct project | Not run |
| UAT-04 | Procurement-authorised user | Create purchase request, approve/create PO, post partial receipt, then final receipt | PO state progresses correctly; stock increases by actual received quantities; over-receipt is prevented | Not run |
| UAT-05 | Finance User | Create and issue test invoice; record pending payment; confirm payment | Invoice balance/status and Finance totals reconcile | Not run |
| UAT-06 | Authorised variation approver | Submit and approve a test variation | Approved amount is applied once to project contract value; decision is auditable | Not run |
| UAT-07 | Authorised variation approver | Reject a separate test variation | Variation is rejected; project contract value is unchanged | Not run |
| UAT-08 | External Client | Sign in and open shared pilot project | Only shared progress/updates are visible; documents and financials are not accessible | Not run |
| UAT-09 | Project Manager | Attempt Finance view and role administration | Access is denied or controls are absent | Not run |
| UAT-10 | Finance User | Attempt project delivery update and role administration | Access is denied or controls are absent | Not run |
| UAT-11 | Site Manager | Attempt Finance view and role administration | Access is denied or controls are absent | Not run |
| UAT-12 | VEA user with `agents.view` and relevant module permissions | Run cross-functional portfolio briefing across all six UAT projects | Three specialists execute in parallel; Executive Orchestrator synthesises one ranked briefing; run records and conversation persist; no write actions | Retest required — VEA version 11 deployed; the latest pre-v11 run still hit Groq 429 limits |

### Execution notes

- Use clearly labelled test records, for example names prefixed with `UAT-`.
- For finance, use test amounts only and do not connect or use real payment credentials.
- For procurement, use a test item/supplier or an explicitly designated pilot item. Do not receive goods against a real commercial PO.
- Capture both the successful role's expected access and the denied role's restricted access.
- Clean up test records through approved application workflows. Do not delete production/customer data or bypass application controls.
- If an unexpected permission or cross-organisation result occurs, stop that test and record it as a release-blocking defect.

### Per-test result template

Copy one block for each test:

- Test ID:
- Tester role:
- Date/time:
- Preview deployment/commit:
- Preconditions:
- Actual steps performed:
- Actual result:
- Outcome: Pass / Fail / Blocked
- Evidence reference:
- Defect/issue reference:
- Cleanup completed:

## 3. Known limitations and release gates

| ID | Limitation / risk | Current evidence | Required action | Gate |
|---|---|---|---|---|
| KL-01 | VEA orchestration and synthesis require live retest | Groq specialist calls returned findings, but the prior Executive synthesis failed. Corrective multi-agent orchestration is now deployed as `vea-chat` version 6 in Development. | Re-run portfolio synthesis; inspect parent and child agent-run records, persistence, context coverage and error handling. | Before VEA is included in pilot scope |
| KL-02 | Subscription and tier entitlements are incomplete | No verified end-to-end plan/billing/entitlement lifecycle | Implement server-enforced Essential, Professional, Executive and Strategic Office entitlements | Before paid commercial launch |
| KL-03 | Leaked-password protection is disabled | Development Supabase Security Advisor reports `auth_leaked_password_protection` warning | Enable and verify in Supabase Auth security settings before expanding external access | Before broader external pilot |
| KL-04 | Browser UAT is incomplete | Backend rollback-only tests passed for several workflows; browser evidence not yet recorded | Complete UAT-01 through UAT-12 plus the six-project scenario matrix and resolve release-blocking defects | Before pilot sign-off |
| KL-05 | Backup/restore readiness is unverified | No verified restore drill recorded in this release checkpoint | Take a Development backup and complete a restore/recovery exercise; document outcome | Before controlled customer pilot |
| KL-06 | User and administrator guides are not yet complete | Release checklist identifies required role guides | Prepare and review role-specific quick-start guides and admin procedures | Before onboarding pilot users |
| KL-07 | Production release is not authorised | No Production migration/deployment approval | Separate migration review, verified backup, smoke test and explicit approval | Before any Production change |

## 4. Pilot acceptance decision

**Decision:** Pending.

- [ ] All required browser UAT cases passed or formally waived with documented rationale.
- [ ] No unresolved critical security, tenant-isolation, financial-integrity or data-loss defects.
- [ ] Client portal boundary verified using the external client account.
- [ ] VEA either passed live smoke tests or is explicitly excluded from pilot scope.
- [ ] Known limitations accepted by the pilot owner.
- [ ] Backup/recovery procedure and support contact confirmed.
- [ ] User/admin onboarding materials reviewed.
- [ ] Pilot owner signs off the scope, duration and success measures.

Pilot owner:
Date:
Decision: Go / No-go
Conditions or exclusions:


## Operational pilot dataset — 13 November 2026

A controlled, synthetic but relationally connected Development dataset has now been seeded for the three UAT projects. See [BuildFlow Operational Pilot Dataset](./BUILDFLOW_PILOT_DATASET.md) for the scenario register, exact starting states, role-based execution and reset rules.

The dataset is stored in the real application tables, not UI mock fallbacks. It is not customer data and does not constitute browser acceptance. UAT-02 starts with a draft PO; UAT-03 starts with a draft invoice, pending test payment and submitted variation. Complete each remaining transition through the Preview UI using the authorised account. The seed operation has three dataset-level audit markers; those are not a substitute for native per-action application audit logging.


## Six-project UAT expansion — 16 November 2026

Three additional synthetic projects (UAT-04 to UAT-06) have been inserted into Development and linked to existing synthetic UAT clients. They cover mobilisation, delayed closeout and commissioning. See [six-project scenario matrix](./BUILDFLOW_UAT_SCENARIO_MATRIX.md) and [additional seed script](../supabase/seed/pilot_operational_dataset_v2.sql). Database verification confirmed: UAT-04 has 2 tasks and 1 risk; UAT-05 has 2 tasks, 2 risks, 1 budget line and 1 unpaid synthetic expense; UAT-06 has 2 tasks, 1 risk, 1 budget line, 1 unpaid synthetic expense and 1 site diary. These are database-level checks, not browser acceptance.

## VEA rate-limit stabilisation checkpoint — 16 November 2026

Development `vea-chat` version 11 replaces concurrent specialist model calls with sequential Project → Finance → Procurement execution, separated by a short pacing delay, before Executive synthesis. This addresses the observed Groq 8,000-token-per-minute limit, where parallel requests exhausted the shared budget before synthesis. Specialist completion budgets are reduced to 350 tokens each and synthesis to 650; specialist context is capped at 3,600 characters, history at two short messages, and supplementary table reads at 15 rows. Synthesis receives a bounded delayed retry rather than an immediate retry. Failed specialists remain explicitly marked as coverage gaps; the system does not present disconnected specialist reports as a complete briefing. Token usage is retained in run metadata where available. Specialist reads continue to use the caller JWT and RLS; service-role access is limited to orchestration/audit persistence. All agents remain read-only. Deployment is confirmed ACTIVE in Development with JWT verification enabled. A new authenticated live six-project smoke test is still required; the prior 429 failure has not yet been proven resolved by a fresh end-to-end request.


## Development completion checkpoint — 16 November 2026

### VEA reliability update — version 12

- `vea-chat` version 12 is ACTIVE in Development with JWT verification enabled.
- Reduced specialist completion allowance from 550 to 300 tokens, specialist retry allowance to 350, and executive synthesis allowance to 650 (800 on retry).
- Reduced specialist context to 3,000 characters, capped project-specific records at two per project per dataset, compacted record fields, reduced shared procurement records, and removed repeated conversation history from specialist requests.
- Specialists remain sequential with an 8-second pacing delay. A 429 activates a circuit breaker: remaining specialist calls and synthesis are stopped, the run is marked failed with a retry-after hint, and no immediate retry is sent into the exhausted rate-limit window.
- The most recent six-project run before version 11 (16 Nov, 08:39 UTC) completed Project Intelligence but Finance and Procurement failed with Groq HTTP 429. The Executive Orchestrator correctly disclosed that coverage was incomplete.
- **Acceptance status: pending.** A fresh authenticated six-project run after version 11 must complete all three specialists and synthesis before VEA can be marked accepted.

### Native business audit trail

- Applied Development migration `20261116084851_native_business_audit_triggers`.
- Installed transaction-bound audit triggers on 40 business tables covering organisation membership, CRM, projects, delivery, procurement, inventory, finance, variations, client shares and related records.
- Each event records the authenticated actor, organisation, operation, target, changed column names, status transition, project reference where applicable and a non-sensitive record reference. It does not store full row snapshots, message content, payment details or document contents.
- Verified a project update produces a `security_audit_events` row with the correct actor, target and changed-column list. The verification transaction was rolled back, leaving no test mutation.
- This is database-level verification; browser-visible audit history and role-based audit access still require acceptance testing.

### Current release gates

- Supabase Security Advisor: leaked-password protection remains disabled and requires an administrator decision before broader external access.
- Performance Advisor: 63 unindexed foreign keys and one multiple-permissive-policy warning remain for review; no health findings were returned. These have not been blindly remediated.
- Browser UAT remains pending for procurement, finance, variations, project delivery, least-privilege role boundaries and external client portal.
- Backup/restore drill remains pending. The available connected Supabase operations do not expose a Development backup-creation workflow; complete the backup and restore exercise through the Supabase Dashboard and record the evidence.
- Subscription and paid-tier entitlement lifecycle remains outside the supervised pilot scope.
- No Production database, schema, environment variable or deployment changes have been made. Draft PRs remain unmerged.

### VEA version 12 circuit-breaker checkpoint

- Version 12 is deployed ACTIVE in Development. If a specialist hits Groq HTTP 429, remaining specialist calls are marked skipped/failed with an explicit reason, a `vea.provider.rate_limited` audit event is written, and the parent run returns HTTP 429 with a 60-second retry hint. Executive synthesis is not attempted in that exhausted window.
- This prevents repeated failed requests and misleading partial executive output during a provider rate-limit event. It does not increase Groq's quota; token compaction in version 11 is intended to reduce the likelihood of reaching the limit.
- Post-v12 runtime acceptance remains pending.


### Audit history interface — 16 November 2026

- Settings now includes a Security & Activity Audit panel that reads the latest 50 organisation events from `security_audit_events`.
- The panel relies on the database `audit.view` RLS permission; it does not bypass access control or expose full row snapshots.
- The interface has been committed to the Preview branch. Browser acceptance for an authorised audit viewer and a user without `audit.view` remains pending.


### VEA version 13 — portfolio coverage integrity

- Development `vea-chat` version 13 is ACTIVE with JWT verification enabled.
- Corrected per-project record counts so each project is assessed against its own returned records, not the organisation-wide table total.
- Added explicit truncation indicators for project and shared procurement datasets.
- Removed silent character truncation of specialist context. If the complete six-project context exceeds the 5,000-character safe limit, that specialist fails closed rather than receiving a partial portfolio and implying complete coverage.
- A fresh authenticated six-project runtime test after version 13 remains pending.
