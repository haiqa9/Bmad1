---
title: Vault object inventory + management learnings — handover for the OpenBao migration
type: reference
status: living — structural inventory confirmed live 2026-07-01; exact secret paths + two policies marked INFERRED (verify with the appendix)
audience: haiqa.ashraf@expertflow.com (OpenBao migration implementor), andreas.stuber@expertflow.com (owner)
authored: 2026-07-01
authored_by: Opus 4.8 (root-recovery + rw-policy session)
supersedes_confusion_in:
  - docs/vault.md (still recommends Infisical; describes secret-ef-agentic as read-only — both stale)
related:
  - docs/vault/adr-vault-platform-openbao.md
  - docs/vault/spec-openbao-migration.md
  - docs/vault/policy-ef-agentic-rw-grant.md
  - docs/vault/tooling-cloud-run-vault-runbook.md
---

# Vault inventory + learnings for the OpenBao migration

Haiqa — you own `spec-openbao-migration.md`, which is solid on the *mechanics* (VM, Raft,
KMS unseal, namespaces). This document is the missing companion: **what each existing Vault
object actually is** (many names are LLM-generated and opaque even to Andreas), plus the
**hard-won operational learnings** from the 2026-07-01 root-recovery session that should
change *how* you run the migration. Read §1 (naming) and §2 (inventory) before touching the
migration; §4 lists concrete course-corrections to fold into your spec.

---

## 0. Why OpenBao (the decision — already concluded)

The move off HashiCorp Vault CE was decided in **`adr-vault-platform-openbao.md`**
(2026-06-29, **Accepted**) — treat that ADR as the authority; this section only restates it.

**The decisive driver is namespaces: we need multiple independent, isolated vaults — one
per external client (and per team).** Vault CE (OSS) has **no namespaces** (Enterprise-only,
paid); **OpenBao ships them in OSS, free.** That is a *capability gap* Vault CE cannot meet,
not a licensing preference. Vault's BUSL license change is a **bonus, not the reason**. The
Infisical recommendation still sitting in `docs/vault.md §10` is **superseded** by this ADR.

---

## 1. How the names are constructed (decode the pattern)

The names follow a loose convention. Once you see it, the opaque ones become readable:

| Fragment | Meaning |
|---|---|
| `secret-<domain>/` | A **KV v2 secrets engine mount** — casually "a vault." Holds actual secret values. |
| `policy-<domain>` | An **ACL policy** (HCL) — a set of path→capability rules. Grants access; holds no secrets. |
| `<domain>-ro` / `<domain>-rw` | ACL policies too — read-only / read-write variants over one mount. |
| `auth/<method>/` | An **authentication method mount** — how a human/service proves identity and receives a token with policies attached. |
| `ef-` prefix | "Expertflow" internal (e.g. `ef-agentic`, `ef-itassets`). |

**Domain tokens** (the confusing middle part):

| Domain | What it actually refers to |
|---|---|
| `standard` | Everyday secrets any employee may read. |
| `breakglass` | Emergency/owner-only admin secrets; TOTP-gated. |
| `ef-agentic` | Expertflow's **AI "agentic" pipeline** (EFAgenticSpec / OpenBrain retrieval). Started as read-only integration tokens; now also holds the OpenBrain retrieval DB creds. |
| `it` | General **IT / infrastructure admin** secrets (console/API tokens IT manages). |
| `ef-itassets` | Secrets owned by the **EFITAssets repo's own services** (e.g. the Document Gateway `efgateway`). |
| `rotation` | The **automated password-rotation job** (weekly Cloud Run Job). |
| `gha-efitassets-sync` | A **GitHub Actions** token/workflow (`vault-gcp-sync`) that syncs secrets to GCP. |

So `secret-ef-agentic` = "the mount holding the AI-pipeline secrets," and `ef-agentic-rw` =
"the policy giving read-write over that mount." Not obvious from the string alone — hence
this table.

---

## 2. Inventory — every object, what it is, and confidence

### 2a. Secret mounts (the "vaults")

