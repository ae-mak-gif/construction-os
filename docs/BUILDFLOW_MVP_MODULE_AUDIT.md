# BuildFlow MVP 1.0 — Preliminary Module Audit

**Status:** Preliminary static-source audit; not UAT and not release approval  
**Date:** 20 November 2026  
**Scope baseline:** `buildflow/eight-checkpoint-parallel-workstreams` plus the separately defined MVP scope document. This baseline does not include every later stacked feature PR (#5–#11); findings must be rechecked against the eventual integrated candidate.

## Audit method and interpretation

This is a first-pass review of page source, data-provider usage, visible demo/mock indicators, form/save patterns and obvious error-handling markers. It does not prove that database writes succeed, RLS is correct, screens are usable, or complete workflows work in a browser.

Labels:
- **Verify** — source contains relevant implementation, but authenticated functional tests are still required.
- **Needs attention** — source inspection found a concrete warning, demo/mock dependency, inconsistent feedback pattern or unproven integration.
- **Deferred** — intentionally outside MVP 1.0.
- **Not assessed** — insufficient evidence from static inspection.

A page importing types or seed definitions from `mockData` is not, by itself, proof that live records are mocked. Trace actual runtime data paths before classifying it as a defect.

## Preliminary module register

| MVP area | Source inspected | Preliminary status | Evidence / next verification |
|---|---|---|---|
| Organisation, identity and access | `App.tsx`, `Settings.tsx`, auth/data context | **Needs attention** | Stage 1 security and tenant-isolation evidence remains outstanding. Test each role and cross-tenant denial. Settings contains demo-related source markers; inspect each control and persistence path. |
| Dashboard | `Dashboard.tsx` | **Verify** | Dashboard identity improvements exist in later PRs #4/#5. Re-audit integrated branch and verify all metrics against authorised live records. |
| CRM and clients | `CRM.tsx` | **Needs attention** | Enquiry/client create and update paths and error handling exist. Imports Enquiry/Client types from `mockData`; confirm whether runtime lists and conversions are live-only, and replace blocking `window.alert` feedback with consistent inline/toast states. |
| Projects | `Projects.tsx` | **Needs attention** | Project operations and persistence paths exist. Baseline source includes a “Demo control” label and an alert-based progress failure path; later PR #11 specifically addresses progress persistence/feedback. Re-audit PR #11's integrated version and test refresh persistence and denied writes. |
| Tasks and programme | `Operations.tsx`, `ProjectSchedule.tsx` | **Verify / needs attention** | Task create/status update and schedule forms exist. Operations source has a TODO marker and blocking alerts. Confirm live hydration, assignments, date/status validation and cross-module consistency. |
| BOQ and cost control | `Operations.tsx`, `CostControl.tsx` | **Verify** | BOQ data projection and save/delete paths exist. Confirm every displayed figure is sourced from persisted records, calculations/rounding are correct, and demo IDs cannot be edited or deleted. |
| Procurement and suppliers | `Operations.tsx`, `ProcurementWorkspace.tsx` | **Verify** | Purchase-request and procurement form/persistence paths exist. Test request → approval/rejection → PO → receiving, including role checks, duplicate submissions and audit trail. |
| Basic resources | `ConstructionRegisters.tsx`, `Operations.tsx`, `Finance.tsx` | **Not assessed** | Registers and finance surfaces exist. Need a feature-by-feature inventory to establish which staff, equipment, inventory/material movement and labour records are genuinely operational and linked to projects. |
| Site diaries | `SiteDiaries.tsx` | **Verify / limited** | Source explicitly requires a live project and says it does not create sample projects. Verify create/read/update, evidence attachment, permissions and project association. |
| Risk, quality and safety | `Management.tsx` | **Verify** | Later PR #6 improves permitted tab visibility and summary cards. Verify read/create/update restrictions with separate authorised and denied accounts; do not treat UI hiding as backend enforcement. |
| Documents | `ProjectDocuments.tsx` | **Verify** | Forms and data-provider usage exist. Verify upload/storage permissions, project association, version/history behaviour, client sharing and deletion/archive rules. |
| Communications | `Communications.tsx` | **Needs attention** | Imports message definitions from `mockData`; later PR #7 addresses asynchronous live-message hydration. Confirm no sample messages leak into live inbox and test send/reply persistence and recipient permissions. |
| Client portal | `ClientPortal.tsx` | **Verify** | Project update loading and permission-aware access need authenticated tests. Later PR #9 addresses stale responses during project switching. Verify client can only access explicitly shared project data and documents. |
| Reports and VEA | `AIAssistant.tsx`, dashboard/report surfaces | **Not assessed** | Source contains AI assistant surface; no evidence here that all outputs are grounded in current authorised data. Verify provenance, freshness, missing-data disclosure and read-only advisory behaviour. |

## Concrete first-pass findings

1. **Demo/mock dependency needs tracing:** CRM, Projects, Operations, Communications and Settings contain imports or source markers associated with mock/demo data. Trace whether these are type-only, fallback/seed data, or actual rendered records. Do not assume all are defects.
2. **Blocking alert feedback:** CRM, Projects, Operations, Finance and Communications contain `window.alert` paths in the inspected baseline. Standardise user-facing save/error feedback and ensure failed writes are never presented as successful.
3. **Project progress needs integrated verification:** PR #11 addresses a misleading demo label, save state, rollback and demo-record restrictions. Confirm the latest PR code is included in the test candidate and repeat authenticated save/denial/refresh tests.
4. **Asynchronous hydration fixes must be integrated and retested:** PRs #5–#9 contain important improvements to identity, permission tabs, communications, operations and client project switching. They are separate stacked draft PRs; do not assume they are all present in one deployable branch.
5. **Test workflow gaps:** no browser E2E test runner was identified in the inspected package scripts. Add a repeatable authenticated browser test approach before MVP UAT; lint/typecheck/build alone are insufficient.
6. **Cross-module integrity remains unproven:** BOQ → purchase request → approval → PO → receiving → stock/material use → actual cost → project reporting needs a complete persisted workflow test.

## Required next audit pass

- Reconcile the PR dependency chain and establish one candidate branch containing reviewed changes without merging to Production.
- Re-run this inventory against that exact candidate, not the older baseline.
- For every MVP control, record: role, action, expected result, actual result, persistence after refresh, related records updated, error behaviour, and evidence link/screenshot.
- Use separate organisation and role accounts for access tests; never use Production data.
- Classify each capability as **MVP included**, **deferred**, or **not implemented**. Do not count an existing page as a completed feature.
- Create defects with severity, owner/workstream, reproduction steps and retest evidence.

## Current conclusion

**MVP module audit is in progress. No module is certified MVP-ready by this static review.** The repository contains meaningful module foundations and several targeted reliability fixes, but release readiness depends on integrated-code review, authenticated browser testing, persistence checks and end-to-end workflow evidence.
