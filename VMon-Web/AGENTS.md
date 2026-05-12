# VMon-Web — AI Agent Context

> **Project type:** Single-file PowerShell GUI application  
> **Runtime:** Windows PowerShell / PowerShell Core on Windows (requires Windows Forms)  
> **Primary language:** English (comments and UI text)

---

## 1. Project Overview

VMon-Web is a lightweight Windows desktop utility that provides a graphical portal for searching and managing VMware virtual machines across multiple vCenter servers. The entire application is contained in a single PowerShell script (`VMon.ps1`).

### What it does
- Connects to one or more VMware vCenter servers on startup.
- Builds a local in-memory cache of all VMs (name, ID, guest IP, vCenter host).
- Presents a search box where operators can type a VM name or IP fragment.
- Performs a fuzzy partial match against the cache.
- Allows powering VMs **ON** (`Start-VM`) or sending a graceful **SHUTDOWN** (`Stop-VMGuest`).

### Architecture
- **Frontend:** Windows Forms (`System.Windows.Forms` + `System.Drawing`).
- **Backend:** PowerCLI cmdlets (`VMware.VimAutomation.Core`).
- **State:** Script-scoped variables (`$script:LocalCache`, `$script:SelectedVM`, `$script:SearchResults`, `$script:AwaitingSelection`).

---

## 2. File Structure

```
VMon-Web/
└── VMon.ps1          # Sole project file — settings, GUI, logic, and entry point
```

There are **no** separate module files, configuration files, build manifests, or test suites.

---

## 3. Technology Stack & Dependencies

| Component | Requirement |
|-----------|-------------|
| OS | Windows (relies on `System.Windows.Forms`) |
| Shell | Windows PowerShell 5.1 or PowerShell 7+ with Windows PSReadLine/Forms support |
| Module | **VMware PowerCLI** (`VMware.VimAutomation.Core`) must be installed and importable |
| .NET Assemblies | `System.Windows.Forms`, `System.Drawing` |

### PowerCLI configuration applied at runtime
```powershell
Set-PowerCLIConfiguration -Scope Session -ParticipateInCEIP $false -InvalidCertificateAction Ignore -Confirm:$false
```

---

## 4. Code Organization (Inside `VMon.ps1`)

The script is organized into six labeled sections:

1. **SETTINGS & CREDENTIALS** — hardcoded vCenter hostnames/IP addresses and PSCredential objects for two distinct environments.
2. **GUI DESIGN** — Windows Forms control instantiation (labels, text box, info panel, four buttons).
3. **HELPERS** — `Set-VMSelection` and `Clear-VMSelection` functions to manage selected-VM state and UI feedback.
4. **SEARCH & SELECT LOGIC** — a script block (`$searchVM`) that handles fuzzy cache searching, single-match auto-selection, and multi-match numbered list selection.
5. **BUTTON HANDLERS** — `KeyDown` and `Click` event handlers for Search, Power On, Shutdown, and New Search.
6. **STARTUP CONNECTION** — `Form.Shown` event that connects to all vCenters, populates the cache, and sets the ready state.

---

## 5. Runtime Behavior

### Startup
1. The form is shown (`$form.ShowDialog()`).
2. On the `Shown` event, the script:
   - Silently ignores invalid SSL certificates for the session.
   - Connects to **Group 1** (`$vCenterGroup1`) with credential `$cred1`.
   - Connects to **Group 2** (`$vCenterGroup2`) with credential `$cred2`.
   - Calls `Get-VM` across all active sessions and caches `Name`, `Id`, `Guest.IPAddress[0]`, and originating vCenter.

### Search Flow
- Operator types ≥ 2 characters and presses **Enter** (or clicks **SEARCH**).
- Cache is filtered with `-like` on name and `-match` on IP.
- **1 result:** auto-selected; action buttons enabled based on `PowerState`.
- **2–20 results:** a numbered list is shown; operator types a number and presses Enter to select.
- **> 20 results:** list is truncated with a "narrow your search" hint.
- **0 results:** "No VM found in cache."

### Actions
- **POWER ON** → `Start-VM -RunAsync`
- **SHUTDOWN** → `Stop-VMGuest` (graceful guest OS shutdown)
- **NEW SEARCH** → clears selection and input, refocuses the search box

---

## 6. Build, Test, and Deployment

| Activity | Status | Notes |
|----------|--------|-------|
| Build system | **None** | No `psd1`, `pssc`, `package.json`, or CI/CD manifests. |
| Unit tests | **None** | No Pester tests or automated validation. |
| Linting / formatting | **None** | Ad-hoc style; mixed one-liner and multi-line control definitions. |
| Deployment | **Manual** | Copy `VMon.ps1` to a Windows host with PowerCLI installed and run it. |

### How to run
```powershell
# Ensure PowerCLI is available
Get-Module -ListAvailable VMware.VimAutomation.Core

# Launch the application
.\VMon.ps1
```

> The script blocks on `$form.ShowDialog()` until the GUI window is closed.

---

## 7. Code Style Guidelines

Because the project is a single script with no enforced tooling, maintain consistency with the existing conventions:

- **Indentation:** 4 spaces.
- **Variable naming:** PascalCase for script-scoped variables (`$script:LocalCache`), camelCase for local variables (`$searchTerm`).
- **Control flow:** One-liner property assignments are common for WinForms objects (`$obj.Property = value; $obj.Other = value`). Preserve this pattern when editing GUI code to keep the file compact.
- **Error handling:** Use `try/catch` around external operations (PowerCLI calls). Set `$ErrorActionPreference` or pass `-ErrorAction Stop` inside `try` blocks.
- **Console output:** Use `Write-Host` with `-ForegroundColor` for startup diagnostics only; avoid console spam during normal GUI interaction.

---

## 8. Security Considerations

### ⚠️ Critical — Hardcoded Credentials
The script currently contains **plaintext-equivalent credentials** embedded directly in the source:
- vCenter usernames and passwords are defined as string literals.
- Passwords are converted to `SecureString` at runtime, but the literal text remains visible in the file.

**Agents must NOT commit or expose this file** to version control, logs, or public repositories without first externalizing credentials.

### Recommended hardening (if refactoring)
1. Move credentials to a separate encrypted file (e.g., `Export-Clixml` of a `PSCredential` object).
2. Read vCenter endpoints from a `.json` or `.psd1` config file outside source control.
3. Avoid `-InvalidCertificateAction Ignore` in production if possible; instead, trust the specific vCenter certificates.

---

## 9. Editing Checklist for Agents

Before modifying `VMon.ps1`, verify:
- [ ] PowerCLI module is available on the target machine.
- [ ] Any new vCenter connections follow the existing dual-credential pattern or are refactored into a loop/config-driven approach.
- [ ] GUI control sizes and positions are adjusted together to avoid layout overlap (designer-less WinForms).
- [ ] Script-scoped state variables (`$script:*`) are updated consistently so the UI and search logic stay in sync.

---

*End of AGENTS.md*
