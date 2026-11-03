# 666CLIC Repository-Native Currentness Validator
SYSTEM_ID=666CLIC
CLASS=PUBLIC_SANITIZED_LOCAL_DEVELOPER_TOOL
CURRENT_AUTHORITY=GITHUB_REPO_CURRENT
SOLE_ACTIVE_WORKING_FIELD=GITHUB_REPOSITORY
DRIVE_ROLE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE
RUNTIME_ACCEPTANCE=NOT_TESTED

The validator checks supplied snapshots only. It does not open a host chat, restore private data, prove P20/P21/Live-Circle, or make Drive current.

Current required carrier order begins with:
1. current/REPO_NATIVE_AUTHORITY_AND_RECOVERY.md
2. AUTHORITY_CONTRACT.md
3. CURRENT_POINTER.json
4. current/CURRENT_STATE.md

Historical Drive REV91 bridge/guard carriers remain at the tail as provenance only.

## Tests
From repository root:
`python3 -m unittest discover -s 666CLIC_NATIVE_RUNTIME/tests -p 'test_*.py' -v`

The repository-native validator currently defines 16 authority/currentness negative and positive cases. The continuity/recovery probe remains a separate synthetic suite. Local fixture execution is evidence only for those files; actual GitHub Actions success requires direct run/job readback.

## Optional Drive backup snapshot
The validator accepts an optional Drive pointer snapshot only to verify that Drive is marked:
- DRIVE_ACTIVE_WORKING_SOURCE=FALSE
- DRIVE_ROLE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE
- CURRENT_REPO=xfraggelpower666x/666CLICPRO

Drive is not required as a normal startup current source.

## Fail-closed
Exit 0 = PASS_STATIC_ONLY.
Exit 2 = CONFLICT_QUARANTINE.
Open functional gates remain OPEN until directly tested.
