# BuildFlow MVP Version 1.0 — Product Scope and Release Gate

**Status:** Proposed scope; not approved for external release  
**Date:** 20 November 2026  
**Working product name:** BuildFlow (internal name; naming clearance remains a later commercial-readiness task)  
**Repository:** `ae-mak-gif/construction-os`  
**Environment policy:** Development and Preview only; Production remains protected.

## 1. Purpose

BuildFlow MVP 1.0 is the smallest dependable, usable release that enables a small or medium-sized construction company to manage a real project through a connected set of operational workflows.

**MVP promise:** Give a construction company one controlled workspace to coordinate projects, tasks, budgets/BOQ, procurement, basic resources, site issues and client updates, with records persisted and access controlled by organisation and role.

The MVP is not a claim that every planned ConTech capability is already implemented. It is a deliberately limited first release, subject to the release gates below.

## 2. Target users and initial market

Primary initial customer: a small or medium-sized construction contractor in Zimbabwe managing one or more active building or civil construction projects.

Initial user roles:
- Organisation administrator: manages organisation users, roles and settings.
- Project manager: manages assigned projects, programme/tasks, procurement coordination and reporting.
- Finance/commercial user: views and manages authorised BOQ, budget, commitments, invoices/variations and cost information.
- Site manager/supervisor: records assigned site progress, tasks, issues, quality/safety observations and resource usage.
- External client: sees only explicitly shared project information, updates and documents.

The first pilot should involve 3–5 selected companies, with one or two representative projects per company where practical. Pilot participation is not permission to use Production or sensitive live data before security and data-handling gates pass.

## 3. MVP functional scope

A module is included only when its actual controls, permissions, persistence and connected behaviour pass the relevant tests. A visible screen or existing database table alone does not qualify.

### A. Organisation, identity and access
- Sign-in and account/profile basics.
- Organisation membership and role-based permissions.
- Strict organisation/tenant data isolation enforced server-side.
- User and role administration appropriate to the pilot.
- Auditable actor attribution for material actions.

### B. Dashboard
- Organisation/project overview based on real permitted records.
- Task, project and activity summaries that do not misattribute users or expose unauthorised data.
- Honest loading, empty, error and unavailable states.

### C. CRM and project setup
- Record prospective clients/enquiries and client details.
- Create and maintain projects with client, project manager, dates, status and key metadata.
- Link project records to relevant operational modules.
- MVP may use a simple project setup flow; advanced CRM pipelines are not a release dependency.

### D. Project delivery: tasks and programme
- Create, assign, update and close tasks/milestones.
- Record due dates, status, priority and responsible users.
- Show project progress using a defined, consistent calculation or explicitly labelled manual progress.
- Persist changes and show clear save/error feedback.
- MVP does not promise advanced critical-path scheduling or full resource-loaded planning.

### E. BOQ, estimates and cost control
- Create and maintain basic BOQ/estimate items with descriptions, units, quantities and rates.
- Calculate line totals and project budget totals consistently.
- Provide controlled updates and traceable changes.
- Where actual costs, commitments or variations are displayed, define their source and calculation; do not present incomplete figures as a complete cost forecast.
- No automated BIM quantity extraction in MVP.

### F. Procurement and suppliers
- Maintain basic supplier records.
- Raise purchase requests against a project and relevant budget/BOQ category where supported.
- Apply authorised review/approval steps.
- Create/track purchase orders and record delivery/receiving status where implemented.
- Prevent unauthorised approvals and duplicate or inconsistent transitions.
- Supplier self-service portals, logistics tracking and automated price intelligence are excluded.

### G. Basic resources: inventory, labour and equipment
- Record the minimum stock/material movements required by the tested pilot workflow.
- Maintain basic labour/staff and equipment records where used by that workflow.
- Link usage/allocation to the correct project and authorised user.
- Advanced payroll, GPS/telematics, predictive maintenance and automated demand planning are excluded.

### H. Site, risk, quality and safety
- Record project/site updates and progress notes.
- Record and track basic risks, quality observations, defects and safety issues.
- Assign responsibility and status; retain evidence and action history where supported.
- Mobile offline capture, geotagged evidence and digital inspection/sign-off suites are future scope unless separately proven and approved.

### I. Documents and communications
- Upload/manage project documents using the supported storage path and permissions.
- Maintain clear project association and access boundaries.
- Send or record internal project communications and updates.
- Client portal exposes only explicitly shared project information and documents.
- Do not expose private internal notes, financial details or other projects to clients.

### J. Reports and VEA
- Provide basic project status, task, procurement and cost/BOQ summaries using real, permission-filtered records.
- VEA may provide an early read-only executive/project briefing only where responses are grounded in current authorised data, disclose missing/incomplete data and identify source records.
- AI-generated recommendations are advisory, not approvals, commitments, certified valuations or autonomous writes.
- Predictive claims require separate validation against observed outcomes and are not part of the MVP promise.

## 4. MVP end-to-end reference workflow

At least one representative project must complete this journey in Development/Preview with persisted, traceable records:

