# CLIC Test Transport — Causal Repair
DATE=2026-10-08
STATUS=PARTIAL_ROOT_CAUSE_ISOLATED
BRANCH=dev/clic-starbridge-junior-20261008-1927
SCOPE=CLIC_MAINLINE_ONLY
PET=EXCLUDED
PRODUCTION_HEAD=e37f60bc47edea9d8ce88b065711c9df0c3d1bd0

## Observed symptoms and evidence
GitHub connector can fetch commits and source files from current CLIC repo. Local shell git remote cannot resolve github.com, so exact repository checkout is unavailable in the execution sandbox. GitHub Actions workflow write was blocked; do not interpret it as CI test failure. Existing local legacy eight-case test directory runs eight tests, but does not prove the full current 58-test suite.
ROOT_CAUSE_CLASS=EXECUTION_TRANSPORT_BLOCKED_NOT_NATIVE_CLIC_RUNTIME_FAILURE
REPAIR_DISPOSITION=PRESERVE_CAPABILITIES_NO_ADDITIONAL_CONTROLLERS
NO_BLIND_REBASE=true
NO_FOREIGN_MUTATIONS=true

## Minimum repair procedure
1. Obtain full current test sources by an approved byte-exact transfer or enable native GitHub CI through authorized workflow surface.
2. Bind source files to immutable commit SHA plus Git blob SHA, compare bytes and count discovered tests.
3. Execute the full unittest suite and capture real runtime log, failures and environment.
4. If tests fail, repair specific behavior minimally with capability/creativity nonregression gate.
5. Validate real StarBridge receiver and native card freshness separately from mocked unit tests.
6. Re-check plugin parity and version-specific backup approval before production pointer-last update.

## Gates
REAL_GITHUB_TEST_CHECKOUT=BLOCKED_DNS
GITHUB_ACTIONS_INSTALL=BLOCKED_TOOL_SAFETY
CURRENT_FULL_SUITE_58=NOT_EXECUTED
PLUGIN_PARITY=OPEN
PRODUCTION_POINTER=UNCHANGED
