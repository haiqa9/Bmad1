# Expertflow ITAM — End User Guide

> **Version:** 1.0  
> **Last Updated:** 2026-06-03  
> **For:** All ITAM Users (Employees, Department Heads, IT Ops, IT Asset Managers)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Logging In](#2-logging-in)
3. [Your Dashboard](#3-your-dashboard)
4. [Navigation & Sidebar](#4-navigation--sidebar)
5. [Submitting an Asset Request](#5-submitting-an-asset-request)
6. [Tracking Your Requests](#6-tracking-your-requests)
7. [Approving Requests (Department Heads)](#7-approving-requests-department-heads)
8. [IT Approvals (IT Ops)](#8-it-approvals-it-ops)
9. [Managing Assets (IT Ops / Asset Manager)](#9-managing-assets-it-ops--asset-manager)
10. [Compliance Dashboard](#10-compliance-dashboard)
11. [Maintenance Mode](#11-maintenance-mode)
12. [Sheet Data Viewer](#12-sheet-data-viewer)
13. [User Management (Admin)](#13-user-management-admin)
14. [FAQs & Troubleshooting](#14-faqs--troubleshooting)

---

## 1. Getting Started

### What is ITAM?
**ITAM** (IT Asset Management) is Expertflow's internal portal for tracking and managing IT equipment — laptops, servers, software licenses, cloud VMs, and more.

### Who can use it?
All Expertflow employees have access. What you can see and do depends on your **role**:

| Role | What You Can Do |
|------|----------------|
| **Employee** | Request new assets, track your own requests |
| **Department Head** | Approve or reject asset requests from your department |
| **IT Ops** | Manage assets, approve IT requests, handle maintenance, view sheet data |
| **IT Asset Manager** | Full access — manage users, assets, compliance, and all data |

### Supported Browsers
- Google Chrome (recommended)
- Microsoft Edge
- Mozilla Firefox
- Safari

### Access URL
Open your browser and go to:  
**`http://itam.expertflow.com`** (internal network)

---

## 2. Logging In

### Step 1: Open the Login Page
Navigate to the ITAM URL. You will see the **Expertflow ITAM Portal** login page.

### Step 2: Choose Your Login Method

#### Option A: Email & Password (Standard)
1. Enter your **email address** (e.g., `yourname@expertflow.com`)
2. Enter your **password**
3. Click **Sign In**

> **Note:** If your account was created by the IT Asset Manager, use the password they provided. You can ask them to reset it if needed.

#### Option B: Google Sign-In (if enabled)
1. Click **Sign in with Google**
2. Select your `@expertflow.com` Google account
3. You will be logged in automatically

#### Option C: Microsoft Sign-In (if enabled)
1. Click **Sign in with Microsoft**
2. Enter your Expertflow credentials
3. You will be logged in automatically

> ⚠️ **Important:** Only `@expertflow.com` email addresses are allowed. Personal Gmail or Outlook accounts will be blocked.

### Forgot Your Password?
The ITAM portal does not have a self-service password reset. Contact your **IT Asset Manager** to reset your password.

### Too Many Failed Attempts
If you enter the wrong password 5 times within 1 minute, you will be temporarily locked out. Wait 60 seconds and try again.

---

## 3. Your Dashboard

After logging in, you are taken to your **role-specific dashboard**:

### Employee Dashboard
- Quick links to **Request Asset** and **My Requests**
- Overview of your recent request statuses

### Department Head Dashboard
- Quick links to **Pending Approvals** and **My Requests**
- Summary of pending approvals from your department

### IT Ops Dashboard
- Quick links to **IT Approvals**, **Maintenance**, and **Sheet Data**
- Overview of assets needing IT attention

### IT Asset Manager Dashboard
- Cards linking to **All Requests**, **Approvals**, and **Maintenance**
- **User Management** card to add/edit/delete users

---

## 4. Navigation & Sidebar

The **left sidebar** is your main way to move around the portal. The menu items you see depend on your role.

### Common Menu Items
| Item | Who Sees It | What It Does |
|------|------------|-------------|
| **Dashboard** | Everyone | Your home page with quick links |
| **Request Asset** | Employee, Asset Manager | Form to request a new asset |
| **My Requests** | Employee, Dept Head | List of requests you submitted |
| **Pending Approvals** | Dept Head | Approve/reject dept requests |
| **IT Approvals** | IT Ops | Final IT approval stage |
| **Approvals** | Asset Manager | View all approval stages |
| **Maintenance** | IT Ops, Asset Manager | Assets currently under maintenance |
| **Sheet Pages** | IT Ops, Asset Manager | View legacy Excel sheet data |

### User Card
At the top of the sidebar, you will see:
- Your **name**
- Your **role** (e.g., "IT_OPS", "DEPT_HEAD")

### Sign Out
Click the **Sign Out** button at the bottom of the sidebar to log out securely.

---

## 5. Submitting an Asset Request

Employees can request new IT assets (laptops, software, cloud resources, peripherals) through the portal.

### Step 1: Go to Request Form
1. Click **Request Asset** in the sidebar (or from your dashboard)

### Step 2: Fill Out the Form
| Field | What to Enter |
|-------|--------------|
| **Asset Type** | Select Hardware, Software, Cloud, or Peripheral |
| **Title** | A short name for what you need (e.g., "MacBook Pro M3") |
| **Justification** | Explain why you need this asset |
| **Cost Center** | Usually auto-filled from your department |
| **Urgency** | Low, Medium, or High |

### Step 3: Submit
Click **Submit Request**. You will see a confirmation with your **Request ID**.

### What Happens Next?
1. Your request goes to **PENDING_MANAGER** status
2. Your Department Head will review it
3. If approved, it goes to **PENDING_IT** for IT Ops review
4. If IT also approves, the request is **APPROVED** and procurement begins
5. You can track progress in **My Requests**

> ⏱️ **Tip:** Approval times vary. High urgency requests are reviewed faster.

---

## 6. Tracking Your Requests

### Viewing Your Requests
1. Click **My Requests** in the sidebar
2. You will see a table with all your submitted requests

### Understanding Status Colors
| Color | Status | Meaning |
|-------|--------|---------|
| 🟡 **Yellow** | Pending Manager | Waiting for your Department Head |
| 🟡 **Yellow** | Pending IT | Waiting for IT Ops |
| 🟢 **Green** | Approved | Request accepted, procurement started |
| 🔴 **Red** | Rejected | Request was declined |

### Viewing Request Details
Click on any row to see:
- Full justification
- Approval notes from managers and IT
- Current stage in the workflow

### Asset Managers See All Requests
If you are an **IT Asset Manager**, the **Requests** page shows requests from **all employees**, not just yours.

---

## 7. Approving Requests (Department Heads)

As a Department Head, you control spending for your department by approving or rejecting asset requests.

### Step 1: Go to Pending Approvals
1. Click **Pending Approvals** in the sidebar

### Step 2: Review Requests
You will see a table of requests from employees in **your department only**.

### Step 3: Take Action
For each request:
1. Read the **Justification** and check the **Urgency**
2. Click **Approve** or **Reject**
3. If rejecting, enter a **reason** so the employee understands why

### What Happens After?
- **Approve** → Request moves to **PENDING_IT** for IT Ops review
- **Reject** → Request is marked **REJECTED**, employee is notified

> 💡 **Tip:** You can also view your own requests from the **My Requests** page.

---

## 8. IT Approvals (IT Ops)

As an IT Ops user, you give the final technical approval on manager-approved requests.

### Step 1: Go to IT Approvals
1. Click **IT Approvals** in the sidebar

### Step 2: Review Pending IT Requests
You will see requests that have already been approved by Department Heads.

### Step 3: Take Action
For each request:
1. Review the asset type, justification, and manager notes
2. Click **Approve** or **Reject**
3. Add your **IT notes** if needed

### What Happens After?
- **Approve** → Request becomes **APPROVED**, linked asset status changes to **PROCURED**
- **Reject** → Request becomes **REJECTED**, linked asset status changes to **RETIRED**

> ⚠️ **Note:** Your decision is final. Make sure to review carefully.

---

## 9. Managing Assets (IT Ops / Asset Manager)

### Viewing the Asset Inventory (CMDB)
1. Click **Assets** in the sidebar
2. You will see a searchable, filterable table of all IT assets

### Searching & Filtering
- **Search box:** Type to search by asset tag, title, or assigned person
- **Type filter:** Show only Hardware, Software, Cloud, or Peripherals
- **Status filter:** Show only assets in a specific lifecycle state

### Viewing Asset Details
Click any row to open the **Asset Detail** panel, which shows:
- Full asset information
- Software license details (if applicable)
- **History timeline** — every status change and reassignment

### Adding a New Asset
1. Click the **Add Asset** button
2. Fill out the form:
   - Tag, Title, Type, Status, Cost Center, Department
   - Purchase Date, Warranty Expiry
   - Assigned To (optional)
3. If Type is **Software** or **Cloud**, additional fields appear:
   - License Type, License Key, Seats Total, Seats Used, Renewal Date, Vendor
4. Click **Save**

### Editing an Asset
1. Open the asset detail panel
2. Click **Edit**
3. Update fields and click **Save**

### Changing Asset Status (Lifecycle)
In the asset detail panel:
1. Select a new status from the **Status** dropdown
2. Only valid transitions are enabled
3. Add a **note** explaining the change
4. The change is automatically recorded in the history

**Valid Status Flow:**
```
REQUESTED → PROCURED → REGISTERED → DEPLOYED → MAINTENANCE → RETIRED
```

> Any asset can be moved to **RETIRED** from any state.

### Reassigning an Asset
1. Open the asset detail panel
2. Click **Reassign**
3. Enter:
   - New Assigned To (employee name)
   - New Department
   - Transfer Date
   - Notes
4. Click **Confirm**

> A history record is created with type **REASSIGNED**.

---

## 10. Compliance Dashboard

The Compliance Dashboard helps IT Asset Managers monitor the health of the IT inventory.

### Access
- Click **Compliance** in the sidebar (IT Asset Manager only)

### KPI Cards (Top of Page)
| Card | What It Shows |
|------|--------------|
| **Total Active Assets** | All assets except retired ones |
| **Pending Approvals** | Requests waiting at any approval stage |
| **License Compliance %** | Average seat utilization across all software |
| **Expiring Soon** | Warranties or licenses expiring within 30 days |

### Charts
- **Pie Chart:** Assets by Type (Hardware, Software, Cloud, Peripheral)
- **Donut Chart:** Assets by Lifecycle Status
- **Bar Chart:** Assets by Department
- **Bar Chart:** Assets by Cost Center

### License Compliance Page
1. Click **Licenses** within the Compliance section
2. View all software/cloud assets with license details
3. Color-coded rows:
   - 🔴 **Red:** Over-allocated (>100% seats used) or expires within 7 days
   - 🟡 **Yellow:** >85% utilized or expires within 30 days
   - 🟢 **Green:** Healthy
4. Sort by Renewal Date or Utilization %
5. Click **Export to CSV** to download the report

### Asset Aging Report
1. Click **Aging** within the Compliance section
2. View hardware assets older than a set number of years (default: 3)
3. Adjust the **Minimum Age** filter as needed
4. Red highlight indicates expired warranty

---

## 11. Maintenance Mode

When an asset needs repairs or servicing, it can be placed in **Maintenance** status.

### Putting an Asset in Maintenance
1. Open the **asset detail** panel
2. Click **Set Maintenance**
3. Enter:
   - Maintenance reason
   - Expected completion date (optional)
4. Click **Confirm**

The asset status changes to **MAINTENANCE** and appears in the Maintenance list.

### Viewing Assets in Maintenance
1. Click **Maintenance** in the sidebar
2. See a list of all assets currently under maintenance

### Returning an Asset to Service
1. Find the asset in the Maintenance list
2. Click **Return to Service**
3. The asset status returns to **DEPLOYED**

> A history record is created for both actions.

---

## 12. Sheet Data Viewer

**Sheet Data** contains legacy Excel records that have been imported into ITAM.

### Who Can Access?
- **IT Ops** and **IT Asset Manager** roles only

### Viewing Sheet Data
1. Look for sheet names in your sidebar (e.g., **Laptop Record**, **Lab Servers**, **Cloud VMs**, etc.)
2. Click any sheet name
3. The data appears in a table with all columns from the original Excel file

### Searching
- Use the **search box** to filter across all text columns
- Results update as you type

### Pagination
- Use the **Previous** / **Next** buttons to move between pages
- Default: 25 rows per page

### Adding a New Entry
1. Click **Add Entry** (top-right of the table)
2. Fill in the fields
3. Click **Save**

### Editing an Entry
1. Find the row you want to edit
2. Click **Edit** on that row
3. Update the fields
4. Click **Save**

### Deleting an Entry
1. Find the row you want to remove
2. Click **Delete**
3. Confirm the deletion

> ⚠️ **Warning:** Deleted entries cannot be recovered. Only IT Ops and Asset Managers can add, edit, or delete entries.

### Available Sheets
| Sheet Name | What's Inside |
|-----------|--------------|
| **Laptop Record** | Employee laptop assignments and specs |
| **Lab Servers** | Physical server inventory |
| **Devices** | General devices (model, serial, IP, battery) |
| **iLO/iDRAC** | Server management IPs and switch ports |
| **Cloud VM List** | Cloud virtual machines (IP, FQDN, SSL) |
| **Lab VM List** | Lab virtual machines (host, memory, DNS) |
| **Public FQDN** | Public domain mappings |
| **GatePass** | Asset issue/receive tracking |
| **Received Items** | Inventory receipts |
| **Ports Detail** | Network switch port assignments |
| **Free VMs** | Decommissioned VM tracking |

---

## 13. User Management (Admin)

Only **IT Asset Managers** can create, edit, and delete user accounts.

### Opening User Management
1. Go to your **Admin Dashboard**
2. Click the **User Management** card

### Viewing Users
A modal opens showing all users with:
- Name
- Email
- Role
- Department

### Adding a New User
1. Click **Add User**
2. Fill in:
   - **Email** (must be unique)
   - **Full Name**
   - **Password** (minimum secure length recommended)
   - **Role** (Employee, Dept Head, IT Ops, or IT Asset Manager)
   - **Department**
3. Click **Save**

> The new user can log in immediately with the email and password you set.

### Editing a User
1. Find the user in the list
2. Click **Edit**
3. Update name, role, or department
4. Click **Save**

### Deleting a User
1. Find the user in the list
2. Click **Delete**
3. Confirm the deletion

> ⚠️ **Warning:** Deleting a user removes their access permanently. Make sure you really want to do this.

---

## 14. FAQs & Troubleshooting

### General Questions

**Q: I can't log in. What should I check?**
- Make sure you are using the correct email address
- Check that Caps Lock is off
- If you forgot your password, contact your IT Asset Manager
- If you see "Too many login attempts," wait 60 seconds and try again

**Q: I don't see the menu items I expect.**
- Your sidebar menu depends on your **role**. If you think your role is wrong, contact the IT Asset Manager.

**Q: The page is loading slowly.**
- Try refreshing the browser (F5 or Ctrl+R)
- Clear your browser cache
- Check your network connection

**Q: Can I access ITAM from home?**
- ITAM runs on the internal Expertflow network. You need to be connected to the company VPN or be on-premises.

### For Employees

**Q: How long does an asset request take?**
- It depends on urgency and availability. High urgency requests are reviewed within 1-2 business days. Standard requests may take 3-5 days.

**Q: My request was rejected. Can I appeal?**
- Yes. Submit a new request with additional justification, or speak directly with your Department Head.

**Q: Can I request software for my team?**
- Yes. Select **Software** or **Cloud** as the asset type and explain the team need in the justification.

### For Department Heads

**Q: I don't see any pending approvals.**
- You will only see requests from employees in **your department**. If a request is missing, the employee may have selected the wrong department.

**Q: Can I approve my own request?**
- No. The system does not allow self-approval for conflict-of-interest reasons.

### For IT Ops

**Q: I approved a request but the asset isn't showing up.**
- After IT approval, the asset status becomes **PROCURED**. The IT Asset Manager or IT Ops must then update it to **REGISTERED** and **DEPLOYED** as it moves through the lifecycle.

**Q: Can I edit Excel sheet data in bulk?**
- Currently, edits must be done one row at a time through the portal. For bulk changes, contact the IT Asset Manager.

### For IT Asset Managers

**Q: How do I reset a user's password?**
1. Open **User Management**
2. Find the user
3. Click **Edit**
4. Enter a new password
5. Click **Save**
6. Share the new password with the user securely

**Q: How do I add a new Excel sheet?**
- Adding new sheets requires a database schema update and code changes. Contact the development team or update the Prisma schema and `lib/sheets.ts` configuration.

**Q: How do I back up the data?**
- The PostgreSQL database should be backed up at the infrastructure level (Docker volumes or server backups). Contact your IT infrastructure team for backup schedules.

---

## Quick Reference Card

### Status Meanings
| Status | Meaning |
|--------|---------|
| **REQUESTED** | Someone asked for this asset |
| **PROCURED** | Approved — ordered or purchased |
| **REGISTERED** | Received and logged in the system |
| **DEPLOYED** | In active use by an employee |
| **MAINTENANCE** | Temporarily out of service for repair |
| **RETIRED** | No longer in use |

### Request Status Meanings
| Status | Meaning |
|--------|---------|
| **PENDING_MANAGER** | Waiting for Department Head approval |
| **PENDING_IT** | Waiting for IT Ops final approval |
| **APPROVED** | Fully approved — procurement can proceed |
| **REJECTED** | Declined at some stage |

### Role Permissions Summary
| Action | Employee | Dept Head | IT Ops | Asset Manager |
|--------|----------|-----------|--------|---------------|
| Submit request | ✅ | ✅ | ✅ | ✅ |
| View own requests | ✅ | ✅ | ✅ | ✅ |
| Approve dept requests | ❌ | ✅ | ❌ | ✅ |
| IT approval | ❌ | ❌ | ✅ | ✅ |
| View all assets | ❌ | ❌ | ✅ | ✅ |
| Add/edit/delete assets | ❌ | ❌ | ✅ | ✅ |
| View compliance dashboard | ❌ | ❌ | ❌ | ✅ |
| Manage maintenance | ❌ | ❌ | ✅ | ✅ |
| View sheet data | ❌ | ❌ | ✅ | ✅ |
| Edit sheet data | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

---

## Contact & Support

| Issue | Contact |
|-------|---------|
| Login problems | IT Asset Manager |
| Password reset | IT Asset Manager |
| Feature requests | IT Asset Manager / IT Ops |
| Bug reports | IT Asset Manager / IT Ops |
| Access/role changes | IT Asset Manager |
| Data issues in sheets | IT Ops |

---

*End of User Guide*
