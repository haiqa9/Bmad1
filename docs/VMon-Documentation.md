# VMon.ps1 — Enterprise VM Portal Documentation

## 1. Overview

**VMon.ps1** is a PowerShell-based Windows desktop application that provides a lightweight, high-speed graphical interface for managing VMware virtual machines across multiple vCenter servers. It enables IT administrators to search, select, and perform power operations on VMs without needing to use the full vSphere Client or PowerCLI command line.

| Attribute | Value |
|-----------|-------|
| **File Name** | `VMon.ps1` |
| **Application Title** | Enterprise VM Portal (High-Speed) |
| **Platform** | Windows PowerShell |
| **GUI Framework** | System.Windows.Forms |
| **Primary Dependency** | VMware PowerCLI |
| **Use Case** | Multi-vCenter VM power management |

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Windows Desktop (User)          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │   Enterprise VM Portal (GUI)    │    │
│  │         VMon.ps1                │    │
│  │  ┌─────────┐  ┌─────────────┐  │    │
│  │  │ Search  │  │ Power Ctrl  │  │    │
│  │  │  Box    │  │  Buttons    │  │    │
│  │  └────┬────┘  └──────┬──────┘  │    │
│  │       └───────────────┘         │    │
│  │         Local VM Cache          │    │
│  └──────────────┬──────────────────┘    │
│                 │                       │
│         PowerCLI API                    │
│                 │                       │
└─────────────────┼───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───┴───┐    ┌────┴────┐   ┌────┴────┐
│vCenter│    │ vCenter │   │ vCenter │
│.1.240  │    │ .1.250  │   │ .1.241  │
│Group 1 │    │ Group 1 │   │ Group 2 │
└───────┘    └─────────┘   └─────────┘
```

### 2.2 Architectural Layers

| Layer | Responsibility | Implementation |
|-------|---------------|----------------|
| **Presentation Layer** | User interface rendering and input handling | Windows Forms (`System.Windows.Forms`) |
| **Business Logic Layer** | Search logic, selection state, action orchestration | PowerShell script blocks and functions |
| **Data Access Layer** | vCenter connectivity and VM data retrieval | VMware PowerCLI cmdlets |
| **Cache Layer** | Local in-memory storage of VM inventory | PowerShell array (`$script:LocalCache`) |

### 2.3 Component Diagram

```
VMon.ps1
│
├── 1. SETTINGS & CREDENTIALS
│   ├── vCenter Group 1 (192.168.1.240, 192.168.2.250)
│   │   └── Credential: haiqa@vsphere.local
│   └── vCenter Group 2 (192.168.1.241)
│       └── Credential: administrator@vsphere.local
│
├── 2. GUI DESIGN
│   ├── Search TextBox
│   ├── Info Display Label
│   ├── SEARCH Button
│   ├── POWER ON Button
│   ├── SHUTDOWN Button
│   └── NEW SEARCH Button
│
├── 3. HELPERS
│   ├── Set-VMSelection()   → Validates and selects VM
│   └── Clear-VMSelection() → Resets selection state
│
├── 4. SEARCH & SELECT LOGIC
│   ├── Fuzzy name/IP matching
│   ├── Single-match auto-select
│   └── Multi-match numbered list
│
├── 5. BUTTON HANDLERS
│   ├── Enter key → Search
│   ├── POWER ON → Start-VM
│   ├── SHUTDOWN → Stop-VMGuest
│   └── NEW SEARCH → Reset
│
└── 6. STARTUP CONNECTION
    ├── Set-PowerCLIConfiguration
    ├── Connect-VIServer (multi-server)
    └── Build LocalCache from Get-VM
