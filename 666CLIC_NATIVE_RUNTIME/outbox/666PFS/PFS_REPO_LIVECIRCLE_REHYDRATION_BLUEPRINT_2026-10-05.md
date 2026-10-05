# 666CLIC → 666PFS Repository Live-Circle & Rehydration Blueprint — 2026-10-05

SYSTEM_ID=666CLIC
TARGET_NATIVE_SYSTEM=666PFS
CLASS=CLIC_RECOMMENDED_ARCHITECTURE_NOT_PFS_AUTHORITY
FOREIGN_MUTATION=false
AUTHORITY_TRANSFER=false
PFS_MUST_TRANSLATE_NATIVELY=true
PFS_MUST_INDEPENDENTLY_VERIFY=true

## Goal
Give 666PFS a repository-native continuity architecture equivalent in quality to the verified CLIC pattern without copying CLIC identity or authority.

## Recommended PFS repository carriers
PFS_NATIVE_RUNTIME/AUTHORITY_CONTRACT.md
PFS_NATIVE_RUNTIME/CURRENT_POINTER.json
PFS_NATIVE_RUNTIME/REHYDRATION_MANIFEST.json
PFS_NATIVE_RUNTIME/current/CURRENT_STATE.md
PFS_NATIVE_RUNTIME/current/OPERATIONS_CENTER.md
PFS_NATIVE_RUNTIME/current/FORENSICS_AND_BOUNDARIES.md
PFS_NATIVE_RUNTIME/continuity/PROVENANCE_SUPERSESSION.md
PFS_NATIVE_RUNTIME/continuity/LIVE_CIRCLE.md
PFS_NATIVE_RUNTIME/continuity/REPO_TO_REPO_HANDOFF_PROTOCOL.md
PFS_NATIVE_RUNTIME/continuity/RECOVERY_AND_HANDOFF.md
PFS_NATIVE_RUNTIME/relations/CROSS_SYSTEM_RELATIONS.md
PFS_NATIVE_RUNTIME/relations/CSM_RELATIONS.md
PFS_NATIVE_RUNTIME/registries/CHILD_IDENTITY_CENSUS.json

## Bootstrap / rehydration order
1 VERIFY_GITHUB_HEAD_AND_CURRENT_POINTER
2 VERIFY_AUTHORITY_CONTRACT
3 READ_REHYDRATION_MANIFEST
4 FOLLOW_REQUIRED_ORDER_COMPLETELY
5 LOAD_CURRENT_STATE
6 LOAD_FORENSICS_AND_BOUNDARIES
7 LOAD_PROVENANCE_SUPERSESSION
8 LOAD_LIVE_CIRCLE
9 LOAD_OPERATIONS_CENTER
10 LOAD_CSM_AND_CHILD_RELATIONS
11 LOAD_RECOVERY_AND_HANDOFF
12 LOAD_EXTERNAL_RELATIONS
13 LOAD_HISTORICAL_PROVENANCE_ONLY_AFTER_CURRENT_IS_RESOLVED

FOUND_NE_VERIFIED=true
SEARCH_RESULT_NE_READBACK=true
READ_NE_REHYDRATED=true
LATEST_SEARCH_HIT_NE_CURRENT_STATE=true
NEWER_VALID_EVOLUTION_GT_OLDER_VALID_STATE=true
NO_SILENT_ROLLBACK=true
NO_BLIND_REBASE=true

## Pointer and manifest contract
CURRENT_POINTER must identify exact current repo, branch, body HEAD before pointer, current runtime state, gates, return anchor and pointer-last status.
REHYDRATION_MANIFEST must define required_order, current authority, effective current gates, historical fields that are provenance only, recovery references and conflict rules.
POINTER_WRITE_ORDER=PRECHANGE_BACKUP>BODY_WRITES>DIRECT_READBACK>POINTER_LAST
NO_MUTATION_AFTER_POINTER=true
ON_POINTER_OR_MANIFEST_CONFLICT=CONFLICT_QUARANTINE

## Live-Circle model
TEMPORAL_LAYERS=PRESENT_CURRENT|NEAR_ACTIVE_PAST|DEEP_HISTORICAL_PAST
PRESENT_CURRENT=verified PFS native state + current work + open native gates
NEAR_ACTIVE_PAST=recent checkpoints|handoffs|supersession|unfinished obligations|return anchors
DEEP_HISTORICAL_PAST=Drive history|backups|superseded states|retired child identities

LIVE_STATES=KEEP_ACTIVE|KEEP_REACHABLE|ARCHIVE|SUPERSEDE|REJECT_WITH_PROVENANCE|REACTIVATE_WHEN_CAUSALLY_RELEVANT
CONTEXT_RELEASE_NE_FORGETTING=true
FOREGROUND_SELECTION=CAUSAL_RELEVANCE|CURRENT_MEANING|WORK_SCOPE
NO_BACKGROUND_EXECUTION=true
NO_NEW_ROUTER=true
NO_FOREIGN_AUTOACTIVATION=true

