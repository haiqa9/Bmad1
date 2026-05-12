# Deferred Work

Items identified during adversarial review that are pre-existing issues not caused by the current change.

## Credential & Security
- [ ] **Hardcoded plaintext credentials** — `'Expert@ef4'` baked into script source. Should use `Get-Credential`, secure credential files, or environment variables.
- [ ] **TLS certificate validation disabled** — `InvalidCertificateAction Ignore` exposes tool to MITM attacks. Should validate certificates in production.

## Connection & Session Management
- [ ] **vCenter connection failures silently swallowed** — `-ErrorAction SilentlyContinue` with no validation that `DefaultVIServers` succeeded. UI claims "READY" even if all connections failed.
- [ ] **vCenter sessions never disconnected** — Leaks authenticated PowerCLI sessions when form closes. Should call `Disconnect-VIServer` in a form-closing event.
- [ ] **No PowerCLI module prerequisite check** — Script emits cryptic command-not-found errors on machines without VMware PowerCLI installed.

## UI/UX & Performance
- [ ] **Startup cache build blocks UI thread** — `Add_Shown` runs synchronously, freezing the form until all vCenter queries complete. Should use a background job or async pattern.
- [ ] **VM cache never refreshed** — Populated once at startup; any VM renamed, deleted, or provisioned after launch renders cached data stale.
- [ ] **Stop-VMGuest assumes VMware Tools** — No fallback to `Stop-VM` if guest OS does not respond. No feedback to operator on failure (partially patched; `Stop-VM` fallback still missing).
