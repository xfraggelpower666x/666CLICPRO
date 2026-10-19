# CLIC-native mandatory Force Google Connector Read/Write Gate
STATUS=CLIC_OWNED_SOURCE_IMPLEMENTED_LIVE_CLIC_READ_VERIFIED_WRITE_BLOCKED
MODE=CLIC_ONLY; NO_FOREIGN_MUTATION; NO_NEW_ROUTER
GATE_MODULE=continuity/force-google-connector-gate.mjs
GATE_TESTS=continuity/force-google-connector-gate.test.mjs
CI_WORKFLOW=.github/workflows/clic-force-google-connector-gate.yml
CI_RUN=39336460109
CI_RESULT=PASS_11_OF_11_FIXTURE_ONLY
GITHUB_PRECHANGE_RECOVERY=backup/clic-pre-force-google-connector-gate-20261020
GOOGLE_PROVIDER_REAL_READ=CLIC_OWN_GLOBAL_DEVELOPMENT_REFERENCES_FOLDER_METADATA_AND_CHILDREN
GOOGLE_TEST_TARGET=NOT_AUTHORIZED_OR_VERIFIED_FOR_CLIC_WRITE
WRITE_GATE=WRITE_BLOCKED
HOST_ORIGINAL_EXPORT=NOT_INVOKED
PROVIDER_CAS=NOT_VERIFIED
ROLLBACK_PROVIDER=NOT_TESTED_LIVE
CLIC_CURRENT_AUTHORITY=GITHUB_CURRENT_ONLY

## Mandatory execution
1. Verify active authenticated Google provider handles directly, not from prior conversations, connection status, permission metadata, or fixture assertions.
2. Locate a current CLIC-owned isolated test file with current parent, MIME and provider revision. No foreign document or current pointer may be reused.
3. Force two stable provider reads and compare raw/revision semantics without pretending Google Docs text equals raw JSON bytes.
4. Obtain an independently issued provider authorization bound to exact CLIC test file, folder, MIME, nonce and expected revision. Caller flags or JSON attestations alone cannot authenticate approval.
5. On permitted isolated write: use the provider-supported expected revision guard, direct readback with exact content and new provider revision; fail closed on any mismatch.
6. Restore original contents by version-guarded write, then independent readback and original-content equality. Never silently overwrite a concurrent user change.
7. A fixture-only test proves source behavior, not a live provider write, verified CAS, or a native host execution.
8. Separate READ, WRITE, RECOVERY, HOST, PROJECT_AUTHORITY, DELIVERY, ADOPTION states. Missing independent authorization -> WRITE_BLOCKED, not PASS.
9. Persist only CLIC-owned source artifacts under governed UPDATE with backup, CI, direct GitHub readback and pointer-last.
10. Do not extend this gate to third-party projects without their direct native trigger; maintain Junior, PDI/SB04/SB05 priority and PET pause.

## Impact
PLUGIN_LIVE_RELEASE=UNCHANGED
PLUGIN_IMPACT=CLIC_NATIVE_CONNECTOR_GOVERNANCE_SOURCE_ONLY_CURRENT_LIVE_PLUGIN_HOST_PARITY_UNVERIFIED
VISUAL_IMPACT=EXPOSE_GATE_STATES_SEPARATELY_NO_FAKE_COMPLETION
