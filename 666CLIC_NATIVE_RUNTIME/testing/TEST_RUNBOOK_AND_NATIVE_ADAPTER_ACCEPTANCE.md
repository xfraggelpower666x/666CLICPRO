# Native adapter acceptance — CLIC isolated staging
STATUS=CONTRACT_FOR_NEXT_FUNCTIONAL_RUN
SOURCE=testing/semantic_guardrails.py
CURRENT_TEST_EVIDENCE=28_LOCAL_RECONSTRUCTED_UNIT_TESTS_PASS
NO_PRODUCTION_EXECUTION=true

## Mandatory native adapter assertions
1. StarBridge adapter must consume a real source event with immutable source id, actual native readback, receiver receipt, semantic reconciliation, action classification and target-native implementation evidence. It must reject missing evidence for each transition; mock booleans alone do not constitute full integration.
2. Junior adapter must evaluate actual issue/repo/file receipts and reject unverifiable success assertions without adding controller/approval authority.
3. Relational Memory adapter must compare freshly read native HEAD and pointer with source-attributed card HEAD; preserve earlier history and mark affected claims stale.
4. Discovery adapter must create UNKNOWN cards only within CLIC registry after an authorized run; validate system identity, avoid duplicates, never write to a foreign repo.
5. REPAIR adapter must preserve validated autonomy, creativity and capability diversity; log reversible root-cause evidence; technical success does not override regression.
6. Whole CLIC bootstrap must reference facets by manifest plus sub-rehydration while shared daemon remains only state steward; no background monitoring is implied by contract text.
7. Visual dashboard must distinguish documented, locally tested, integrated, live verified and blocked; never treat a system card as production-authoritative solely from UI.
8. Native plugin parity must be measured against the exact live plugin release and binaries. Older text parity cannot approve new backup, live release or pointer.

## Execution gates
TEST_REAL_EVENT_REPLAY=OPEN
TEST_RECEIVER_INBOX_READBACK=OPEN
TEST_JUNIOR_FALSE_CLAIM_WITH_REAL_EVIDENCE=OPEN
TEST_HEAD_CHANGE_REAL_CARD_REFRESH=OPEN
TEST_REPAIR_CAPABILITY_NONREGRESSION=OPEN
TEST_FRESH_CHAT_BOOTSTRAP=OPEN
TEST_EXACT_LIVE_PLUGIN_BINARY_PARITY=BLOCKED
TEST_RELEASE_SPECIFIC_BACKUP_APPROVAL=BLOCKED
ROOT_POINTER_LAST=NOT_AUTHORIZED