## Work continuity
OPERATIONS_CENTER should persist:
CURRENT_WORK
COMPLETED
OPEN
INTERRUPTIONS
OBLIGATIONS
RETURN_ANCHOR
NEXT_MEANINGFUL_STEP
BLOCKERS
EXTERNAL_WAITING_STATES

If user supplies new information during active work:
ABSORB_NEW_INFORMATION=true
PROCESS_CAUSALLY_RELATED_EFFECTS=true
PRESERVE_INTERRUPTED_RETURN_ANCHOR=true
RESUME_INTERRUPTED_WORK=true
NO_UNNECESSARY_RESTART=true

## PFS-specific identity and CSM safeguards
PFS_NE_CSM=true
CSM_NE_CHILD=true
RELATION_NE_IDENTITY=true
SHARED_MANAGEMENT_NE_SHARED_AUTHORITY=true
CHILD_AUTOLOAD_DEFAULT=FORBIDDEN
RENAMED_IDENTITY=REBIND_EXISTING_NO_DUPLICATE
AMBIGUOUS_IDENTITY=HOLD_AND_AUDIT
RETIRED_IDENTITY=DO_NOT_RESURRECT
EXTERNAL_NATIVE_CHILD_OR_SERVICE=REFERENCE_WITHOUT_AUTHORITY_TRANSFER
NEWER_VALID_SUPERSESSION_GT_OLDER_TEXTUAL_STATUS=true

## Fresh-chat acceptance equivalent to CLIC P20
A handoff creation alone MUST NOT pass fresh-chat acceptance.
PASS requires a truly fresh host chat where:
1 native trigger 666PFS SYSTEMSTART is issued,
2 repo HEAD and CURRENT_POINTER are independently found,
3 manifest required_order is followed,
4 current state/relations/work/return anchor are reconstructed without manual injection,
5 Drive history does not override newer repo current,
6 no child or foreign native system is autoloaded,
7 resulting PFS identity and open work match repository current.

PFS_FRESH_CHAT_ACCEPTANCE=PASS_ONLY_AFTER_ACTUAL_FRESH_CHAT_RUNTIME

## Causal continuation equivalent to CLIC P21
PASS requires an actual interruption during open PFS work where:
1 interruption is absorbed,
2 new information is processed,
3 prior open work remains reachable,
4 obligations are preserved,
5 return anchor survives,
6 work resumes correctly,
7 no foreign authority is invented.

## Live-Circle acceptance
PASS requires observed runtime evidence for:
KEEP_ACTIVE
KEEP_REACHABLE
SUPERSEDE_WITHOUT_ROLLBACK
REACTIVATE_WHEN_CAUSALLY_RELEVANT
REPO_HANDOFF_CONTINUITY

Static documents alone are not runtime acceptance.

## Recovery
Drive may remain HISTORY|BACKUP|RECOVERY|PROVENANCE after native PFS repo promotion.
A private owner-only recovery carrier should reference exact repo/body state without publishing private IDs into public Git history.
Recommended isolated restore test:
- select exact PFS-owned runtime tree scope
- preserve foreign/native boundary payloads separately
- store reconstructable byte-exact payload privately
- read it back
- verify every restored Git blob/hash/path/mode
- only then claim restore PASS

## Promotion rule
PFS_GITHUB_AUTHORITY_SWITCH must be a native 666PFS decision after:
FRESH_CHAT_REHYDRATION=PASS
CSM_RELATION_RESOLUTION=PASS
PRIVATE_PUBLIC_SECURITY=PASS
ISOLATED_RESTORE=PASS
CURRENT_NATIVE_SEMANTIC_COVERAGE=PASS
POINTER_LAST_READBACK=PASS

Until then:
DRIVE_NATIVE_AUTHORITY_REMAINS=true
GITHUB_ROLE=STAGING_OR_MIGRATION_TARGET

## Recommended native triggers
666PFS SYSTEMSTART -> rehydrate PFS from native current source according to current authority
666PFS UPDATE -> governed PFS-owned writes and migration
No CLIC trigger may perform PFS mutation.

## Source pattern provenance
This blueprint is derived from verified CLIC repository-native behavior:
- automatic fresh-chat repo rehydration
- Keep Active / Keep Reachable / Supersede Live-Circle
- interruption-aware causal continuation
- owner-only recovery
- byte-exact core restore
- pointer-last governance

PFS must preserve its own identity, CSM model, child registry semantics and native authority when adapting the pattern.
