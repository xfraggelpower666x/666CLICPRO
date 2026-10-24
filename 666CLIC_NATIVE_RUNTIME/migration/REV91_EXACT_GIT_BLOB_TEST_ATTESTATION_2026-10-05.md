# 666CLIC REV91 — Exact Git Blob Local Test Attestation
SYSTEM_ID=666CLIC
DATE_LOCAL=2026-10-05
DOCUMENT_CLASS=PUBLIC_SANITIZED_CLIC_TEST_EVIDENCE
PRODUCT_AUTHORITY=GOOGLE_DRIVE_REV91
STAGING_ONLY=TRUE
PRECHANGE_HEAD=e02bf710649d202ec659820c1cf3cb69fe2a87d8
BACKUP_BRANCH=clic-pre-rev91-exact14-attest-20261005-0140

## Evidence gathered directly
The current GitHub staging branch was read and both files were retrieved by exact path:
- 666CLIC_NATIVE_RUNTIME/tools/rev91_validator.py
- 666CLIC_NATIVE_RUNTIME/tests/test_rev91_validator.py

An independent local Python environment reconstructed their exact retrieved text.
Git-blob SHA-1 was computed as SHA1("blob " + byte_length + NUL + raw_file_bytes).
Both hashes matched the current GitHub blob hashes:
VALIDATOR_BYTES=5035
VALIDATOR_BLOB_SHA1=2e666cfb7d109ed6868309e49c16380aefc0076c
TEST_BYTES=3980
TEST_BLOB_SHA1=7f60fd61d346df891774c94b1817cb694d3f8624
BLOB_EQUIVALENCE=PASS_2_OF_2

Execution:
COMMAND=python -m unittest discover -s 666CLIC_NATIVE_RUNTIME/tests -p test_rev91_validator.py -v
RESULT=Ran_14_tests_OK
EXIT_CODE=0
EXACT_GITHUB_VALIDATOR_AND_TEST_SOURCE_LOCAL_EXECUTION=PASS_14_OF_14

## Validated fixture classes
Valid static historical REV90 plus effective REV91; no CURRENT; stale manifest; reversed required order; missing carrier; unauthorized promotion; historical classification; false runtime PASS; foreign identity; later REV92 record; duplicate Authority field; duplicate REV91 record; malformed carrier type; truncated REV91 record.

## Strict limits of this evidence
GITHUB_ACTIONS_PUSH_RUN_READBACK=UNVERIFIED
GITHUB_ACTIONS_JOB_LOGS=NOT_RETRIEVED
DRIVE_LIVE_RUNTIME_TEST=NOT_EXECUTED
P20_INCOMING_FRESH_HOST_CHAT=OPEN
P21_FUNCTIONAL_CAUSAL_CONSUMPTION=OPEN
LIVE_CIRCLE_KEEP_ACTIVE=OPEN
LIVE_CIRCLE_KEEP_REACHABLE=OPEN
LIVE_CIRCLE_SUPERSEDE=OPEN
PRIVATE_ISOLATED_RESTORE=OPEN
FULL_SEMANTIC_COVERAGE=OPEN
BYTE_EXACT_PRIVATE_BACKUP_RECOVERY=OPEN
SECURITY_REVIEW=OPEN
NO_PRODUCT_AUTHORITY_SWITCH=TRUE
NO_FOREIGN_MUTATION=TRUE
NO_PRODUCTION_PROMOTION=TRUE

The available GitHub fetch_commit_workflow_runs endpoint is filtered to PR-associated runs. Empty results from that endpoint do not prove that push-triggered GitHub Actions ran or did not run. Local test execution does not constitute GitHub CI execution.

## Return anchor
NEXT_REQUIRED=FETCH_ACTUAL_PUSH_CI_RUN_LOGS_IF_SUPPORTED|REAL_P20_NEW_HOST_CHAT|P21_CAUSAL_ACCEPTANCE|LIVE_CIRCLE_TRANSITIONS|ISOLATED_RESTORE|SEMANTIC_COVERAGE
STATUS=EXACT_LOCAL_TEST_PASS_CI_UNVERIFIED_RUNTIME_PARTIAL
