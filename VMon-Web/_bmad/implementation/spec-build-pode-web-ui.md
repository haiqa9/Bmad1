---
title: 'Build Pode Web UI for VMon'
type: 'feature'
created: '2026-05-12'
status: 'done'
baseline_commit: 'b6c9708724ed5a9426bd0c42a81fc44d6bae6b5b'
context:
  - 'AGENTS.md'
  - 'VMon.ps1'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** VMon.ps1 is a single-file Windows Forms GUI that only runs locally. Operators cannot access it from other machines on the network, and it requires a Windows desktop session.

**Approach:** Build a lightweight HTTP web interface using the Pode PowerShell module that exposes the same VM search, power-on, and shutdown capabilities via REST API endpoints and a browser-based frontend. The server will listen on `0.0.0.0` for LAN access.

## Boundaries & Constraints

**Always:**
- Reuse existing PowerCLI connection logic and VM cache from `VMon.ps1` without duplicating credential definitions.
- Server must listen on `0.0.0.0` so other computers on the network can reach it.
- Dark-mode CSS theme for the frontend.
- All PowerCLI actions (`Start-VM`, `Stop-VMGuest`) must run with `-Confirm:$false` and appropriate error handling.
- The Pode server and the HTML frontend must be production-ready (no placeholder stubs).

**Ask First:**
- If Pode module is not installed on the target machine, whether to install it automatically or abort.
- Whether to add authentication/authorization to the web UI (current scope is open access).

**Never:**
- Do not rewrite or remove the existing `VMon.ps1` Windows Forms app — it must remain functional.
- Do not change vCenter credentials or connection endpoints.
- No persistent database or session store; keep the in-memory cache model.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Search happy path | `GET /api/search?q=web` | JSON array of matching VMs (name, id, ip, vcenter, powerState) | 200 OK, empty array if no matches |
| Search too short | `GET /api/search?q=a` | 400 Bad Request | Message: "Query must be at least 2 characters" |
| Power on | `POST /api/power-on` with `{ "id": "vm-123" }` | 200 OK with result message | 404 if VM not found; 500 if PowerCLI fails |
| Shutdown | `POST /api/shutdown` with `{ "id": "vm-123" }` | 200 OK with result message | 404 if VM not found; 500 if PowerCLI fails |
| Status check | `GET /api/status` | JSON with `connected: true/false` and cached VM count | 200 OK always |
| Server not connected | Cache empty or no vCenter sessions | Status endpoint returns `connected: false` | Other endpoints return 503 with message |

</frozen-after-approval>

## Code Map

- `VMon.ps1` -- Existing Windows Forms app; source of truth for credentials, vCenter groups, and PowerCLI logic. Will be dot-sourced by the server.
- `server.ps1` -- Pode server entry point: imports VMon logic, defines routes, starts HTTP listener on `0.0.0.0`.
- `views/index.html` -- Single-page frontend with search bar, results list, power-on/shutdown buttons, status indicator, and dark-mode CSS.

## Tasks & Acceptance

**Execution:**
- [x] `server.ps1` -- Create Pode server script that dot-sources `VMon.ps1` (or its logic functions), starts on `0.0.0.0:8080`, and defines `/api/search`, `/api/power-on`, `/api/shutdown`, and `/api/status` routes.
- [x] `server.ps1` -- Extract reusable connection/cache logic from `VMon.ps1` into importable functions (or refactor `VMon.ps1` so its logic can be dot-sourced without launching the GUI).
- [x] `views/index.html` -- Build dark-themed SPA with search input, results display, Power On / Shutdown buttons, and a live status indicator. Use vanilla JS and fetch() to call the API.
- [x] `views/index.html` -- Add status indicator that polls `/api/status` every 5 seconds to show vCenter connection state.

**Acceptance Criteria:**
- Given the server is running, when I open `http://<server-ip>:8080` from another computer, then the dark-themed UI loads.
- Given I type at least 2 characters in the search box, when I submit, then matching VMs appear in a list with name, IP, vCenter, and power state.
- Given I select a VM from search results, when I click Power On or Shutdown, then the correct API endpoint is called and a success/error message is shown.
- Given the server has no vCenter connection, when I view the page, then the status indicator shows "Disconnected" and search returns an appropriate error.
- Given `VMon.ps1` still exists unchanged, when I run it directly, then the Windows Forms GUI still works as before.

## Spec Change Log

## Design Notes

### Refactoring VMon.ps1 for reuse
The existing script runs `Add-Type`, instantiates Forms, and calls `$form.ShowDialog()` at the bottom. To reuse its credentials and PowerCLI logic without launching the GUI, we have two options:

1. **Extract a module** — move settings, helpers, and connection logic into `VMon-Logic.ps1`, make `VMon.ps1` import it, and have `server.ps1` import it too. This is clean but touches the existing file more.
2. **Dot-source with guard** — wrap the Forms-specific bottom section (`$form.ShowDialog()`) in a `if ($Host.Name -ne 'ServerRemoteHost')` or parameter guard so dot-sourcing does not launch the GUI.