| Mount | What it holds / is for | Who reads it | Committed HCL? | Notes |
|---|---|---|---|---|
| `secret-standard/` | Everyday ERP/service creds (`internal-erp/db`, expense-api, Directus tokens, GCP deploy key, OTRS). | Any `@expertflow.com` (read). | policy only, not mount def | Documented in `docs/vault.md §3a`. |
| `secret-breakglass/` | Owner/admin creds: `bs4_dev` & `postgres` DB passwords, Anthropic key, **`idp/google` (the Google OIDC client secret Vault itself logs in with)**, Cloudflare/Atlassian/CPQ/Vaultwarden admin. | andreas + TOTP only. | policy only | The OIDC client secret lives here — migration needs it (spec §7). |
| `secret-ef-agentic/` | AI-pipeline secrets. Read-only integration tokens (Confluence/Jira read-only, Postman) **AND** `efretrieval/neon` — the OpenBrain retrieval Neon Postgres connection. | Read: any employee (via `ef-agentic-ro`). **Write: see §3 — domain-wide, a problem.** | ❌ no HCL | `docs/vault.md §3c` wrongly calls this "read-only"; it now has write + a live DB cred. |
| `secret-it/` | IT/infrastructure admin secrets. Confirmed path: `efretrieval/neon-console` (Neon **console** API token — label/api_key/project_url). | Holders of `policy-it` (write). Andreas's standard login has it. | ❌ no HCL | Distinct mount from `secret-ef-agentic`; easy to confuse. |
| `secret-ef-itassets/` | EFITAssets **repo services'** own secrets, e.g. `efgateway/neon` (Document Gateway's Neon DB connection). | efgateway Cloud Run + devs. | ❌ no HCL | Listed in migration spec §6/checklist; NOT in `docs/vault.md §3`. INFERRED contents — verify. |

> Mounts marked "❌ no HCL" exist only as **live Vault state** created out-of-band across
> LLM sessions. There is no reviewable source for them — a core reason nobody can say
> authoritatively what they are. The migration is the moment to fix that (see §4).

### 2b. Policies (access rules — hold no secrets)

| Policy | Grants | Attached to | Confidence |
|---|---|---|---|
| `policy-standard` | read/list `secret-standard/*` + token self-mgmt | `standard-google` role | committed HCL ✅ |
| `policy-breakglass` | full CRUD on `secret-standard`+`secret-breakglass`; curated `sys/*` admin (mounts, policies, auth, audit) — **excludes** seal/generate-root/rekey (root-only) | `breakglass-google` role | committed HCL ✅ |
| `ef-agentic-ro` | read/list `secret-ef-agentic/*` | `standard-google` role | confirmed live ✅ |
| `ef-agentic-rw` | **full CRUD** on `secret-ef-agentic/*` (incl. undelete) | **bare `oidc/` mount, role `ef-agentic`** | confirmed live ✅ — see §3 |
| `policy-it` | full CRUD on **`secret-it/*`** (a different mount) | `standard-google` role | confirmed live ✅ |
| `policy-rotation` | (inferred) whatever the weekly rotation job needs to write rotated DB passwords | rotation job identity | INFERRED — verify |
| `gha-efitassets-sync` | (inferred) scoped read for the GitHub Actions GCP-sync workflow | a GHA token | INFERRED — verify |

### 2c. Auth methods (how you log in → which policies you get)

| Auth mount | Role | Login command | Policies issued | Confidence |
|---|---|---|---|---|
| `auth/google/` | `standard-google` | `vault login -method=oidc -path=google` | `default, policy-standard, policy-it, ef-agentic-ro` | confirmed live ✅ |
| `auth/google-breakglass/` | `breakglass-google` | `vault login -method=oidc -path=google-breakglass` (+TOTP) | `policy-breakglass` | confirmed live ✅ |
| `auth/oidc/` (**bare**) | `ef-agentic` (**default_role**) | `vault login -method=oidc` (**no `-path`**) | `ef-agentic-rw` | confirmed live ✅ — the problem in §3 |
| `auth/token/` | — | built-in | — | built-in |

---

## 3. The security finding this session surfaced (fix during migration)

`ef-agentic-rw` — **full write/delete on the entire AI-pipeline mount** — is granted by the
**bare `auth/oidc/` mount**, whose `default_role` is `ef-agentic`, bound only by
`hd = expertflow.com`. Consequence: **any employee** who runs `vault login -method=oidc`
*without* `-path=google` silently gets destructive access to every secret under
`secret-ef-agentic/`. The sanctioned `-path=google` form gives only read. This is exactly
the "bare `-method=oidc` hits a different mount with broader grants" that `CLAUDE.md` warns
against — and it's how `efretrieval/neon` got undeleted. Full detail:
`docs/vault/policy-ef-agentic-rw-grant.md`.

**Migration action:** do **not** replicate the bare `oidc/` mount. Your spec §7 only
re-creates `auth/google/` + `auth/google-breakglass/` — good, that already drops it. But
decide *deliberately* where write to `secret-ef-agentic` should live: bind `ef-agentic-rw`
to a **named service identity** (the ingestion/indexer that actually writes) or to
break-glass, **not** to a domain-wide default role.

---

## 4. Course-corrections for the OpenBao migration (fold into your spec)

1. **Bring every mount/policy under committed HCL first.** Five mounts and ≥5 policies are
   live-only drift (§2). Reconstruct their HCL from the live state (the ACLs are captured in
   `policy-ef-agentic-rw-grant.md`; run the appendix for the rest) and commit them to
   `tooling/cloud-run-vault/policies/` in the BS4 repo **before** migrating. You can't
   faithfully migrate what has no source of truth.
