BuildFlow — AI Development Instructions

1. Product

BuildFlow is Tishande's industry-specific Construction Business Operations platform.

BuildFlow helps construction businesses manage:

- CRM and enquiries
- Projects
- Tasks and scheduling
- Estimates and BOQs
- Procurement
- Suppliers
- Inventory
- Finance
- Staff and equipment
- Risks and quality
- Communications
- Client Portal
- AI-assisted operational intelligence

BuildFlow is built on a reusable Tishande Core architecture so the same core patterns can later support other industry-specific business operating systems.

---

2. Primary Architecture

Use this architecture:

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS

Backend:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Row Level Security

Source control:

- GitHub

Deployment:

- Vercel where appropriate

Automation/integrations:

- n8n where appropriate

AI:

- BuildFlow AI as an operational intelligence layer over BuildFlow data.

Do not introduce another backend or authentication system unless explicitly requested.

---

3. Source of Truth

GitHub is the source of truth for application code and database migrations.

Supabase is the source of truth for live database state.

Database structure must be represented by version-controlled migration files.

Do not rely on:

- unsaved Supabase SQL editor queries
- undocumented manual database changes
- Replit-generated database structures
- frontend mock data as the production data model

Every structural database change should have a corresponding migration.

---

4. Multi-Tenant Architecture

BuildFlow is multi-tenant.

The fundamental relationship is:

auth.users
→ profiles
→ organization_members
→ organizations

Operational organization-owned data should normally contain:

organization_id UUID

and be protected by Row Level Security.

Users must only access data belonging to organizations in which they are active members.

Never use:

USING (true)

for organization-owned application data.

Do not disable RLS to solve frontend problems.

Do not expose service-role credentials to the frontend.

---

5. Identity and Users

Supabase Auth is the identity provider.

Do not create a separate application authentication system.

Use:

- "auth.users" for authentication identity
- "profiles" for application profile information
- "organization_members" for organization membership
- "roles" for organization-level roles

"staff" is different from "organization_members".

A construction worker may exist as a staff record without having a BuildFlow login.

---

6. BuildFlow V1 Database

BuildFlow V1 uses the following operational database foundation.

CORE

1. organizations
2. profiles
3. roles
4. organization_members
5. notifications
6. activities

CRM

7. clients
8. contacts
9. enquiries

PROJECTS

10. projects
11. project_members
12. tasks
13. calendar_events
14. project_updates
15. project_documents
16. project_approvals

ESTIMATES / BOQ

17. estimates
18. estimate_items
19. boq_items

PROCUREMENT

20. suppliers
21. purchase_requests
22. purchase_orders
23. purchase_order_items

INVENTORY

24. inventory_items
25. inventory_transactions

FINANCE

26. invoices
27. payments
28. expenses
29. project_costs
30. finance_transactions

MANAGEMENT

31. staff
32. equipment
33. equipment_assignments
34. work_orders
35. risks
36. quality_issues
37. inspections

COMMUNICATIONS

38. messages
39. communication_logs

Do not add speculative tables simply because they may be useful in the future.

---

7. Core Relationships

The primary operational flow is:

Client
→ Enquiry
→ Project
→ Estimate / BOQ
→ Procurement
→ Inventory
→ Finance
→ Dashboard
→ BuildFlow AI

Projects are the central operational entity.

Projects may connect to:

- clients
- project members
- tasks
- calendar events
- estimates
- BOQ items
- purchase requests
- purchase orders
- inventory transactions
- invoices
- payments
- expenses
- project costs
- risks
- quality issues
- inspections
- equipment
- project updates
- documents
- messages
- approvals

Do not duplicate the same business entity merely to support another UI page.

---

8. Client Portal

The Client Portal is a presentation and access layer over existing BuildFlow data.

Do not create duplicate client-project, client-finance, or client-document tables solely for the portal.

The portal should expose only information the relevant client is authorized to see.

Target V1 areas:

- project overview
- progress
- milestones
- financial summary
- documents
- communications
- approvals

---

9. Finance

The primary operational financial records are:

- invoices
- payments
- expenses
- project_costs

"finance_transactions" must not become a competing accounting ledger.

Use it only for financial events that do not naturally originate from the primary operational finance tables.

Do not introduce a general ledger, accounting periods, tax engine, payroll system, or full accounting platform in V1.

---

10. Inventory

Inventory should be transaction-driven.

"inventory_transactions" provide the movement/audit trail.

A current quantity field may be retained as a cached operational value where useful for the interface, but inventory logic must not depend on unexplained manual number changes.

Do not build warehouse locations, batches, serial numbers, or advanced stock costing unless an actual V1 requirement appears.

---

11. AI Assistant

BuildFlow AI is initially a Construction Operations Copilot.

It should analyse existing operational data and provide:

- answers
- summaries
- warnings
- insights
- recommendations

Examples:

- Which projects are at risk?
- What tasks are overdue?
- What procurement is pending?
- How much is outstanding?
- What is the current status of Riverside?
- Summarize this week's project activity.
- What requires management attention?

