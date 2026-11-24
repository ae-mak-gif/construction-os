# BuildFlow MVP — Pilot Onboarding, UAT and Support Playbook

**Status:** Draft operational playbook; use only after pilot go/no-go approval  
**Audience:** Internal pilot owner and authorised participant administrators

## 1. Before the first participant is invited

Confirm the following evidence is available:
- Approved MVP scope and participant-specific enabled-module list.
- Accepted security/tenant-isolation and environment-separation tests.
- Migration reconciliation and backup/restore evidence.
- Accepted core persistence and integrated workflow tests.
- UAT sign-off for Organisation Admin, Project Manager, Finance/Commercial, Site Manager and External Client roles where included.
- No unresolved P0/P1 release blockers.
- Privacy notice, pilot agreement, data-processing terms and acceptable-use terms reviewed.
- Named support owner, incident contact, escalation route and support hours.
- Data export, account closure and deletion process tested.
- Production environment and release process separately reviewed and approved.

If any item is missing, onboarding is paused.

## 2. Participant onboarding checklist

For each organisation:
- [ ] Confirm company identity, executive sponsor and nominated administrator.
- [ ] Confirm signed pilot agreement and data/privacy terms.
- [ ] Confirm approved project(s), intended workflow and excluded capabilities.
- [ ] Create organisation using the approved provisioning procedure.
- [ ] Invite each user individually; never share accounts.
- [ ] Assign minimum necessary roles and project memberships.
- [ ] Verify user can access only their organisation and assigned project data.
- [ ] Verify external client access is disabled unless specifically included and tested.
- [ ] Confirm demo/sample mode is disabled for the participant workspace.
- [ ] Confirm the participant understands known limitations and support route.
- [ ] Record onboarding date, users/roles, project identifiers and consent/approval references.

Do not put passwords, access tokens or secret keys into this checklist.

## 3. Role-based orientation

| Role | Orientation focus | Practical exercise |
|---|---|---|
| Organisation Admin | Users, roles, organisation settings and access revocation | Add a test user with least privilege; confirm access boundaries |
| Project Manager | Project setup, tasks, BOQ, procurement coordination and reporting | Create/update an approved project record and review project status |
| Finance/Commercial | BOQ/cost views, invoice/variation features if included, approvals | Verify a permitted transaction and calculation; test denied action |
| Site Manager/Supervisor | Site progress, assigned tasks and issue records | Record a progress update and assigned issue/action |
| External Client | Shared project updates/documents only | Open explicitly shared content and attempt a restricted route |

Training should use synthetic training records or approved participant data only after the security gate passes.

## 4. Standard UAT evidence template

For every test capture:
- Test ID and date/time.
- Organisation, project and role (avoid unnecessary personal data).
- Preview/release version and environment.
- Preconditions and test data reference.
- Exact steps.
- Expected result.
- Actual result.
- Pass/fail/blocked.
- Screenshot or non-sensitive log reference.
- Defect ID and severity, if applicable.
- Tester and retest outcome.

Never include passwords, secret keys, session tokens or unnecessary personal data in screenshots or issue reports.

## 5. Core acceptance scenarios

**Identity and access**
1. Sign in as each nominated role.
2. Confirm organisation and role identity are correct.
3. Attempt a restricted module/action.
4. Confirm denial is enforced by the server, not merely by hiding a button.
5. Attempt to access another organisation's known test record; confirm denial.
6. Revoke a test user's access and confirm it takes effect.

**Project and task**
1. Create/open an authorised project.
2. Create and assign a task to an authorised project member.
3. Update status and due date.
4. Refresh and confirm persistence.
5. Confirm dashboard/project views show consistent data.

**BOQ and procurement**
1. Create/update an approved BOQ item with valid unit, quantity and rate.
2. Verify line and project totals, rounding and currency.
3. Create a purchase request linked to the correct project and supported budget/BOQ reference.
4. Test approval and rejection with authorised and unauthorised users.
5. Confirm actor, time, project and status are traceable.
6. Refresh and confirm persistence.
7. Record receiving only if that workflow is included and tested.

**Site and quality**
1. Record an authorised progress update.
2. Create a risk/quality/safety issue if included.
3. Assign an owner and status.
4. Confirm evidence and history remain linked to the correct project.

**Client sharing**
1. Share only an approved update/document.
2. Sign in as the external client.
3. Confirm only the explicitly shared project information is visible.
4. Attempt to open internal notes, other projects and restricted financial information; confirm denial.

**Reports and VEA**
1. Compare report values with source records.
2. Confirm filters respect organisation and role.
3. If VEA is enabled, inspect cited/source records, freshness and missing-data disclosures.
4. Confirm VEA cannot approve, commit or write records.

## 6. Weekly pilot operating rhythm

- Monday: review active users, workflow progress, open defects and planned activities.
- Mid-week: provide office-hour support and observe one real workflow where permitted.
- Friday: review completed workflows, feedback, support burden, adoption and risks.
- Maintain a decision log for scope changes, access changes, incidents and release changes.
- Provide a short weekly status to each sponsor: activity, progress, known issues, next steps.

The pilot owner should avoid promising a fix date until engineering has triaged and committed to it.

## 7. Support and incident handling

Support intake should capture:
- Organisation and affected project.
- User role, module and approximate time.
- What the user was trying to do.
- Expected and actual behaviour.
- Whether work is blocked and a safe workaround exists.
- Screenshot/log reference with secrets and unnecessary personal data removed.

Escalate immediately for suspected cross-tenant exposure, account compromise, unauthorised approval, data loss/corruption or materially incorrect financial output. Suspend the affected workflow or access path while the incident owner assesses scope. Preserve relevant evidence; do not attempt ad hoc database edits.

## 8. Exit review

For each organisation:
- Compare agreed baseline and outcome measures.
- Review weekly active use by role.
- Count completed workflow steps and interventions required.
- Review defects by severity and time to resolution.
- Record user feedback and willingness to continue/pay.
- Confirm data export, retention, deletion or extension decision.
- Obtain written sponsor feedback and approval for any testimonial separately.

## 9. Customer discovery interview guide

Ask open questions and record actual examples:
1. Walk me through the last project you delivered, from project setup to client update.
2. Which records are maintained in spreadsheets, messaging apps, paper or separate systems?
3. Where do delays, duplicated work or missing information most often occur?
4. How are BOQ changes, purchase requests and approvals linked today?
5. How do site teams report progress and issues to the office?
6. How do you prepare project and client status reports?
7. What information would you not put into a cloud platform without specific safeguards?
8. Who would approve buying a tool like this, and what would they need to see?
9. What would make you stop using a project platform?
10. If the product reliably solved the agreed problem, what budget range or buying model would be realistic?

Do not lead participants toward a preferred answer. Separate observed current behaviour from hypothetical willingness to pay.

## 10. Pilot decision record

At the end of each review, record:
- Decision: continue, pause, extend or exit.
- Evidence considered.
- Open P0/P1/P2/P3 issues.
- Data/security implications.
- Scope or access changes.
- Owner and due date.
- Approval reference.

A pilot participant's request does not itself authorise a Production change, new integration, expanded data access or additional product scope.
