Expertflow ITAM: Project Specification
1. Core Purpose
To manage the lifecycle of internal IT assets (Hardware, Software, Cloud) at Expertflow.
+4

2. Database Schema (PostgreSQL via Prisma)
Generate a schema that supports these entities:


Assets: Fields for Asset ID (tag), Title, Type (Hardware/Software/Cloud/Peripheral), Status, and Cost Center.
+4


Lifecycle States: Requested, Procured, Registered, Deployed, Maintenance, Retired .


Users: Roles for IT Asset Manager, IT Ops, Dept Heads, and Employees .


Software/Cloud: Fields to track licenses, subscriptions, and renewals.
+1

3. Application Flow (The Vibe)

Request Portal: Users submit asset requests via a portal.


Approval Logic: Requests must trigger a flow for Managerial and IT approval.


Inventory Management: A centralized CMDB view for the IT Asset Manager.
+1


Compliance Dashboard: Track metrics like license compliance and asset aging.

4. Tech Stack
Framework: Next.js (App Router).


Database: Local PostgreSQL with Prisma ORM.
+1

Styling: Tailwind CSS (Modern/Minimalist).