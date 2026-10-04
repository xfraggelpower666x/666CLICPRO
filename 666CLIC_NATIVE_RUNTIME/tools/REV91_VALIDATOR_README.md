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
- Baseline fixture suite: nine cases previously executed successfully; three additional negative cases (later REV92, duplicate authority field, duplicate REV91 record) are now staged. A 12-case GitHub Actions run still requires direct job-result readback before declaring CI PASS.
- This README and the accompanying source are staging artifacts; GitHub Readback does not itself execute tests.
- GitHub staging must remain nonauthoritative until separate genuine runtime acceptance and explicit promotion.

## CI execution boundary
A path-scoped GitHub Actions workflow is defined at `.github/workflows/clic-rev91-static.yml` for the staging branch. It runs only synthetic tests under read-only contents permissions, with no Drive access, release, deployment or restore. The presence of that file does NOT prove a workflow run occurred or passed. Inspect actual GitHub Actions job logs before claiming CI success.

## 2026-10-05 syntax-regression recovery
Direct readback of commit abf5a3d66bc8a5ca29aee80f30eeb23598a845d2 exposed a corrupt Python validator: an incomplete regular expression and appended duplicate module body. Treat that revision as BROKEN_SOURCE despite its earlier GitHub blob readback. The source was reconstructed from the last verified pre-hardening Python baseline and the stronger fail-closed checks were reapplied with a single module body and entrypoint.
Fourteen test cases are now defined, including latest revision, duplicate record/field, malformed carrier type, and incomplete marker handling. GitHub file readback is confirmed; PASS_14_OF_14 is NOT claimed without execution evidence from a trusted runner. The previous nine baseline cases were executed before this syntax regression and are not proof for this repaired revision.
If CI logs cannot be retrieved, report CI_RUN_UNVERIFIED, never PASS or FAIL by assumption.