1. Organisation administrator invites/configures users and roles.
2. Project manager records a client and creates a project.
3. Project manager creates a basic BOQ/budget and initial tasks/milestones.
4. Authorised user raises a project purchase request.
5. Designated approver approves or rejects it; the action and actor are traceable.
6. Procurement user creates/updates the purchase order and records delivery/receipt where supported.
7. Site user records progress, tasks, material usage and a quality/risk/safety issue.
8. Project manager records a variation or cost update where that capability is included and tested.
9. Finance/project manager reviews available budget, procurement and actual-cost information with clear calculation boundaries.
10. Project manager shares an approved update/document with the external client.
11. Dashboard and reports reflect the same underlying records after refresh.

Any step not supported end-to-end must be explicitly marked out of scope for the first pilot, rather than simulated or represented as complete.

## 5. Explicitly deferred beyond MVP 1.0

These remain part of the broader eight-checkpoint ConTech roadmap and are not cancelled:
- IFC import, 3D BIM viewing, model issue coordination, model-linked quantities and 4D/5D BIM.
- Advanced mobile/offline field operations, geotagged photo evidence, drone/site imagery workflows.
- GPS/telematics, equipment utilisation analytics and predictive maintenance.
- Advanced workforce timesheets and productivity analytics.
- Supplier portals, delivery/logistics tracking, material-price intelligence and automated reorder/demand planning.
- Validated predictive AI for delays, cost overruns, shortages, cash flow, safety or quality.
- Complex accounting integrations and customer-configurable automation.
- Advanced subscription billing and broad self-service commercial onboarding until separately release-tested.

## 6. MVP release gates — mandatory

MVP is not cleared for external use until every applicable gate is supported by recorded evidence:

1. **Security and tenant isolation:** authenticated tests prove users cannot read or change another organisation's records; role permissions are enforced server-side; client access is restricted to explicitly shared records.
2. **Environment separation:** Preview is proven to use Development resources; Production remains isolated and unchanged.
3. **Data and migrations:** migration history is reconciled before any schema migration/replay; backup and recovery approach is documented and tested to the extent required for the pilot.
4. **Core persistence:** create/read/update/archive actions for each included module persist after refresh and are reflected consistently in related modules.
5. **Workflow integrity:** the reference workflow above passes, or excluded steps are explicitly removed from the MVP promise and pilot scope.
6. **Financial integrity:** quantities, rates, totals, approvals and cost summaries are tested; rounding, currency and calculation assumptions are documented; no misleading financial totals.
7. **Error handling and auditability:** failed writes are visible and do not falsely report success; material actions have actor/time/project context; duplicate/retry behaviour is safe.
8. **UAT:** Organisation Admin, Project Manager, Finance/Commercial, Site Manager and External Client test cases are completed with evidence; critical/high-severity defects are resolved or formally block release.
9. **Operational readiness:** onboarding instructions, support contact/process, known limitations, data handling/privacy notice and incident/escalation procedure exist.
10. **Pilot approval:** pilot companies, users, projects, data boundaries, duration, success measures and exit criteria are documented and explicitly approved.

A successful CI build or Preview deployment is necessary engineering evidence but does not, by itself, satisfy these gates.

## 7. Pilot success measures

Agree numerical targets with pilot participants before onboarding. Suggested initial measures:
- At least 3 companies complete onboarding and use the platform on a real or safely anonymised project.
- Each pilot completes the agreed project-to-procurement-to-site-update-to-client-reporting workflow.
- No cross-tenant data exposure, unauthorised approval, material financial miscalculation or unrecoverable data loss.
- Core records remain consistent after refresh and between authorised roles.
- Users can complete agreed routine tasks without developer intervention.
- Capture baseline and post-pilot measures for reporting time, procurement visibility, task follow-up and record completeness.
- Record adoption, defects, support requests and user feedback; use evidence rather than assumptions to decide commercial readiness.

## 8. Delivery approach

1. Stabilise and review the existing open development PRs; retain draft status until tests and dependencies are reviewed.
2. Close Checkpoint 1 blockers and produce authenticated security/environment evidence.
3. Complete the Checkpoint 2 module/control inventory and classify each feature as MVP-included, deferred or not implemented.
4. Complete and test the MVP reference workflow through the browser using role-specific accounts.
5. Run MVP UAT and resolve release-blocking defects.
6. Prepare a controlled pilot proposal and obtain explicit approval before onboarding external companies.
7. Continue the full eight-checkpoint roadmap in parallel where safe. MVP scope does not replace, reorder, weaken or sign off any checkpoint.

## 9. Governance and non-negotiable safeguards

- This document defines proposed MVP scope; it does not certify current implementation.
- Do not claim a capability is MVP-ready until its tests and evidence exist.
- Do not merge PRs, change Production, alter Production environment variables, apply migrations, or modify live database schema/data without explicit approval.
- Development/Preview testing must use Development data and credentials only.
- n8n remains internal and inactive until its security and reliability gates pass; it is not the BuildFlow database, identity provider or permission authority.
- Do not use real customer confidential or personal data in an unapproved pilot.
- Keep the eight mandatory checkpoints as the source of truth for full product completion and sequential acceptance.

## 10. Current MVP readiness statement

**Status: MVP scope defined; implementation and release readiness not yet demonstrated.**

The current application has foundations across many MVP modules and several targeted reliability fixes. However, authenticated tenant-isolation evidence, migration reconciliation, module-by-module verification, the complete reference workflow, role-based UAT, operational readiness and pilot approval remain outstanding. Therefore, BuildFlow should currently be described as an active Development/Preview product with MVP foundations—not as a released or production-ready MVP.