```

---

## 3. How It Works

### 3.1 Startup Sequence

When the application launches, the following sequence executes:

1. **PowerCLI Configuration** — Disables CEIP participation and ignores invalid SSL certificates for the session.
2. **vCenter Connections** — Establishes simultaneous connections to all configured vCenter servers using their respective credentials.
3. **Cache Building** — Retrieves all VMs from all connected vCenters and stores them in a local in-memory cache. Each cache entry contains:
   - `Name` — VM display name
   - `Id` — Unique VM identifier
   - `IP` — First detected guest IP address
   - `vCenter` — Origin vCenter server hostname
4. **UI Ready State** — Displays the number of cached VMs and prompts the user to begin searching.

### 3.2 Search Workflow

```
User types search term → Presses ENTER or clicks SEARCH
           │
           ▼
    ┌──────────────┐
    │ Term < 2 chars? │──Yes──→ Show error, require more characters
    └──────┬───────┘
           │ No
           ▼
    ┌──────────────┐
    │ Fuzzy match  │
    │ Name OR IP   │
    └──────┬───────┘
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
  0 results  1 result   2+ results
     │         │          │
     ▼         ▼          ▼
  "No VM    Auto-     Show numbered
   found"   select     list (max 20)
            the VM     Await selection
```

**Search Behavior Details:**
- **Fuzzy Matching**: Uses `-like "*$searchTerm*"` for names and regex matching for IPs
- **Single Result**: Automatically selects the VM and displays its status
- **Multiple Results**: Displays a numbered list; user types the number and presses ENTER to select
- **Minimum Input**: Requires at least 2 characters to prevent overly broad searches

### 3.3 VM Selection State Machine

```
┌─────────┐     Search (multiple)      ┌─────────────┐
│  IDLE   │ ──────────────────────────→│  SELECTING  │
│ (ready) │                            │(list shown) │
└────┬────┘                            └──────┬──────┘
     │                                         │
     │ Search (single)                         │ Number + Enter
     ▼                                         ▼
┌─────────┐                            ┌─────────────┐
│ SELECTED│←───────────────────────────│   SELECTED  │
│(active) │    Auto-select              │   (active)  │
└────┬────┘                            └─────────────┘
     │
     │ Power On / Shutdown
     ▼
