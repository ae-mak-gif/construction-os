# BuildFlow MVP — Controlled Pilot Charter

**Status:** Proposed pilot framework; no participant is authorised or onboarded by this document  
**Cohort target:** 3–5 construction companies, subject to readiness and support capacity  
**Pilot duration:** Proposed 6–8 weeks after onboarding; confirm with participants  
**Product name:** BuildFlow is an internal working name pending market-facing name clearance

## 1. Purpose

Validate whether the bounded MVP solves practical project-coordination problems for Zimbabwean SME contractors, and whether users can complete agreed workflows safely and consistently. The pilot is a learning and evidence programme, not a general public launch.

## 2. Pilot objectives

1. Validate onboarding and role configuration for a real contractor organisation.
2. Test the selected end-to-end project workflow with persistent records.
3. Measure improvements in project visibility, procurement follow-up, task coordination and client updates.
4. Identify usability, reliability, security and support gaps.
5. Validate customer willingness to continue and pay, without presuming a final pricing model.

## 3. Participant profile and selection

Select 3–5 companies only if support capacity allows. Each participant should:
- Be a construction contractor with an active building or civil project suitable for the MVP.
- Nominate an accountable executive sponsor.
- Nominate an organisation administrator and at least one project manager.
- Provide suitable finance/commercial and site-user representatives where those modules are in scope.
- Agree to scheduled feedback and baseline/outcome measurement.
- Accept the pilot scope, known limitations and data-handling terms.

Prefer one representative project per company at first. Add a second only after the first workflow is stable and the team can support it.

Do not select a participant whose essential workflow depends on deferred capabilities such as BIM/IFC, offline capture, complex accounting integrations or predictive AI.

## 4. Pilot scope

Include only features proven in the accepted MVP candidate:
- Organisation and user setup with role-based access.
- Client/enquiry and project setup.
- Project tasks and progress.
- Basic BOQ/estimate and defined cost visibility.
- Purchase requests and authorised approvals.
- Purchase-order/receiving steps only if verified end-to-end.
- Basic site updates and selected risk/quality/safety records.
- Project documents and internal communications.
- Explicitly shared client updates and reports.
- Read-only VEA briefing only if source grounding, permissions and missing-data disclosure pass.

The final participant-specific scope must identify exactly which modules and steps are enabled. Unverified or deferred features must be disabled, excluded or clearly labelled.

## 5. Data and security boundaries

**No real customer data until Checkpoint 1 and the applicable release gates have been accepted and the pilot is explicitly authorised.**

Before onboarding:
- Verify each company has a distinct organisation/tenant boundary.
- Verify user invitations, role assignment, revocation and organisation switching.
- Prove client users see only records explicitly shared with them.
- Define data categories allowed in the pilot; exclude highly sensitive personal, financial, security-sensitive or legally restricted data unless specifically reviewed and approved.
- Agree who owns records, who may access them, processing purposes, retention, export and deletion.
- Confirm backups, recovery, incident escalation and support contacts.
- Use separate pilot organisations and projects; never share credentials between participants.
- Do not place Production credentials in n8n or Preview.
- Do not use the Development environment as a substitute for an approved customer production environment.

The pilot agreement and privacy/data-processing terms must be reviewed before participant access.

## 6. Proposed schedule

| Stage | Timing | Activities | Exit evidence |
|---|---|---|---|
| Qualification | Before pilot | Discovery, workflow fit, sponsor and users | Signed qualification record |
| Readiness | Before access | Security, scope, terms, support and data review | Pilot go/no-go approval |
| Onboarding | Week 0 | Create organisation/users, configure roles, train users | Access checklist |
| Baseline | Week 1 | Record current process and baseline measures | Baseline sheet |
| Workflow use | Weeks 2–5 | Run agreed project workflow; weekly check-ins | Usage and workflow evidence |
| Evaluation | Week 6 | Measure outcomes, defects, adoption and willingness to pay | Evaluation report |
| Extension/exit | Weeks 7–8 if agreed | Fix priority gaps, export/close or extend | Written exit decision |

