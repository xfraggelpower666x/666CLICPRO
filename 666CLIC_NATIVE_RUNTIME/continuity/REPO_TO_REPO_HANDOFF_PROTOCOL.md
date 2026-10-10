# 666CLIC Repository-to-Repository Handoff Protocol

STATUS=CLIC_SIDE_IMPLEMENTED_EXTERNAL_PRODUCER_OPEN
DATE=2026-10-05
AUTHORITY=GITHUB_REPO_CURRENT

## Purpose
Provide a repository-native, authority-preserving exchange boundary between 666CLIC and external native systems without using Google Drive as a message bus.

## CLIC boundary
- CLIC inbox: `666CLIC_NATIVE_RUNTIME/inbox/<SYSTEM>/CURRENT.json`
- CLIC receipts: `666CLIC_NATIVE_RUNTIME/inbox/<SYSTEM>/receipts/<HANDOFF_ID>.json`
- CLIC outbox: `666CLIC_NATIVE_RUNTIME/outbox/<SYSTEM>/<HANDOFF_ID>.json`
- Processing state records the last verified handoff id and source HEAD.
- A handoff is external analysis input only. It never transfers decision authority.
- Source repository HEAD must be independently verified before a handoff may be accepted.
- Duplicate handoff ids are idempotent and must not be re-applied.
- Invalid source HEAD, conflicting supersession, or authority claims enter CONFLICT_QUARANTINE.
- After processing, CLIC returns to the interrupted native CLIC work anchor unless causally superseded.

## LYVRA relation
Expected producer path (proposal for LYVRA's own native authority to implement):
`LYVRA_NATIVE_RUNTIME/handoffs/666CLIC/CURRENT.json`

CLIC does not create or mutate that LYVRA path under a CLIC trigger.

Expected CLIC consumer path:
`666CLIC_NATIVE_RUNTIME/inbox/LYVRA/CURRENT.json`

Expected CLIC return path:
`666CLIC_NATIVE_RUNTIME/outbox/LYVRA/<HANDOFF_ID>.json`

Only LYVRA decides whether to consume a CLIC return handoff.

## Drive
DRIVE_ACTIVE_MESSAGE_BUS=false
DRIVE_ROLE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE
Drive historical handoffs remain provenance and must not override newer verified repository handoffs.

## Acceptance
Protocol placement != functional Live-Circle acceptance.
P20_FRESH_CHAT=VERIFIED_FRESH_CHAT_REHYDRATION_2026-10-05
P21_FUNCTIONAL_CAUSAL_ACCEPTANCE=VERIFIED_2026-10-05
LIVE_CIRCLE_RUNTIME=VERIFIED_KEEP_ACTIVE_KEEP_REACHABLE_SUPERSEDE_AND_REPO_HANDOFF
ISOLATED_PRIVATE_RESTORE=VERIFIED_CLIC_CORE_54_OF_54_TRANSPORT_PAYLOADS_EXCLUDED_BY_AUTHORITY_BOUNDARY
FULL_NATIVE_SEMANTIC_COVERAGE=OPEN_INDEPENDENT_OF_TRANSPORT_RESTORE

TRANSPORT_BOUNDARY_RESTORE_DECISION=EXCLUDED_FROM_CLIC_CORE_PRIVATE_RESTORE_BY_AUTHORITY_BOUNDARY
TRANSPORT_BOUNDARY_EVIDENCE=migration/TRANSPORT_BOUNDARY_RESTORE_DECISION_2026-10-05.md

## 2026-10-10 · Fixed CLIC ↔ LYVRA development channel (CLIC-owned proposal)
CHANNEL_SCHEMA=CLIC_LYVRA_PEER_CHANNEL_V1
CHANNEL_MODULE=continuity/repo-peer-channel.mjs
TRANSPORT=GITHUB_REPOSITORY_FILE_REFERENCE
CLIC_OUTBOX=666CLIC_NATIVE_RUNTIME/outbox/LYVRA/<HANDOFF_ID>.json
LYVRA_NATIVE_CONSUMER_PROPOSED=LYVRA_NATIVE_RUNTIME/handoffs/666CLIC/
LYVRA_RETURN_OUTBOX_EXISTING=LYVRA_NATIVE_RUNTIME/continuity/development_exchange/
CLIC_RETURN_INBOX=666CLIC_NATIVE_RUNTIME/inbox/LYVRA/
CLIC_RECEIPTS=666CLIC_NATIVE_RUNTIME/inbox/LYVRA/receipts/<HANDOFF_ID>.json

Every envelope requires a stable handoff_id, source head SHA, repository-relative source_path, source and target identities, stage, and optional recipient receipt. Duplicate IDs are idempotent; a conflicting ID+source SHA is CONFLICT_QUARANTINE, not an overwrite.
The receiver resolves the source repository at its recorded current, verifies source file and commit, and makes its own native decision. No automatic cross-repo mutation, no cross-system merge. The sender reads the receiver's native receipt from its actual repository and verifies handoff_id, source_path, recipient HEAD and receipt ID before advancing PREPARED to DELIVERED; source-outbox write, URL reachability, or proposal existence is NOT delivery.
For an adoption claim, a separate native readback and authority proof are required. Rejection is an explicit native response and must not be coerced into adoption. Only an actual target-host readback may close HOST_VERIFIED.
Receiver path is currently proposed and not confirmed installed. CLIC-side channel contract is implemented; END_TO_END_DELIVERY=NOT_VERIFIED. The CLIC LiveCircle must keep pending notices reachable, inspect receipts when native execution is invoked, and return to prior verified work without background promises. LYVRA selects its native colors/design and retains sole decision authority.
PET=PAUSED; NO_NEW_ROUTER=true; NO_FOREIGN_AUTOACTIVATION=true.
