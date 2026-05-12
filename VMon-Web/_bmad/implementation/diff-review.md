# Diff Review — Build Pode Web UI for VMon

## Baseline
Commit `b6c9708724ed5a9426bd0c42a81fc44d6bae6b5b` contained a single file `VMon.ps1` — a 203-line Windows Forms GUI app for VM search/power management.

## Changes Summary
- **Modified:** `VMon.ps1` — refactored to dot-source shared logic from `VMon-Logic.ps1`; WinForms UI preserved.
- **Added:** `VMon-Logic.ps1` — extracted credentials, connection, search, and VM action functions.
- **Added:** `server.ps1` — Pode HTTP server (`0.0.0.0:8080`) with REST API and static file serving.
- **Added:** `views/index.html` — dark-themed single-page frontend with search, power controls, and status polling.

---

## VMon.ps1 — BEFORE (baseline)
A single 203-line script containing:
1. Hardcoded vCenter credentials (2 groups, 2 creds)
2. Script-scoped state variables (`$script:LocalCache`, `$script:SelectedVM`, etc.)
3. Windows Forms GUI design (Form, Labels, TextBox, Buttons)
4. `Set-VMSelection` and `Clear-VMSelection` helpers (UI-coupled)
5. `$searchVM` script block with fuzzy search, auto-select, and numbered multi-select
6. Button event handlers for Search, Power On, Shutdown, New Search
7. `Form.Shown` event connecting to vCenters and building cache
8. `$form.ShowDialog()` at bottom

## VMon.ps1 — AFTER
Now a ~150-line WinForms launcher that:
- Dot-sources `. $PSScriptRoot\VMon-Logic.ps1` at the top
- Retains all GUI design code unchanged
- `Set-VMSelection` now calls `Set-VMonSelection` for the VM lookup, then updates UI controls
- `Clear-VMSelection` now calls `Clear-VMonSelection`, then updates button states
- `$searchVM` script block calls `Search-VMonCache` for search logic, then branches on `Type` to update UI
- Button handlers call `Start-VMonVM` and `Stop-VMonVMGuest` instead of inline `Start-VM`/`Stop-VMGuest`
- `Form.Shown` calls `Connect-VMonServers` instead of inline connection code
- Still ends with `$form.ShowDialog()`

## VMon-Logic.ps1 — NEW FILE (~127 lines)
Shared logic dot-sourced by both `VMon.ps1` and `server.ps1`:
- **Credentials:** Same hardcoded vCenter endpoints and PSCredential objects as original.
- **State:** `$script:LocalCache`, `$script:SelectedVM`, `$script:SearchResults`, `$script:ResultsDisplay`, `$script:AwaitingSelection`
- **Connect-VMonServers:** `Set-PowerCLIConfiguration`, `Connect-VIServer` (both groups), `Get-VM` cache build with `Name`, `Id`, `IP`, `vCenter`, `PowerState`. Returns cache count.
- **Get-VMonStatus:** Returns `@{ Connected, VMCount, Servers }` based on `$global:DefaultVIServers`.
- **Search-VMonCache:** Takes `$SearchTerm`, resets state, performs `-like` name / `-match` IP search. Returns typed result object (`empty`, `tooshort`, `none`, `single`, `multiple`). Sets `$script:SearchResults`/`$script:AwaitingSelection` for WinForms multi-select flow.
- **Set-VMonSelection:** `Get-VM -Id`, resets script state, returns VM object.
- **Clear-VMonSelection:** Sets `$script:SelectedVM = $null`, `$script:AwaitingSelection = $false`.
- **Start-VMonVM:** `Get-VM -Id` then `Start-VM -RunAsync`.
- **Stop-VMonVMGuest:** `Get-VM -Id` then `Stop-VMGuest`.

## server.ps1 — NEW FILE (~125 lines)
Pode web server entry point:
- Prerequisites check: `Get-Module -ListAvailable Pode` and `VMware.VimAutomation.Core`
- Dot-sources `VMon-Logic.ps1`
- `Start-PodeServer -Threads 1`:
  - `Add-PodeEndpoint -Address 0.0.0.0 -Port 8080 -Protocol Http`
  - CORS middleware headers
  - Startup: calls `Connect-VMonServers`, logs cache count
  - **Route `GET /api/status`:** calls `Get-VMonStatus`, returns JSON `{ connected, vmCount, servers }`
  - **Route `GET /api/search`:** validates query length ≥2, checks vCenter connection, calls `Search-VMonCache`, returns JSON `{ query, count, results[] }` with `name`, `id`, `ip`, `vcenter`, `powerState`
  - **Route `POST /api/power-on`:** parses JSON body `{ id }`, validates, checks connection, calls `Start-VMonVM`, returns `{ success, message }` or `{ success, error }` with appropriate HTTP status codes
  - **Route `POST /api/shutdown`:** same pattern using `Stop-VMonVMGuest`
  - **Static route `/`:** `Add-PodeStaticRoute -Path '/' -Source './views' -Defaults @('index.html')`

## views/index.html — NEW FILE (~340 lines)
Self-contained dark-themed SPA:
- CSS: `#121212` background, `#1e1e1e` panels, `#4fc3f7` accents, `#69f0ae` green / `#ffab40` orange action buttons
- **Status bar:** polling `/api/status` every 5 seconds, green/red dot, VM count display
- **Search section:** input + Search button, Enter key support
- **Results:** list of VM cards with name, IP, vCenter, power state, and Power On / Shutdown buttons (disabled based on state)
- **Actions:** click handlers call `/api/power-on` or `/api/shutdown` via `fetch()`, show toast notification, refresh search after 1.2s
- **Security:** HTML-escaping helper (`escapeHtml`) for all rendered VM data