V1 AI is read/analyse/recommend.

Do not initially create autonomous AI agents that modify financial, project, procurement, or inventory records.

Do not create dedicated AI database tables unless actual implementation requirements justify them.

Later architecture may include:

BuildFlow AI
→ Project Agent
→ Finance Agent
→ Procurement Agent
→ Core BuildFlow Data

---

12. Frontend Rules

Preserve the existing BuildFlow visual design unless a redesign is explicitly requested.

Do not unnecessarily change:

- colours
- typography
- navigation structure
- page hierarchy
- working components
- existing mock data
- working desktop layouts

Prefer the smallest safe change.

When fixing bugs:

1. identify the root cause
2. change the smallest necessary area
3. test the affected feature
4. test adjacent functionality
5. avoid unrelated refactoring

Do not rewrite working modules simply to make implementation easier.

---

13. Mobile

BuildFlow must support desktop and mobile.

On mobile:

- navigation should use a drawer/off-canvas pattern
- main content must remain usable
- tables may scroll horizontally where appropriate
- multi-column layouts should stack
- forms must remain touch-friendly
- buttons must remain accessible
- horizontal overflow should be prevented

Do not redesign the desktop experience solely to solve mobile problems.

---

14. Database Migration Structure

Use separate, version-controlled migrations:

supabase/
└── migrations/
├── 001_core.sql
├── 002_crm.sql
├── 003_projects.sql
├── 004_estimates_boq.sql
├── 005_procurement.sql
├── 006_inventory.sql
├── 007_finance.sql
├── 008_management.sql
├── 009_communications.sql
├── 010_rls.sql
└── 011_seed_demo.sql

Each migration should be:

- focused
- reproducible
- reviewable
- safe to apply in order

Avoid one enormous unversioned SQL script.

---

15. Schema Design Rules

Use:

- UUID primary keys
- foreign keys
- appropriate indexes
- "created_at"
- "updated_at" where appropriate
- appropriate numeric/decimal types for money
- explicit status fields
- organization-level tenancy
- database constraints where useful

Avoid:

- unnecessary JSON blobs when relational columns are appropriate
- duplicated business data
- unexplained nullable relationships
- premature enterprise abstractions
- destructive migrations unless explicitly approved

Use database constraints to protect important relationships and valid states.

---

16. Security

Never:

- expose Supabase service-role keys in frontend code
- disable RLS to make a feature work
- create unrestricted organization-data policies
- trust organization IDs supplied by the client without authorization checks
- put secrets in committed source code

Authentication and authorization must be enforced server-side/database-side where appropriate.

---

17. Integrations

Potential integrations include:

- WhatsApp
- SMS
- email
- Google Calendar
- n8n
- client communications

Do not build every integration during the initial database phase.

First establish a stable internal operational data model.

Then connect external systems through controlled workflows.

---

18. Development Tool Responsibilities

Use tools according to their strengths.

GitHub / Codex / coding agents

Prefer for:

- architecture
- repository-wide changes
- migrations
- tests
- code review
- persistent development instructions
- refactoring
- source-control changes

Replit

Prefer for:

- rapid frontend development
- interactive development
- previewing
- UI integration

Do not let Replit independently redefine the database architecture.

Supabase

Prefer for:

- PostgreSQL
- Auth
- RLS
- database migrations
- database validation
- data inspection

n8n

Prefer for:

- external business process automation
- webhook workflows
- notifications
- system-to-system integrations
- scheduled automation

---

19. Change Management

Before making a major architectural change, consider:

1. Commercial value
2. Demo/revenue impact
3. Development speed
4. Risk
5. Cost
6. Maintainability
7. Reusability across future Tishande industry products

Prefer changes that improve multiple dimensions without creating unnecessary complexity.

When requirements conflict, explain the trade-off before making a major irreversible change.

---

20. Current MVP Priority

The immediate objective is a demo-ready connected BuildFlow MVP.

Priority order:

1. Stabilize frontend
2. Fix Client Portal
3. Fix mobile/sidebar behaviour
4. Stabilize AI Assistant UI
5. Create Supabase schema
6. Apply RLS
7. Seed realistic demo data
8. Connect Dashboard
9. Connect CRM
10. Connect Projects
11. Connect Tasks
12. Connect BOQ/Estimates
13. Connect Procurement
14. Connect Inventory
15. Connect Finance
16. Connect Management
17. Connect Client Portal
18. Connect AI operational insights
19. Test end-to-end workflow
20. Demo polish

Do not expand scope until the critical operational backbone works.

---

21. Critical Demo Workflow

The following workflow should work end-to-end:

Client
→ Enquiry
→ Project
→ Task / BOQ
→ Procurement
→ Inventory
→ Finance
→ Dashboard
→ AI Insight

This workflow has priority over secondary features.

---

22. Working Principle

BuildFlow V1 should be:

- connected enough to demonstrate real business value
- structured enough to evolve
- simple enough to maintain
- reusable enough to support future Tishande vertical products

Do not optimize for theoretical completeness.

Optimize for a stable, demonstrable operational system with a clean foundation.
