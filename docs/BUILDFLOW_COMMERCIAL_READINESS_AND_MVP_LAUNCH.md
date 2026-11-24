# BuildFlow MVP — Commercial Readiness and Launch Workplan

**Status:** Working plan for review; not commercial approval or release authorisation  
**Working product name:** BuildFlow (internal working name only; market-facing name requires clearance and approval)  
**Initial market hypothesis:** Zimbabwean small and medium-sized building/civil construction contractors  
**Release posture:** Controlled MVP pilot after mandatory security, product and operational gates pass

## 1. Commercial objective

Prepare a focused, supportable first release that solves a real operational problem for a small construction business without presenting unfinished ConTech capabilities as available. The first release should be narrow enough to onboard, support and improve with a small team.

**Proposed MVP positioning (for validation):** One connected workspace for construction project delivery—bringing project tasks, BOQ/cost visibility, procurement requests and approvals, site records and client updates together with role-based access and traceable records.

This is a positioning hypothesis, not a claim of market leadership or a guarantee that every workflow is already production-ready.

## 2. Initial customer and buying group

**Primary ideal customer profile**
- Zimbabwe-based SME contractor delivering building or civil works.
- Managing at least one active project and coordinating an office team and site personnel.
- Currently relies on disconnected spreadsheets, messaging apps, paper records or separate tools.
- Has a director/owner or operations lead willing to sponsor a structured pilot.
- Can nominate an organisation administrator, project manager and site/finance users.

**Buying and adoption roles**
- Economic buyer: owner, managing director or operations director.
- Champion: project manager, contracts manager or commercial manager.
- Daily users: site manager/supervisor, procurement and finance staff.
- External stakeholder: client representative, only where a bounded client view is tested and approved.

**Pilot exclusions:** organisations unable to nominate an accountable sponsor; projects requiring unproven integrations or regulated/high-risk workflows; any customer requiring a production-grade SLA, accounting certification, offline operation or BIM capability not in the approved MVP scope.

## 3. Value proposition and message discipline

Lead with measurable operational outcomes:
1. Better visibility of project tasks, responsibilities and progress.
2. A clearer link between BOQ items, purchase requests and project cost information.
3. More traceable procurement requests, reviews and receiving.
4. More consistent site updates and client-facing project communication.
5. Organisation- and role-scoped access to shared project information.

Do not promise:
- Full ERP/accounting replacement or certified financial reporting.
- Advanced critical-path scheduling, BIM/IFC, offline mobile capture or GPS/telematics.
- Predictive AI, automated valuations or autonomous approvals.
- Complete cost forecasting where source data is partial.
- Availability, uptime, support response or security certifications that have not been independently established.

## 4. Offer and pricing validation

**Pilot offer (proposed):** time-limited, controlled design-partner pilot with defined users, projects, onboarding, weekly feedback and a written exit/review. Decide whether the first cohort is no-fee or paid only after assessing onboarding/support costs and participant commitment. Do not imply a commercial subscription exists until billing, entitlements and cancellation/refund handling are implemented and tested.

Before setting list prices, interview at least 8–12 qualified contractors and test:
- Current tools and direct/indirect costs of fragmented project administration.
- Most costly workflow failure (procurement visibility, task follow-up, BOQ/cost control, site reporting or client communication).
- Number of projects, active users and expected usage.
- Budget owner, procurement process and willingness to pay.
- Preferred pricing metric: organisation, active project, named user or tiered package.
- Required onboarding, training, support and data-export expectations.

Produce a price hypothesis with low/base/high scenarios and unit economics. Include hosting, email/notification, AI/VEA, support time, onboarding and payment costs. Keep variable-cost features (especially AI) bounded. No final price is approved by this document.

## 5. Market validation and sales preparation

Prepare:
- A short product overview and 5–7 minute guided demo using synthetic data.
- A one-page problem/value brief for contractors.
- A pilot invitation and qualification script.
- A discovery interview guide and structured notes template.
- A demo script using the approved reference workflow.
- A capability/limitations sheet that distinguishes available, pilot-only, planned and excluded features.
- A simple ROI worksheet using customer-provided baseline figures, with assumptions visible.

Sales sequence:
1. Identify and qualify a contractor.
2. Conduct a 30-minute discovery conversation.
3. Confirm the workflow problem and project fit.
4. Demonstrate only capabilities verified in the current candidate.
5. Agree pilot scope, participants, data boundaries and success measures.
6. Execute pilot terms and privacy/data arrangements.
7. Onboard after release gates and explicit launch approval.
8. Review outcomes and agree exit, extension or commercial proposal.

No customer data is to be entered into an unapproved Development/Preview environment.