2. **Re-scope `ef-agentic-rw` (§3) — don't carry the domain-wide write across.** The
   migration is the clean moment to fix it.
3. **Init OpenBao with a real quorum, not `-key-shares=1 -key-threshold=1`.** Your spec §4
   uses a single share. That's the *exact* failure mode we nearly hit this session: a single
   lost share = permanent lockout; a single leaked share = full compromise. The current
   Vault uses **3 shares / threshold 2** — mirror that, and store the shares in **separate**
   offline locations.
4. **Test the root-recovery ceremony immediately after init — before decommissioning CE.**
   We discovered the recovery path was untested only during an incident. Add to your
   checklist: run `operator generate-root` end-to-end from the recovery shares, confirm you
   get a working root token, then revoke it. (OpenBao's CLI is a Vault fork — expect the
   same `generate-root` flow, and possibly the same Windows `-decode` bug; the PowerShell
   XOR workaround is in `policy-ef-agentic-rw-grant.md` / memory.)
5. **Don't keep a standing root token (Option A).** Both `docs/vault.md` and your spec §4
   say "save root token to KeePass." Prefer: store nothing standing; keep only the offline
   recovery shares and mint root on demand via the ceremony, revoking after. A persisted
   root token in `.claude.json` is what caused the 2026-06 incident.
6. **Keep the current Vault CE online and read-only until every consumer is verified** on
   OpenBao (spec §10 already says this — honour it strictly; verify-before-decommission is
   the same discipline as verify-before-delete).

---

## 5. Operational learnings (apply on both platforms)

- **`VAULT_TOKEN` env poisoning** — a stale/revoked token in the env var overrides
  `~/.vault-token` and returns **403 on everything, including `lookup-self`**, masquerading
  as a broken policy or MFA. On any surprising 403, **first** check `$env:VAULT_TOKEN`
  exists/length (never print it). On OpenBao the var may be `BAO_TOKEN` — check both.
- **`generate-root` recovery gotchas** (see `project_vault_generate_root_decode` memory):
  after `-cancel`, confirm `-init` returns a **new nonce** (a repeated nonce means cancel
  didn't take and your OTP won't match); never pipe the interactive key entry through
  `ConvertFrom-Json` (disables the hidden prompt); on Windows, decode via the PowerShell XOR
  fallback, not the CLI's broken `-decode`.
- **Never echo secrets** — recovery shares/root tokens/connection strings/API keys never go
  into chat, tool output, or committed files. `vault token lookup -format=json` + select
  only `display_name,policies,ttl` (default output leaks the token id).
- **Verify-before-delete, in a *separate* session** — never remove a file/secret/mount until
  an independent session has confirmed its replacement is safely in the target location.

---

## 6. Documentation debt to clear (part of the migration)

- **`docs/vault.md` recommends Infisical** — superseded by `adr-vault-platform-openbao.md`
  (OpenBao accepted). Update §10 to reflect the OpenBao decision.
- **`docs/vault.md §3c` calls `secret-ef-agentic` "read-only"** — false; it has `ef-agentic-rw`
  and a live DB cred. Fix.
- **`docs/vault.md §3` omits `secret-it` and `secret-ef-itassets`** — add them.
- **Root-token storage is described three ways** across docs (KeePass / `.claude.json` /
  offline recovery shares). Pick one policy (recommend Option A, §4.5) and make every doc
  agree.

---

## 7. Appendix — make this inventory authoritative

Run under root (or break-glass for structure; `ef-agentic-ro`/`policy-it` tokens for the
`secret-ef-agentic`/`secret-it` listings). Read-only; policy/mount/path names are not
secrets. Paste results back and this doc's INFERRED rows can be confirmed.

```powershell
"### SECRET MOUNTS ###"
& C:\Users\andre\bin\vault.exe secrets list
"### ALL POLICIES ###"
& C:\Users\andre\bin\vault.exe policy list
foreach ($p in (& C:\Users\andre\bin\vault.exe policy list)) {
  if ($p -in 'root','default') { continue }
  "----- $p -----"; & C:\Users\andre\bin\vault.exe policy read $p
}
"### SECRET PATHS PER MOUNT (top 2 levels) ###"
foreach ($m in 'secret-standard','secret-breakglass','secret-ef-agentic','secret-it','secret-ef-itassets') {
  "----- $m -----"
  $top = & C:\Users\andre\bin\vault.exe kv list -format=json $m 2>$null | ConvertFrom-Json
  foreach ($k in $top) { if ($k -match '/$') { "$k"; (& C:\Users\andre\bin\vault.exe kv list -format=json "$m/$k" 2>$null | ConvertFrom-Json) | ForEach-Object { "  $_" } } else { "$k" } }
}
```
