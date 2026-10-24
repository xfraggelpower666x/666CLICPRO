# 666CLIC REV91 — Static Carrier and Preflight Regression Audit
SYSTEM_ID=666CLIC
DATE_LOCAL=2026-10-05
CLASS=PUBLIC_SANITIZED_CLIC_OWNED_EVIDENCE
SCOPE=GITHUB_STATIC_SOURCE_READBACK_NOT_RUNTIME
CURRENT_NATIVE_REV=91
CURRENT_NATIVE_AUTHORITY=GOOGLE_DRIVE
SOURCE_POINTER_ID=1y2d-py32XL8S9zJjZXZbNZSiycbbsPDhyGX3lqnqFqA
SOURCE_WORK_ID=1GpABAjo_wwOgIe9z9oj2UvwQ3zCe98n1wpFqpcggjEQ
SOURCE_DEV_ID=1o7VftbTNHFYX5lx0y90cw7NgT5SVNvVVjPOthrb9G3Q
PRECHANGE_GITHUB_HEAD=36f5b39d7c6fbb53e1c44561d62f6f3ae5e3c168
BACKUP_BRANCH=clic-pre-rev91-static-audit-20261005-0103
STATUS=PARTIAL_STATIC_PASS_NOT_RUNTIME_ACCEPTANCE
PRODUCTION_PROMOTION=FALSE
NO_FOREIGN_MUTATION=TRUE

## Direct observations
- Native Drive pointer, Work and Dev-Control were independently fetched. Last current source revision in each: REV91.
- GitHub required_order contains 12 entries and all 12 were individually readable by exact path in this session; an initial transient fetch error for FORENSICS_AND_BOUNDARIES.md was retried successfully.
- Eight narrow structural preflight predicates passed: all carriers readable; exact required order; REV91 bridge first; REV91 secondary guard second; Drive authority; REV90 historical evidence distinct from effective REV91; runtime outcome remains PARTIAL/OPEN; revision conflicts quarantine.
- Manifest historic current_source_evidence.clic_revision=90 remains historical, while currentness_resolution.effective_source_revision=91.
- Files AUTHORITY_CONTRACT.md, CURRENT_STATE.md, OPERATIONS_CENTER.md and RECOVERY_AND_HANDOFF.md contain older historical authority/currentness wording; later REV91 bridge and guard explicitly supersede current assertions. No historical rewrite performed.
- Each fetched file was returned through GitHub but this audit does not assert byte-exact private archive integrity, production loader execution or a true fresh-chat restart.

## Narrow, explicitly structural gate matrix
STAGING_REQUIRED_ORDER_READBACK=PASS_12_OF_12
STATIC_REV91_PRECEDENCE_PREDICATES=PASS_8_OF_8
GOOGLE_DRIVE_REV91_POINTER_WORK_DEV_SOURCE_READ=PASS_3_OF_3
GITHUB_STAGING_NATIVE_AUTHORITY=FALSE
P14=OPEN_EVENT_GATED
P20_NEW_UI_CHAT_INCOMING=OPEN_NOT_EXECUTED
P21_FUNCTIONAL_CAUSAL=OPEN_NOT_EXECUTED
P21_HISTORICAL_A_TO_E_SCOPE=PRESERVED_COMPLETE_CURRENT_SCOPE
LIVE_CIRCLE_KEEP_ACTIVE=OPEN_NOT_EXECUTED
LIVE_CIRCLE_KEEP_REACHABLE=OPEN_NOT_EXECUTED
LIVE_CIRCLE_SUPERSEDE=OPEN_NOT_EXECUTED
FULL_SEMANTIC_COVERAGE=OPEN
PRIVATE_RECOVERY=OPEN
ISOLATED_RESTORE=OPEN
BYTE_EXACT_ARCHIVE_INTEGRITY=OPEN
PERMISSIONS_SECURITY_REVIEW=OPEN
PUBLIC_PRIVATE_BOUNDARY=NO_RAW_PRIVATE_EXPORT_PERFORMED
FOREIGN_SYSTEM_MUTATION=NONE
PROMOTION=NOT_PERFORMED

## Negative tests required later, not performed
- Missing or stale Google Drive CURRENT must fail closed and must not silently use REV79/80 cached GitHub metadata.
- Manually supplied handoff must not count as automatic fresh-chat discovery.
- An older active child label must not supersede a valid later retirement, rename, or backup-only override.
- Public GitHub staging must never become authoritative because of a static readback pass.
