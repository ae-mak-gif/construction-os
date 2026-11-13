# BuildFlow Operational Pilot Dataset

**Dataset ID:** `BF-PILOT-OPS-2026-11-v1`  
**Environment:** Supabase Development `buildflow-dev` only  
**Organisation:** BuildFlow Demo  
**Data classification:** Synthetic, linked operational test records — not customer records  
**Seed script:** `supabase/seed/pilot_operational_dataset.sql`

## Purpose

This dataset moves BuildFlow UAT beyond isolated demo cards. The records are stored in the real Development database tables and linked to the three existing UAT clients and projects. They exercise the same project, procurement, finance, programme and site-record structures used by the application.

Every scenario is labelled `UAT` or `PILOT`. Supplier contact details use the reserved `.invalid` domain and a non-routable demonstration phone number. Purchase orders and payment records are test-only; no external dispatch, bank transfer or real payment is authorised.

## Scenario register

| Project | Scenario | Seeded operational records | Acceptance focus |
|---|---|---|---|
| UAT-01-PROJ | Residential housing development | 3 programme activities, 1 site diary, 3 BOQ items, 2 budget lines, 1 client progress update | Programme, site diary, BOQ, cost plan, progress and client-visible update |
| UAT-02-PROJ | Commercial office fit-out | 1 BOQ item, synthetic supplier, 1 pending purchase request, 1 draft PO with 1 PO line, 1 zero-stock inventory item, 1 progress update | Request-to-PO workflow, PO approval, partial receipt of 80 units, final receipt of 100 units, stock and PO status reconciliation |
| UAT-03-PROJ | Road and drainage upgrade | 2 budget lines, 1 draft invoice, 1 pending test payment, 1 submitted variation, 1 site diary with weather delay, 1 progress update | Invoice issue, pending-to-confirmed payment, balance reconciliation, variation approval/rejection and contract value, delay reporting |

## Important starting states

- UAT-02 purchase request is pending and its linked purchase order is draft. The PO line is already inserted while the PO is draft, as required by the database guard. Approve the PO through the application before testing goods receipt.
- UAT-02 inventory quantity starts at zero. Use the application receipt workflow to receive 80 units, verify partial receipt and stock, then receive the remaining 100 units and verify final receipt and stock of 180.
- UAT-03 invoice starts as draft. Issue it through the Finance UI before recording/confirming the pending payment.
- UAT-03 payment starts pending and is synthetic. Confirm it only through the Finance workflow; never treat it as an actual bank receipt.
- UAT-03 variation starts submitted with a requested amount of USD 12,500. Approve or reject it through the authorised variation decision workflow and verify the project contract value changes only on approval.
- UAT-03 diary records rain disruption and compaction retesting as an intentional exception scenario.

## Role-based execution

Use the provisioned test accounts, not service-role or direct SQL writes, for acceptance:

- Organisation Admin: inspect all three projects, review the variation and confirm organisation-level visibility.
- Project Manager: manage programme/progress and submit/monitor variations.
- Site Manager: add a fresh site diary entry and verify project association; no Finance access.
- Finance User: issue the UAT-03 invoice, confirm the pending test payment and reconcile balances; no project administration.
- External Client: verify only the explicitly shared pilot project and permitted progress/update content. Documents and financials remain disabled.

Database seed records were loaded by a controlled Development-only transaction and have three `pilot.dataset_seeded` audit markers, one per project. Those markers document the seed operation; they do not replace application-generated audit events for subsequent user actions. The earlier UAT-01/02/03 CRM journey audit rows were manually added and must not be represented as native RPC audit logging.

## Safe execution and reset rules

1. Never run this seed script against Production.
2. The script uses stable IDs and business numbers and is designed to be re-runnable without duplicating the seeded records.
3. Do not issue real supplier communications, purchase orders, payment instructions or bank transactions from these scenarios.
4. Do not delete the baseline dataset as routine cleanup. Preserve it as the repeatable UAT baseline; create additional test transactions with a clear UAT marker.
5. If a test corrupts a baseline state, restore that specific record only after reviewing its audit history and obtaining pilot-owner approval. Do not reset or truncate whole tables.
6. Capture the Preview deployment URL/commit, test account role, steps, expected and actual result, screenshots/evidence reference and defect ID for every browser test.

## Current verification snapshot

The Development database query confirmed:
- UAT-01: 3 schedule activities, 1 diary, 3 BOQ items, 2 budget lines and 1 progress update.
- UAT-02: 1 BOQ item, 1 purchase order and 1 progress update; PO is draft, has 1 line, and inventory is zero.
- UAT-03: 2 budget lines, 1 invoice, 1 payment, 1 variation, 1 diary and 1 progress update; invoice is draft, payment is pending and variation is submitted.
- Three dataset audit markers exist.

This is a seeded baseline, not completed browser acceptance. The procurement, finance and variation journeys still need to be executed through the Preview UI using their assigned users.