Dates are relative; no calendar launch date is approved here.

## 7. Required workflow

For each pilot project, select a workflow that the current MVP can genuinely support:
1. Set up organisation users and permissions.
2. Create client and project.
3. Create BOQ/budget baseline and tasks.
4. Raise a project purchase request.
5. Review and approve/reject using the correct role.
6. Record order/receiving if supported.
7. Record a site progress update and a selected issue/action.
8. Review available project cost/procurement/task status.
9. Share an approved update or document with the client if client access is enabled.
10. Confirm records remain consistent after refresh and across authorised roles.

If any step fails or is not implemented, record it as a gap; do not simulate success or silently bypass controls.

## 8. Success measures and proposed thresholds

Agree the final targets with each participant before onboarding. Suggested cohort-level exit criteria:
- 100% of pilot organisations pass tenant-isolation and access-control checks before use.
- 100% of critical approval actions are attributable to the correct user and organisation.
- At least 80% of agreed core workflow steps are completed successfully without developer intervention.
- At least 80% of nominated weekly users are active in the agreed workflow during the final two pilot weeks.
- No unresolved critical/high security, cross-tenant, financial-integrity or unrecoverable data-loss issue.
- At least 3 of 5 pilot organisations (or all participants if fewer) indicate a credible intention to continue, subject to an agreed commercial offer.
- Baseline-to-exit measures show a useful improvement in at least two agreed operational measures per participant.

These are proposed targets, not measured results. Adjust them with pilot participants before the cohort starts.

## 9. Feedback and issue management

Weekly review:
- What work did users complete?
- Which step was slower or harder than the existing process?
- What was not trusted or understood?
- What data was missing or duplicated?
- What did users do outside the system and why?
- What support was needed?
- Would they continue using it and what would they pay for?

Classify defects:
- **P0 Critical:** tenant exposure, unauthorised access/approval, material data corruption/loss, severe financial-integrity defect. Stop affected pilot use immediately.
- **P1 High:** core workflow blocked, incorrect financial figures, repeated failed persistence, material role bypass. Suspend affected workflow until fixed and retested.
- **P2 Medium:** workaround exists but materially harms usability or efficiency.
- **P3 Low:** cosmetic or minor improvement.

Every issue needs participant, organisation/project (without unnecessary personal data), steps to reproduce, expected/actual result, severity, evidence, owner, fix version and retest outcome.

## 10. Pilot governance

- One internal pilot owner coordinates participants, support, weekly review and decisions.
- Each participant nominates an executive sponsor and organisation administrator.
- Changes to scope, data permissions or user access are recorded.
- No customer may access another customer's data.
- No customer-facing automation or AI write/approval is enabled in this pilot.
- No testimonial, logo, case study or public reference without written consent.
- Any incident involving access, data loss or suspected exposure is escalated immediately under the incident procedure.
- Pilot extension requires a written reason, revised end date and approval.

## 11. Exit, conversion and deletion

At exit, each participant receives:
- Summary of pilot activity and agreed outcome measures.
- List of known limitations and unresolved issues affecting them.
- Export of their data in the agreed supported format, where available.
- Written explanation of retention/deletion timing and any legal retention exception.
- Option to end, extend under a written plan or discuss a paid commercial offer.

Do not promise export formats, deletion timelines or service continuity until each is implemented and tested.

## 12. Go/no-go

**GO requires:** accepted Checkpoints 1–3 for the selected MVP scope; approved data/security and operational evidence; no unresolved P0/P1 release blockers; signed pilot terms; trained support owner; participant-specific scope; and explicit user approval.

**NO-GO if:** tenant isolation is unproven; Preview/Production separation is uncertain; migration history remains unsafe for the proposed release; backup/restore is untested; core writes are unreliable; financial figures are misleading; support/incident ownership is absent; or legal/data terms are not ready.

Pilot completion does not automatically authorise a paid public launch. A separate commercial go/no-go is required.
