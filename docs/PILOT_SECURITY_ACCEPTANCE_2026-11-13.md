# BuildFlow pilot security acceptance — 13 November 2026

**Environment:** Supabase Development project `buildflow-dev`  
**Application branch:** `fix/auth-client-access-stabilisation`  
**Production boundary:** no Production database, environment variables, deployment, or customer data was changed.

This report supersedes the earlier security baseline where its status differs. All database tests below were run against Development. Temporary test rows and the synthetic second tenant were created inside transactions and rolled back.

## Account and tenancy checks

- The user confirmed that all six pilot accounts sign in successfully in the browser before the latest client-identity hardening change.
- All 56 public application tables and both private application tables have Row Level Security enabled.
- A simulated Admin from BuildFlow Demo could not read or update a project belonging to a temporary second tenant. The tenant permission helpers returned false.
- Project-level access behaved as intended for the pilot project: Admin, Organisation Admin, Project Manager and Site Manager could access it; Finance User could not. The PM and Site Manager are assigned project members.
- Revoking a Project Manager's active organisation membership immediately removed organisation permission and project-row access in the next simulated request.
- Message and notification scope checks passed: a non-participant/non-recipient saw neither record; the sender and intended message recipient could see the message; only the notification recipient could see the notification.
- The external client could not directly query projects, invoices, payments, staff or purchase orders. The safe client-project RPC returned only the explicitly shared project.
- A direct client-table policy was found to expose the linked CRM row. It has been removed. External identity resolution now uses `get_client_portal_identity()`, which returns only client ID, organisation ID, client name and active status. Post-fix tests confirmed zero direct client-table rows for the client and continued CRM access for internal Admin users.

## Approval and financial-integrity checks

The audit found that ordinary roles could delete approved and posted records. The Development database has now been hardened.

- Project Manager attempts to approve a project approval, purchase order or contract variation without the relevant approval permission were rejected.
- Submitted/finalised purchase-order commercial terms and line items are locked.
- Submitted/finalised contract-variation terms are locked; approved/rejected/withdrawn decisions cannot be rewritten.
- Completed project-approval records cannot be altered or deleted.
- Invoice status changes require finance approval; invoice terms lock after draft.
- Payment status changes require finance approval. Received payments can be reversed without changing their amount or reference; reversed payments are immutable.
- Paid/partially paid expenses cannot be rewritten; changing payment status requires finance approval.
- Budget-control amount changes require finance approval.
- Finance transactions, project-cost ledger rows, inventory transactions, payments and expenses no longer have ordinary authenticated update/delete paths.
- Purchase orders, variations and invoices can be deleted only while still draft. Purchase-order items can be changed only while the parent order remains draft. Unused zero-value budget lines are the only budget rows eligible for deletion.

### Regression test results

| Test | Result |
|---|---|
| Cross-tenant project read/update | Denied |
| Project-role scope | Passed |
| Membership revocation | Access removed |
| Message and notification isolation | Passed |
| External client direct access to internal tables | Denied |
| External client safe shared-project projection | Passed |
| External client direct CRM-row access after fix | Denied |
| PM approval bypass attempts | Denied |
| PM delete approved PO / variation / completed approval | 0 rows deleted |
| Finance delete paid invoice / received payment / paid expense / ledger / project cost | 0 rows deleted |
| Finalised PO / variation / approval / invoice / payment / expense tampering | Rejected |
| Received payment reversal by authorised Finance User | Allowed |
| Draft PO / PO item / variation / invoice deletion | Allowed |

## Documents and Storage

- The `project-documents` bucket exists and is private, with a 25 MB limit and an allow-list of document/image MIME types.
- `storage.objects` has RLS enabled and policies bind object paths to organisation, project and document-register rows, with the relevant document permissions and project access checks.
- The bucket currently contains zero objects. Upload, download, signed-URL expiry and revocation still require a real browser acceptance test.

## Remaining security release gates

1. **Leaked-password protection:** Supabase's Development security advisor still reports this setting disabled. It must be enabled in Auth settings if supported by the project plan; this was not changed through the connected project tooling.
2. **Browser regression after latest changes:** retest external client and internal Admin sign-in against the newest Preview deployment, especially the new client identity RPC.
3. **Storage acceptance:** test upload, download, cross-project denial and signed-URL behaviour with a real pilot document.
4. **Automated repeatability:** convert the current Development-only SQL/RLS regression checks into repeatable automated tests with dedicated fixtures.
5. **Performance review:** investigate unindexed foreign keys using query plans and representative workload before adding indexes. Do not drop unused indexes without evidence.

## Release disposition

**Security baseline:** substantially hardened and passing the database-level tenant, role, client-isolation and approval/ledger regression checks above.

**Not yet a release sign-off:** browser regression for the latest code, Storage file-transfer acceptance, automated repeatability and leaked-password protection remain outstanding.

Keep PR #3 in Draft until the latest Preview browser checks pass. Do not merge or deploy Production without explicit authorisation.