**Chosen approach:** Extract `VMon-Logic.ps1` containing credentials, cache variables, `Set-VMSelection`, `Clear-VMSelection`, the search block logic, and the startup connection sequence. `VMon.ps1` becomes a thin launcher that imports `VMon-Logic.ps1` and builds the WinForms UI. `server.ps1` imports `VMon-Logic.ps1` and exposes the same logic via REST. This keeps backward compatibility while enabling reuse.

### Pode route design
- `Add-PodeRoute -Method Get -Path '/api/search' -ScriptBlock { ... }` — reads `Data.Query['q']`, performs fuzzy cache search, returns JSON.
- `Add-PodeRoute -Method Post -Path '/api/power-on' -ScriptBlock { ... }` — reads JSON body `{id}`, validates, calls `Start-VM -RunAsync`.
- `Add-PodeRoute -Method Post -Path '/api/shutdown' -ScriptBlock { ... }` — reads JSON body `{id}`, validates, calls `Stop-VMGuest`.
- `Add-PodeRoute -Method Get -Path '/api/status' -ScriptBlock { ... }` — checks `$global:DefaultVIServers`, returns `{connected: bool, vmCount: int}`.
- `Add-PodeStaticRoute -Path '/' -Source './views'` — serves `index.html`.

## Spec Change Log

- **Review Loop 1** — Addressed patch findings from adversarial + edge-case + acceptance reviews:
  - `server.ps1` power-on/shutdown routes now return **404** when `Get-VM -Id` cannot find the VM, and **500** only for actual PowerCLI execution failures.
  - `server.ps1` static route path changed from relative `./views` to `(Join-Path $PSScriptRoot 'views')` so the UI works regardless of working directory.
  - `server.ps1` added `try/catch` around `ConvertFrom-Json` to return **400** for malformed request bodies.
  - `server.ps1` search route now handles repeated query parameters (`$q -is [array]`).
  - `views/index.html` added `escapeAttr()` for HTML attribute escaping (data-id) and case-insensitive `powerState` comparison.
  - `views/index.html` added `AbortController` with 30-second timeout on power-action fetches.

## Verification

**Commands:**
- `Get-Module -ListAvailable Pode` -- expected: Pode module is found
- `Import-Module Pode; Start-PodeServer` (dry-run) -- expected: server starts without errors

**Manual checks:**
- Open `http://localhost:8080` in a browser and verify the dark-themed UI renders.
- Search for a known VM and verify results appear.
- Check the status indicator updates after stopping/starting vCenter connectivity.

## Suggested Review Order

**Shared Logic Extraction**

- Extracted credentials, connection, search, and VM actions into a dot-sourceable module.
  [`VMon-Logic.ps1:1`](../../VMon-Logic.ps1#L1)

- PowerCLI session configuration and dual-vCenter connection with cache build.
  [`VMon-Logic.ps1:25`](../../VMon-Logic.ps1#L25)

- Fuzzy search by name (`-like`) or IP (`-match`) with typed result objects.
  [`VMon-Logic.ps1:46`](../../VMon-Logic.ps1#L46)

- VM action wrappers (`Start-VM -RunAsync`, `Stop-VMGuest`) with error propagation.
  [`VMon-Logic.ps1:115`](../../VMon-Logic.ps1#L115)

**Web Server API**

- Pode entry point with prerequisite checks and shared-logic dot-source.
  [`server.ps1:1`](../../server.ps1#L1)

- HTTP endpoint bound to `0.0.0.0:8080` for LAN access.
  [`server.ps1:25`](../../server.ps1#L25)

- Search route with query validation, connection gate, and result flattening.
  [`server.ps1:57`](../../server.ps1#L57)

- Power-on route with JSON validation, VM-existence check (404), and action-error handling (500).
  [`server.ps1:95`](../../server.ps1#L95)

- Shutdown route mirroring the power-on pattern for graceful guest shutdown.
  [`server.ps1:148`](../../server.ps1#L148)

- Static file route anchored to `$PSScriptRoot` for reliable path resolution.
  [`server.ps1:203`](../../server.ps1#L203)

**Frontend**

- Dark-themed SPA with status polling, search, and action-toast UI.
  [`views/index.html:1`](../../views/index.html#L1)

- Result rendering with case-insensitive power-state comparison and attribute escaping.
  [`views/index.html:328`](../../views/index.html#L328)

- Action handler with `AbortController` timeout and automatic search refresh.
  [`views/index.html:351`](../../views/index.html#L351)

**WinForms Backward Compatibility**

- Thin launcher dot-sourcing shared logic before building the GUI.
  [`VMon.ps1:4`](../../VMon.ps1#L4)

- UI-specific selection wrapper calling shared `Set-VMonSelection` then updating controls.
  [`VMon.ps1:33`](../../VMon.ps1#L33)

- Search script block delegating to `Search-VMonCache` and branching on result type.
  [`VMon.ps1:63`](../../VMon.ps1#L63)
