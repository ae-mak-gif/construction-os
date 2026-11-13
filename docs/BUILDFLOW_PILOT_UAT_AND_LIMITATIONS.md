# BuildFlow Pilot UAT and Known-Limitations Register

**Release:** supervised Preview pilot  
**Date prepared:** 13 November 2026  
**Branch:** `fix/auth-client-access-stabilisation`  
**Preview:** https://construction-os-git-fix-auth-cl-a2f3ad-aemakazhe-9121s-projects.vercel.app  
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
| UAT-12 | VEA user with `agents.view` and relevant module permissions | Ask one project, one finance and one procurement question | Answers are grounded in live organisation-scoped data; no write/approval/payment/purchase action is available | Blocked — Groq secret not yet confirmed |

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
| KL-01 | VEA live inference is not runtime-verified | Edge Function deployed; `GROQ_API_KEY` has not been confirmed in Development secrets | Configure secret directly in Supabase Dashboard; run live VEA tests; never paste key into chat or source | Before VEA is included in pilot scope |
| KL-02 | Subscription and tier entitlements are incomplete | No verified end-to-end plan/billing/entitlement lifecycle | Implement server-enforced Essential, Professional, Executive and Strategic Office entitlements | Before paid commercial launch |
| KL-03 | Leaked-password protection is disabled | Development Supabase Security Advisor reports `auth_leaked_password_protection` warning | Enable and verify in Supabase Auth security settings before expanding external access | Before broader external pilot |
| KL-04 | Browser UAT is incomplete | Backend rollback-only tests passed for several workflows; browser evidence not yet recorded | Complete UAT-01 through UAT-12 and resolve release-blocking defects | Before pilot sign-off |
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