## 6. Operational, legal and trust readiness

Before external pilot access, prepare and review:
- Pilot participation agreement and acceptable-use terms.
- Privacy notice and data-processing terms appropriate to the actual data flows.
- Data ownership, permitted processing, retention, export and deletion rules.
- Confidentiality and intellectual-property provisions.
- Support contact, hours, escalation route and incident communication process.
- Service limitations, planned maintenance and no-SLA statement where applicable.
- Backup/restore and incident-response procedures.
- Account provisioning, offboarding and access-revocation checklist.
- Security contact and vulnerability-reporting process.

Obtain Zimbabwe-qualified legal/privacy advice on applicable data-protection, electronic-transactions, consumer, contracting and any sector-specific obligations before processing real customer personal or confidential data. This workplan is not legal advice and does not certify compliance.

## 7. Product and technical commercial gates

The following are hard prerequisites for pilot use with real customer data:
- Checkpoint 1 accepted: authentication, tenant isolation, role enforcement, environment separation, migration reconciliation and security controls evidenced.
- Checkpoint 2 accepted for the selected MVP modules: module controls, persistence, validation, permissions and error handling tested.
- Checkpoint 3 accepted for the agreed pilot workflow: end-to-end records and approvals traceable across modules.
- Preview proven to use Development only; Production credentials and data remain isolated.
- Backup/restore tested; recovery owner and recovery steps documented.
- No unresolved critical/high security, tenant-isolation, financial-integrity or data-loss defects.
- Demo/sample mode disabled for customer workspaces and no synthetic records presented as customer records.
- Customer data export and account closure/deletion process tested.
- Support and incident procedures ready.

A READY deployment or passing CI is not sufficient evidence of these gates.

## 8. Commercial metrics and unit economics

Capture a baseline before pilot and compare at exit:
- Time spent preparing project status reports.
- Time between purchase request submission and decision.
- Percentage of active tasks with owner, due date and current status.
- Percentage of procurement requests linked to a project and budget/BOQ item.
- Completeness and timeliness of site updates.
- Time required to prepare a client update.
- Weekly active users by role and project.
- Onboarding hours, support hours, defect volume and severity.
- User-reported usefulness and willingness to continue/pay.

Calculate gross margin by customer/project after measuring infrastructure, third-party usage, AI/VEA and support costs. Do not set prices from competitor comparisons alone.

## 9. Brand, domain and launch assets

- Select and clear the market-facing product name before public launch; BuildFlow remains an internal working name until then.
- Check trademark/company-name/domain and social-handle availability in relevant markets.
- Secure an approved domain and business email.
- Prepare logo/visual identity, product screenshots and demo environment.
- Publish a concise website with accurate scope, contact route, privacy notice and terms.
- Avoid public customer logos, testimonials or case studies without written permission.
- Do not claim customer adoption, performance results or certifications without evidence.

## 10. Go-to-market sequence

**Phase A — Prepare (now, parallel with engineering):** discovery interviews, name clearance, positioning, demo assets, pilot documents, support and cost model.

**Phase B — Internal readiness:** integrated Preview candidate, security and workflow evidence, restore drill, role-based UAT and defect closure.

**Phase C — Controlled pilot:** onboard a small cohort (initial target 3–5 companies, subject to capacity), one or two projects per company where practical, with weekly reviews and controlled data boundaries.

**Phase D — Evaluate:** compare baseline and outcomes; review adoption, defects, support burden, willingness to pay and product gaps.

**Phase E — Commercial release decision:** approve market-facing name, price, terms, support model, production controls and launch communications separately. Pilot completion is not automatic permission for a public paid launch.

## 11. Workstream owners and evidence register

| Work area | Required output | Release dependency |
|---|---|---|
| Product | MVP scope and capability/limitations matrix | Checkpoints 1–3 |
| Security/data | Tenant, access, privacy, backup and restore evidence | Hard gate |
| Pilot operations | Charter, onboarding, support, incident and exit playbooks | Before onboarding |
| Commercial | ICP, discovery findings, pricing hypothesis, unit economics | Before paid launch |
| Brand/marketing | Cleared name, domain, accurate website/demo assets | Before public launch |
| Customer success | Training, feedback, issue triage and adoption metrics | Before pilot |
| Governance | Signed pilot approval and separate commercial go/no-go | Hard gate |

Each item must have an owner, status, evidence link and decision date. Unknown or untested items remain open.

## 12. Current decision

**Commercial preparation may begin immediately. External pilot onboarding with real customer data remains blocked until the applicable engineering, security, operational and approval gates pass.** This workstream supplements—not replaces or reorders—the eight mandatory engineering checkpoints.