┌─────────┐
│ ACTION  │
│(pending)│
└─────────┘
```

### 3.4 Power Operations

| Operation | PowerCLI Command | Behavior | Button State |
|-----------|-----------------|----------|--------------|
| **Power On** | `Start-VM -RunAsync` | Starts the VM asynchronously | Enabled only when VM is `PoweredOff` |
| **Shutdown** | `Stop-VMGuest` | Sends graceful shutdown signal to guest OS | Enabled only when VM is `PoweredOn` |

The UI dynamically updates button availability based on the selected VM's current power state.

---

## 4. Technical Specifications

### 4.1 Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| **Windows PowerShell** | 5.1 or later | Runtime environment |
| **.NET Framework** | 4.5+ (for Windows Forms) | GUI rendering |
| **VMware PowerCLI** | Latest stable | vCenter/ESXi API access |
| **System.Windows.Forms** | Built-in | UI controls |
| **System.Drawing** | Built-in | Graphics and sizing |

### 4.2 Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| **vCenter Group 1** | `192.168.1.240`, `192.168.2.250` | First vCenter cluster |
| **vCenter Group 2** | `192.168.1.241` | Second vCenter server |
| **Search Threshold** | 2 characters | Minimum input length |
| **Max List Display** | 20 items | Results shown before truncation |
| **Window Size** | 500 x 480 pixels | Application dimensions |
| **Start Position** | CenterScreen | Window placement |

### 4.3 Script Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `$script:LocalCache` | Script | Stores all VM objects from all vCenters |
| `$script:SelectedVM` | Script | Currently selected VM object |
| `$script:SearchResults` | Script | Results from the last search operation |
| `$script:ResultsDisplay` | Script | Formatted string for multi-result display |
| `$script:AwaitingSelection` | Script | Flag indicating numeric selection mode |

### 4.4 Functions

#### `Set-VMSelection`
**Parameters:** `$Match` (VM cache entry)
**Purpose:** Validates the VM still exists, retrieves current state, updates UI with selection info, and enables appropriate action buttons.

#### `Clear-VMSelection`
**Parameters:** None
**Purpose:** Resets all selection-related state variables and disables action buttons.

---

## 5. Security Considerations

> ⚠️ **IMPORTANT SECURITY NOTICE**
>
> The current implementation contains **hardcoded credentials** within the script file:
> - Username and password for `haiqa@vsphere.local`
> - Username and password for `administrator@vsphere.local`
>
> **Risk:** Credentials are stored in plaintext within the script and are visible to anyone with read access.
>
> **Recommended Mitigations:**
> 1. Use Windows Credential Manager (`Get-StoredCredential` / `Import-Clixml`)
> 2. Implement certificate-based authentication
> 3. Use Active Directory integrated authentication where possible
> 4. Store credentials in encrypted files readable only by the service account
> 5. Apply NTFS permissions restricting script access to authorized users

---

## 6. Error Handling

| Scenario | Behavior |
|----------|----------|
| **VM no longer exists** | Displays error in info box, clears selection, disables buttons |
| **Power operation fails** | Shows exception message in red text |
| **Invalid selection number** | Displays error with valid range, maintains selection mode |
| **vCenter connection fails** | Silently continues (`SilentlyContinue`); VMs from that vCenter won't appear in cache |
| **Search with < 2 chars** | Prompts user to enter more characters |

---

## 7. UI Reference

### 7.1 Layout

```
┌─────────────────────────────────────────┐
│  Enterprise VM Portal (High-Speed)      │
├─────────────────────────────────────────┤
│  Search VM: [________________] [SEARCH] │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Info / Status Display Panel    │   │
│  │                                 │   │
│  │  Shows:                         │   │
│  │  • System status                │   │
│  │  • Search results               │   │
│  │  • VM details                   │   │
│  │  • Error messages               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [  POWER ON  ]    [   SHUTDOWN   ]    │
│    (LightGreen)       (Orange)          │
│                                         │
│  [          NEW SEARCH                ] │
└─────────────────────────────────────────┘
```

### 7.2 Color Coding

| Element | Color | Meaning |
|---------|-------|---------|
| **POWER ON button** | LightGreen | Start/enable action |
| **SHUTDOWN button** | Orange | Stop action |
| **Status: PoweredOn** | Green | VM is running |
| **Status: PoweredOff** | Red | VM is stopped |
| **Informational text** | Blue | Selection/match info |
| **Errors** | DarkRed | Failure or invalid input |
| **Default text** | Black | Normal/ready state |

---

## 8. Operational Notes

### 8.1 Performance Characteristics
- **Cache-based search**: All VM data is loaded at startup, making searches instantaneous
- **Asynchronous power operations**: `Start-VM` uses `-RunAsync` to prevent UI blocking
- **Session-scoped PowerCLI config**: No permanent changes to PowerCLI settings

### 8.2 Limitations
- VM cache is built once at startup; newly created VMs require a restart to appear
- Graceful shutdown (`Stop-VMGuest`) requires VMware Tools to be installed and running in the guest
- Hardcoded to exactly two vCenter credential groups
- No support for VM operations beyond power on/shutdown (no restart, suspend, or snapshot operations)
- No automatic cache refresh or periodic synchronization

### 8.3 Typical Use Cases
1. **Help Desk Operators** — Quickly find and power on user VMs without vSphere Client access
2. **Non-Technical Staff** — Simple interface for basic VM operations
3. **Multi-vCenter Environments** — Single pane for VMs across disparate vCenter instances
4. **Rapid VM Location** — Fuzzy search by partial name or IP address

---

## 9. Maintenance & Troubleshooting

| Issue | Likely Cause | Resolution |
|-------|-------------|------------|
| "No VM found in cache" | Search term too specific or VM doesn't exist | Verify VM name/IP; restart to refresh cache |
| "ERROR: VM no longer available" | VM was deleted or vCenter disconnected | Verify VM exists in vSphere Client |
| Buttons disabled | No VM selected or invalid selection | Perform a successful search and selection |
| Connection failures | Network or credential issues | Verify vCenter IPs and credentials |
| Cache count = 0 | All vCenter connections failed | Check PowerCLI installation and network connectivity |

---

## 10. File Location

```
D:\Bmad\VMon.ps1
```

---

*Document Version: 1.0*  
*Generated: 2026-05-12*  
*Subject to change as the application evolves.*
