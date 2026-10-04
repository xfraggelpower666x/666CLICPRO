# REV91 Currentness Validator — offline static preflight
SYSTEM_ID=666CLIC
CLASS=PUBLIC_SANITIZED_LOCAL_DEVELOPER_TOOL
STORAGE_ROLE=GITHUB_STAGING_ONLY
PRODUCT_AUTHORITY=GOOGLE_DRIVE_REV91
RUNTIME_ACCEPTANCE=NOT_TESTED
SECURITY_PRIVATE_RESTORE=NOT_TESTED

This Python 3 tool checks *supplied snapshots* only. It does NOT log into Google Drive,
read live pointers, open a genuine host chat, perform a restore, or prove P20/P21/Live-Circle.
The operator must fetch authenticated current source and exact 12 GitHub carrier paths
independently and confirm provenance before interpreting an offline static PASS.

## Execute local tests
From the repository root:
```
python3 -m unittest discover -s 666CLIC_NATIVE_RUNTIME/tests -p 'test_*.py' -v
```

## Check verified input snapshots
```
python3 666CLIC_NATIVE_RUNTIME/tools/rev91_validator.py \
  --manifest ./REHYDRATION_MANIFEST.json \
  --staging-pointer ./CURRENT_POINTER.json \
  --drive-pointer-snapshot ./CURRENT_POINTER_DRIVE_AUTHENTICATED.txt \
  --carrier-index ./CARRIER_PATHS_FETCHED.json
```
Paths are illustrative input files provided locally by the operator;
do not commit private Drive pointer content or confidential archives to this public repo.
The carrier index is a JSON list of *successfully fetched* relative paths, not a desired-path list.

## Fail-closed interpretation
Exit code 0 = PASS_STATIC_ONLY, NOT runtime verified.
Exit code 2 = CONFLICT_QUARANTINE; review error codes; do not promote historical currentness.
Mandatory gates remain OPEN: incoming real P20, causal P21, three Live-Circle transitions,
private isolated restore, byte-exact integrity and full native semantic coverage.
The validator intentionally preserves historical REV90 evidence, which is NOT active authority.

## Evidence
- Local deterministic fixture suite: nine cases executed successfully on 2026-10-05.
- This README and the accompanying source are staging artifacts; GitHub Readback does not itself execute tests.
- GitHub staging must remain nonauthoritative until separate genuine runtime acceptance and explicit promotion.
