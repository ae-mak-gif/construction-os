# BuildFlow UAT Scenario Matrix — Six-Project Pilot

**Environment:** Supabase Development + Vercel Preview only  
**Organisation:** BuildFlow Demo  
**Dataset classification:** Synthetic PILOT/UAT records  
**Release branch:** `fix/auth-client-access-stabilisation`

## Portfolio

| ID | Project / stage | Scenario purpose | Seeded coverage |
|---|---|---|---|
| UAT-01 | Residential housing — active construction, 28% | Core delivery and client lifecycle | CRM conversion, programme activities, diary, BOQ, budgets, progress update |
| UAT-02 | Commercial office fit-out — procurement, 62% | Procurement controls and inventory reconciliation | BOQ, pending request, synthetic supplier, draft PO and line, zero-stock item |
| UAT-03 | Road and drainage — active / at-risk, 38% | Finance, weather disruption and change control | Budgets, draft invoice, pending test payment, submitted variation, rain-delay diary |
| UAT-04 | Industrial warehouse — mobilisation, 8% | Early-stage readiness and regulatory gating | Two tasks, permit risk, PM and Site Manager membership |
| UAT-05 | Hotel renovation — closeout, 91% | Defects, overdue handover, commercial pressure | Two tasks, two risks, budget overrun forecast, unpaid synthetic expense |
| UAT-06 | Water treatment — commissioning, 78% | Testing, quality and handover readiness | Two tasks, commissioning risk, budget, unpaid synthetic test expense, site diary |

## Test coverage by domain

- **CRM and onboarding:** enquiry → client → project → PM assignment (UAT-01).
- **Project controls:** programme, tasks, milestones, progress, site diary, delay and risk (UAT-01, UAT-03, UAT-04, UAT-05, UAT-06).
- **Commercial controls:** BOQ, budgets, commitments, actuals, forecast variance, expenses and invoice/payment lifecycle (UAT-01, UAT-03, UAT-05, UAT-06).
- **Procurement and inventory:** request approval, PO lifecycle, partial/final receipt, stock reconciliation and supplier visibility (UAT-02; extend UAT-06 with supplier O&M evidence).
- **Change control:** variation approval and rejection; contract value changes only on approval (UAT-03).
- **Quality and handover:** snag closure, commissioning certificates, as-builts, supplier O&M manuals and practical completion (UAT-05, UAT-06).
- **Access and tenant isolation:** internal roles and external client share boundary (all projects; external client remains restricted to explicitly shared project).

## VEA test prompts

1. **Portfolio synthesis:** “Compare all six UAT projects. Rank the five most urgent delivery, commercial and procurement issues. Show project, evidence, dependencies and recommended human action.”
2. **Early stage:** “What must be resolved before UAT-04 can safely move from mobilisation into bulk works?”
3. **Closeout:** “Is UAT-05 genuinely ready for handover? Reconcile snagging, overdue documentation, budget and expense evidence.”
4. **Commissioning:** “What are the acceptance blockers for UAT-06, and which records support each one?”
5. **Cross-functional:** “For UAT-02, trace the purchase request through PO and receipts. Distinguish what is recorded from what still needs a user action.”
6. **Conflict detection:** “Identify any differences between project health, progress, tasks, risks, budget forecasts and recorded updates. Do not infer missing data.”

## Acceptance rules

- Use the real Preview UI and the provisioned role accounts for browser acceptance.
- Treat database seed verification as data verification, not browser UAT.
- All names, transactions, suppliers and amounts are synthetic; no real supplier communication, purchase, payment, client dispatch or contractual commitment is authorised.
- VEA remains read-only. It may analyse and recommend but cannot approve, issue, pay, purchase, edit or assign.
- Record Pass / Fail / Blocked with tester, role, deployment commit, steps, actual result and evidence reference.
