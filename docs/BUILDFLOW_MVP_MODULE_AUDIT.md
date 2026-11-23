# BuildFlow MVP 1.0 — Preliminary Module Audit

**Status:** Preliminary static-source audit; not UAT and not release approval  
**Date:** 23 November 2026  
**Scope baseline:** `buildflow/eight-checkpoint-parallel-workstreams` plus the separately defined MVP scope document. This baseline does not include every later stacked feature PR (#5–#11); findings must be rechecked against the eventual integrated candidate.

## Audit method and interpretation

This is a first-pass review of page source, data-provider usage, visible demo/mock indicators, form/save patterns and obvious error-handling markers. It does not prove that database writes succeed, RLS is correct, screens are usable, or complete workflows work in a browser.

Labels:
- **Verify** — source contains relevant implementation, but authenticated functional tests are still required.
- **Needs attention** — source inspection found a concrete warning, inconsistent feedback pattern or unproven integration.
- **Deferred** — intentionally outside MVP 1.0.
- **Not assessed** — insufficient evidence from static inspection.

Important clarification: `src/data/mockData.ts` gates sample arrays behind `VITE_BUILD_FLOW_DEMO_MODE === 'true'`; with demo mode disabled, those exports are empty arrays. CRM imports the Enquiry/Client *types* from this module but its displayed lists are projected from live `records.enquiries`, `records.clients` and `records.contacts`. Therefore, a mockData import alone is not evidence that live CRM records are mocked. Confirm the Preview build has demo mode disabled and inspect other runtime consumers before concluding that sample records are exposed.

## Preliminary module register

| MVP area | Source inspected | Preliminary status | Evidence / next verification |
|---|---|---|---|
| Organisation, identity and access | `App.tsx`, `Settings.tsx`, auth/data context | **Needs attention** | Stage 1 security and tenant-isolation evidence remains outstanding. Test each role and cross-tenant denial. Inspect Settings controls individually for actual persistence and demo-only behaviour. |
| Dashboard | `Dashboard.tsx` | **Verify** | Dashboard identity improvements exist in later PRs #4/#5. Re-audit integrated branch and verify all metrics against authorised live records. |
| CRM and clients | `CRM.tsx`, `mockData.ts` | **Verify / needs attention** | Enquiry/client lists are projected from live BuildFlow data records; mockData import supplies types. Create uses `create_crm_enquiry` RPC; stage changes use the data provider; conversion uses `convert_crm_enquiry_to_client`. Verify RPC permissions, duplicate handling, validation, refresh consistency and client/contact linking. Replace blocking `window.alert` feedback with consistent inline/toast states. |
| Projects | `Projects.tsx` | **Needs attention** | Project operations and persistence paths exist. Baseline source includes a “Demo control” label and an alert-based progress failure path; later PR #11 specifically addresses progress persistence/feedback. Re-audit PR #11's integrated version and test refresh persistence and denied writes. |
| Tasks and programme | `Operations.tsx`, `ProjectSchedule.tsx` | **Verify / needs attention** | Task create/status update and schedule forms exist. Operations source has a TODO marker and blocking alerts. Confirm live hydration, assignments, date/status validation and cross-module consistency. |
| BOQ and cost control | `Operations.tsx`, `CostControl.tsx` | **Verify** | BOQ data projection and save/delete paths exist. Confirm every displayed figure is sourced from persisted records, calculations/rounding are correct, and demo IDs cannot be edited or deleted. |
| Procurement and suppliers | `Operations.tsx`, `ProcurementWorkspace.tsx` | **Verify** | Purchase-request and procurement form/persistence paths exist. Test request → approval/rejection → PO → receiving, including role checks, duplicate submissions and audit trail. |
| Basic resources | `ConstructionRegisters.tsx`, `Operations.tsx`, `Finance.tsx` | **Not assessed** | Registers and finance surfaces exist. Need a feature-by-feature inventory to establish which staff, equipment, inventory/material movement and labour records are genuinely operational and linked to projects. |
| Site diaries | `SiteDiaries.tsx` | **Verify / limited** | Source explicitly requires a live project and says it does not create sample projects. Verify create/read/update, evidence attachment, permissions and project association. |
| Risk, quality and safety | `Management.tsx` | **Verify** | Later PR #6 improves permitted tab visibility and summary cards. Verify read/create/update restrictions with separate authorised and denied accounts; do not treat UI hiding as backend enforcement. |
| Documents | `ProjectDocuments.tsx` | **Verify** | Forms and data-provider usage exist. Verify upload/storage permissions, project association, version/history behaviour, client sharing and deletion/archive rules. |
| Communications | `Communications.tsx` | **Needs attention** | Imports message definitions from `mockData`; the module's sample arrays are demo-mode gated. Later PR #7 addresses asynchronous live-message hydration. Confirm Preview has demo mode disabled, no sample messages leak into live inbox, and send/reply persists with correct recipient permissions. |
| Client portal | `ClientPortal.tsx` | **Verify** | Project update loading and permission-aware access need authenticated tests. Later PR #9 addresses stale responses during project switching. Verify client can only access explicitly shared project data and documents. |
| Reports and VEA | `AIAssistant.tsx`, dashboard/report surfaces | **Not assessed** | Source contains AI assistant surface; no evidence here that all outputs are grounded in current authorised data. Verify provenance, freshness, missing-data disclosure and read-only advisory behaviour. |

## Concrete first-pass findings

1. **Demo-mode configuration is a release control:** sample data exports are explicitly gated by `VITE_BUILD_FLOW_DEMO_MODE`. Verify that the MVP Preview candidate has demo mode disabled, and ensure any demo deployment is clearly labelled and cannot be mistaken for a real tenant workspace.
2. **CRM is live-data backed in the inspected source:** lists are mapped from live data-provider records; create/conversion use database RPCs. The next test must verify RPC security, field validation, contact/client linking, duplicate submissions, persistence after refresh and stage updates. The mockData import is type-only in this page and should not be logged as a confirmed mock-data defect.
3. **Blocking alert feedback:** CRM, Projects, Operations, Finance and Communications contain `window.alert` paths in the inspected baseline. Standardise user-facing save/error feedback and ensure failed writes are never presented as successful.
4. **Project progress needs integrated verification:** PR #11 addresses a misleading demo label, save state, rollback and demo-record restrictions. Confirm the latest PR code is included in the test candidate and repeat authenticated save/denial/refresh tests.
5. **Asynchronous hydration fixes must be integrated and retested:** PRs #5–#9 contain important improvements to identity, permission tabs, communications, operations and client project switching. They are separate stacked draft PRs; do not assume they are all present in one deployable branch.
6. **Test workflow gaps:** no browser E2E test runner was identified in the inspected package scripts. Add a repeatable authenticated browser test approach before MVP UAT; lint/typecheck/build alone are insufficient.
7. **Cross-module integrity remains unproven:** BOQ → purchase request → approval → PO → receiving → stock/material use → actual cost → project reporting needs a complete persisted workflow test.

## Follow-up remediation workstreams (20 November 2026)

The following focused frontend remediation branches have been created as draft PRs. They are deliberately separate and **not merged**. CI and Preview build success demonstrate source/build validation only; the new branches do not yet have confirmed branch-scoped Development Supabase environment configuration or authenticated runtime/UAT evidence.

| PR | Workstream | Change | CI / Preview evidence | Remaining proof |
|---|---|---|---|---|
| [#14](https://github.com/ae-mak-gif/construction-os/pull/14) | Finance permissions and feedback | Permission checks fail closed; organisation switch resets permissions; inline error feedback; local calendar date defaults. | Latest CI passed; fresh Git-source Preview READY with Development Supabase variables scoped to this branch only. | Authenticated finance.create/approve roles, invoice/payment/expense persistence and organisation switching. |
| [#15](https://github.com/ae-mak-gif/construction-os/pull/15) | Task project/assignee integrity | Select actual organisation projects/staff by ID; require a valid project; remove hard-coded project fallback; inline task errors. | CI passed; fresh Git-source Preview READY with Development Supabase variables scoped to this branch only. | Authenticated project/staff selectors, task creation and status updates under multiple roles. |
| [#16](https://github.com/ae-mak-gif/construction-os/pull/16) | Project permission scope | Fail closed on permission lookup errors; reset access on organisation switch; scope member directory to permitted organisation. | Initial Preview build failed due an unused-variable lint error; corrected. Latest CI passed; fresh Git-source Preview READY with Development Supabase variables scoped to this branch only. | Authenticated permitted/denied roles, organisation switching and member administration. |
| [#17](https://github.com/ae-mak-gif/construction-os/pull/17) | Procurement permission scope | Fail closed on permission errors; reset permissions on organisation switch; local calendar date defaults. | CI passed; fresh Git-source Preview READY with Development Supabase variables scoped to this branch only. | Authenticated request creation, approval, receiving, inventory permission combinations and data persistence. |
| [#18](https://github.com/ae-mak-gif/construction-os/pull/18) | CRM validation and feedback | Inline validation/errors replace blocking alerts for enquiry/client create, stage updates, conversion and loss marking; prevent duplicate submissions and validate positive estimated value. | GitHub Actions #45133074850 passed; Vercel Preview READY. | Configure Development-only Preview variables with approval; test CRM RPC permissions, creation/conversion, refresh persistence, stage transitions and organisation boundaries. |

These workstreams improve the reliability of existing MVP modules but do not prove the integrated construction workflow. They remain draft PRs pending review, runtime testing and sequential checkpoint governance.

## Required next audit pass

- Reconcile the PR dependency chain and establish one candidate branch containing reviewed changes without merging to Production.
- Re-run this inventory against that exact candidate, not the older baseline.
- For every MVP control, record: role, action, expected result, actual result, persistence after refresh, related records updated, error behaviour, and evidence link/screenshot.
- Use separate organisation and role accounts for access tests; never use Production data.
- Classify each capability as **MVP included**, **deferred**, or **not implemented**. Do not count an existing page as a completed feature.
- Create defects with severity, owner/workstream, reproduction steps and retest evidence.

## Current conclusion

**MVP module audit is in progress. No module is certified MVP-ready by this static review.** The repository contains meaningful module foundations and several targeted reliability fixes, but release readiness depends on integrated-code review, authenticated browser testing, persistence checks and end-to-end workflow evidence.


## Development Preview environment and deployment verification (23 November 2026)

The user approved branch-scoped Development Supabase Preview configuration for PRs #14–#18. Ten Vercel Preview environment entries were created: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for each of the five exact feature branches. Each entry is scoped to Preview and its named Git branch; values point to the Development project. No Production environment entries were changed.

Fresh Git-source deployments were polled by deployment ID and all five reached **READY**:

| PR | Branch | Fresh Preview |
|---|---|---|
| [#14](https://github.com/ae-mak-gif/construction-os/pull/14) | `fix/finance-permission-feedback-reliability` | [Open Preview](https://construction-3h5k3bjz1-aemakazhe-9121s-projects.vercel.app) |
| [#15](https://github.com/ae-mak-gif/construction-os/pull/15) | `fix/tasks-project-linking-inline-feedback` | [Open Preview](https://construction-iy847j8o5-aemakazhe-9121s-projects.vercel.app) |
| [#16](https://github.com/ae-mak-gif/construction-os/pull/16) | `fix/project-permission-org-scope` | [Open Preview](https://construction-gp05ow8j4-aemakazhe-9121s-projects.vercel.app) |
| [#17](https://github.com/ae-mak-gif/construction-os/pull/17) | `fix/procurement-permission-scope` | [Open Preview](https://construction-ph48qpvgt-aemakazhe-9121s-projects.vercel.app) |
| [#18](https://github.com/ae-mak-gif/construction-os/pull/18) | `fix/crm-inline-feedback-validation` | [Open Preview](https://construction-29wl8fa5z-aemakazhe-9121s-projects.vercel.app) |

**Interpretation:** READY confirms Vercel build/deployment status only. It does not prove authenticated application behaviour, Supabase persistence, RLS enforcement or end-to-end workflow integrity. All five PRs remain draft and unmerged. Browser/runtime verification remains open; no Production deployment, database/schema/data change or migration was performed.
