---
title: 'Fuzzy VM Search with Numbered Selection'
type: 'feature'
created: '2026-05-11T14:00:53'
status: 'done'
route: 'one-shot'
---

# Fuzzy VM Search with Numbered Selection

## Intent

**Problem:** The VM search only returned the first match, making it impossible to find VMs when multiple share a similar naming pattern (e.g., searching "core" when many VMs contain that substring).

**Approach:** Replace single-match search with fuzzy substring matching that displays all results with numbered indices. The user enters a number to select the desired VM, then uses the Power On / Shutdown buttons to act on it.

## Suggested Review Order

1. `VMon.ps1:27-92` — **Search logic & selection flow** — Verify fuzzy matching, numbered display, and selection-by-number behaves correctly for 0, 1, and N matches.
2. `VMon.ps1:22-24` — **UI layout** — Confirm infoBox height increase and TopLeft alignment support multi-line result lists.
3. `VMon.ps1:94-120` — **Button state management** — Check that buttons enable/disable based on selection and VM power state, and that error handling covers failed operations.
