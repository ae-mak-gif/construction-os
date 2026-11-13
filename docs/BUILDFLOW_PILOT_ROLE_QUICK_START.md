# BuildFlow Pilot — Role Quick Start Guide

**Version:** 13 November 2026  
**Environment:** Development Supabase + Vercel Preview  
**Preview:** https://construction-os-git-fix-auth-cl-a2f3ad-aemakazhe-9121s-projects.vercel.app

This guide is for the controlled pilot. It describes the current navigation and the intended role journeys; it does not replace role permissions or the UAT acceptance record. Some workflows remain subject to browser acceptance. Use only approved pilot/test records.

## 1. Signing in

1. Open the Preview link above.
2. Sign in with the account assigned to your role.
3. Internal users should enter the organisation workspace and see the Dashboard and navigation sidebar.
4. External clients should enter the separate Client Portal, not the internal organisation workspace.
5. If the account shows an access or membership error, stop and contact the BuildFlow administrator. Do not create another account or change the user's organisation membership yourself.

Always sign out when finished on a shared device. Never share passwords or API keys.

## 2. Navigation overview

The internal workspace currently groups pages as follows:

- **Dashboard:** portfolio and project overview.
- **CRM:** Enquiries and Clients.
- **Construction Modules:** Module Catalogue.
- **Projects:** All Projects and individual Project Overview.
- **Operations:** Tasks & Calendar, Daily Site Diaries, Project Programme, Cost Control, Project Registers, Document Register, BOQ & Estimates, Procurement, Suppliers and Inventory.
- **Finance:** Finance.
- **Management:** HR & Staff, Workshop, Equipment, Risk & Quality and Reports.
- **Communications:** organisation/project communications.
- **AI Assistant:** VEA chat entry point; live inference is not enabled until its provider secret is configured and smoke-tested.
- **Settings:** account/organisation settings subject to assigned permissions.

The sidebar may show navigation labels that a user's role cannot access. Database and application permissions remain authoritative. A missing or denied feature is not a reason to use another user's account.

## 3. Role-specific journeys

### Organisation Admin

Primary pilot journey:
1. Open **CRM → Enquiries** to review or create an enquiry.
2. Convert an eligible enquiry to a client using the available workflow.
3. Open **CRM → Clients** to confirm the client record.
4. Open **Projects → All Projects** to create a linked project.
5. Assign the Project Manager and relevant project team using the available project/team controls.
6. Open **Project Registers** when reviewing a project variation or other project register.
7. Review the client portal share settings and ensure only the intended project information is shared.

Do not expose documents or financials to the external client unless a separately approved share decision has been made. The current pilot share is progress and updates only.

### Project Manager

Primary pilot journey:
1. Open **Projects → All Projects** and select the assigned project.
2. Open **Operations → Project Programme** to review or add programme activities.
3. Use **Operations → Tasks & Calendar** for delivery tasks and scheduling.
4. Update project progress through the project controls available to your role.
5. Review **Project Registers** for relevant project issues and variations.

The Project Manager role must not be used to access Finance or administer organisation roles unless an explicit permission has been granted.

### Site Manager

Primary pilot journey:
1. Open **Operations → Daily Site Diaries**.
2. Select the correct assigned project.
3. Enter the day's site information and submit the diary.
4. Reopen the project diary list and confirm the entry is attached to the correct project.

Do not enter confidential financial information in a site diary. The Site Manager role must not be used to access Finance or administer organisation roles.

### Finance User

Primary pilot journey:
1. Open **Operations → Cost Control** to review project budget/actual-cost information available to your role.
2. Open **Finance** to review invoices, payments, expenses and financial totals.
3. Use only approved test data while completing pilot acceptance.
4. For the UAT payment journey, create/issue a test invoice, record a pending payment, confirm it and reconcile the displayed balance/totals.

Never enter real payment credentials during pilot UAT. Do not use the Finance account to change project delivery records or organisation roles unless explicitly authorised.

### Procurement-authorised user

Primary pilot journey:
1. Open **Operations → BOQ & Estimates** to review project quantities/estimates where available.
2. Open **Operations → Suppliers** and **Inventory** to confirm the pilot supplier and item.
3. Open **Operations → Procurement**.
4. Create a clearly labelled test purchase request.
5. Use the authorised approval action to create/issue the PO.
6. Record a partial goods receipt, verify the inventory change, then record the remaining quantity and verify final PO status.

Never receive goods against a real commercial PO during UAT. Do not exceed the PO quantity.

### External Client

1. Sign in using the external-client account.
2. Confirm that the separate **Client Portal** opens.
3. Open only the shared pilot project.
4. Review the progress and updates made available to you.
5. Confirm that documents and financial information are not visible or accessible.

If internal organisation pages appear, or if another project's data is visible, stop and report it immediately.

### Primary Admin

Use the Primary Admin account for oversight and controlled administration. Avoid using it to perform every role's UAT: test each journey with the actual assigned role so permission boundaries are meaningfully checked.

## 4. Safe pilot practices

- Use the dedicated pilot project and clearly labelled `UAT-` records.
- Do not use real bank/payment credentials, real supplier commitments or irreversible commercial transactions.
- Do not share passwords, service-role keys, API keys or other secrets.
- Do not change user roles, organisation membership or client-share permissions outside the approved test plan.
- Stop immediately if you see another organisation's data or a permission boundary behaving unexpectedly.
- Record each test in `BUILDFLOW_PILOT_UAT_AND_LIMITATIONS.md` with outcome and evidence.
- Clean up test records only through approved application workflows.
- Report defects with the role used, page, steps, expected result, actual result and screenshot/evidence.

## 5. Known pilot exclusions

- VEA live inference is pending confirmation of the Development `GROQ_API_KEY` secret and a successful smoke test.
- Subscription selection, billing and paid-tier entitlement enforcement are not complete.
- This is not a Production environment or a general-availability release.
- Do not promise that every module visible in navigation is enabled for every pilot role.

## 6. Support and escalation

For access, data-integrity or security issues, stop the affected workflow and contact the designated BuildFlow administrator/pilot owner. Include the test ID, account role, timestamp, project, exact steps and evidence. Do not attempt database-level fixes or bypass application permissions.
