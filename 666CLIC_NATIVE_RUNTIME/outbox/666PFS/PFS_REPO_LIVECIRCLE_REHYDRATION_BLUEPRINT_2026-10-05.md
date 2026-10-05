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

Target architecture after native PFS promotion:
PFS_SOLE_ACTIVE_WORKING_FIELD=GITHUB_REPOSITORY
PFS_CURRENT_PRODUCT_AUTHORITY=GITHUB_REPO_CURRENT
PFS_REPO_FIRST=true
PFS_DRIVE_CURRENT_AUTHORITY=false
PFS_DRIVE_ACTIVE_WORKING_SOURCE=false
PFS_DRIVE_ROLE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE
PFS_DRIVE_MUST_NOT_OVERRIDE_NEWER_REPO_CURRENT=true
PFS_CSM_RELATIONS_CURRENT_SOURCE=GITHUB_REPO_CURRENT
PFS_CHILD_IDENTITY_CURRENT_SOURCE=GITHUB_REPO_CURRENT

Until native PFS promotion is actually verified:
DRIVE_NATIVE_AUTHORITY_REMAINS=true
GITHUB_ROLE=STAGING_OR_MIGRATION_TARGET
AUTHORITY_SWITCH_MUST_BE_NATIVE_PFS_DECISION=true

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

PFS_REPO_FIRST_TARGET_MODEL=REQUIRED
PFS_DRIVE_POST_PROMOTION_ROLE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE
PFS_DRIVE_NE_CURRENT_AFTER_VERIFIED_PROMOTION=true


## Hard child migration promotion gate
ALL_VALID_CURRENT_CHILD_IDENTITIES_MIGRATED_TO_REPO=REQUIRED_BEFORE_AUTHORITY_SWITCH
ALL_CURRENT_CSM_RELATIONS_MIGRATED_TO_REPO=REQUIRED_BEFORE_AUTHORITY_SWITCH
ALL_CURRENT_CHILD_POINTER_AND_ROLE_METADATA_REPRESENTED=REQUIRED_BEFORE_AUTHORITY_SWITCH
CHILD_MIGRATION_SET_SOURCE=NATIVE_PFS_CURRENT_AT_EXECUTION_TIME
HISTORICAL_CLIC_CENSUS_COUNT_NE_FINAL_REQUIRED_COUNT=true
NO_FIXED_CHILD_COUNT_HARDCODE=true

PASS requires:
- native PFS recomputes the current valid child identity set at migration time
- every valid active/current child identity is represented in GitHub current
- renamed/rebound identities are represented once with supersession provenance
- retired identities remain historical and non-loadable
- backup-only identities remain backup/recovery role only
- external native systems remain references without authority transfer
- every current CSM parent/child/relation needed for rehydration is represented
- ambiguous or unresolved identities block promotion with HOLD_AND_AUDIT
- direct repo readback proves no current valid child identity is missing

AUTHORITY_PROMOTION_IF_CHILD_MIGRATION_INCOMPLETE=FORBIDDEN
MISSING_CURRENT_CHILD_ACTION=BLOCK_PROMOTION
DUPLICATE_IDENTITY_ACTION=BLOCK_PROMOTION_AND_RECONCILE
STALE_RETIRED_REACTIVATION_ACTION=BLOCK_PROMOTION


## External consumer cutover
PFS_EXTERNAL_CONSUMER_CENSUS=REQUIRED_AT_EXECUTION_TIME
PFS_EXTERNAL_CONSUMER_REPO_CUTOVER=REQUIRED
PFS_EXTERNAL_CONSUMER_SET_SOURCE=LIVE_DEPENDENCY_CENSUS_AT_EXECUTION_TIME
NO_FIXED_EXTERNAL_CONSUMER_LIST_HARDCODE=true

After verified native PFS repo authority promotion:
EXTERNAL_PFS_CSM_CURRENT_ROUTE=GITHUB_REPO_CURRENT
EXTERNAL_PFS_CSM_DRIVE_CURRENT_ROUTE=FORBIDDEN
DRIVE_ALLOWED_EXTERNAL_USE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE

For every external system/service that currently reads, imports, references or rehydrates PFS/CSM:
- discover dependency and exact consumed carrier
- publish a PFS-owned sanitized cutover contract/return-handoff
- require the external system's own native update/trigger to change its route
- verify the external system now resolves PFS/CSM currentness from GitHub
- verify it does not silently fall back to Drive-current
- preserve Drive references only as history/backup/recovery/provenance
- record VERIFIED_NO_CURRENT_DEPENDENCY when a suspected consumer does not actually depend on current PFS/CSM

PFS_MAY_NOT_MUTATE_FOREIGN_SYSTEM_WITHOUT_NATIVE_TRIGGER=true
EXTERNAL_CONSUMER_CUTOVER_NE_AUTHORITY_TRANSFER=true
MIGRATION_CLOSEOUT_IF_UNMIGRATED_CURRENT_EXTERNAL_CONSUMER=FORBIDDEN


## Two-phase external consumer cutover
Purpose: prevent a broken-consumer window during the PFS Drive->Repo authority switch.

PHASE_1_PRE_SWITCH=REQUIRED
PHASE_1_ACTIONS=DISCOVER_CONSUMERS|CLASSIFY_CONSUMED_CARRIERS|PUBLISH_REPO_ROUTE_CONTRACT|PREPARE_NATIVE_HANDOFFS|VERIFY_REPO_READINESS
PHASE_1_DRIVE_CURRENT_REMAINS_AVAILABLE_UNTIL_NATIVE_PFS_SWITCH=true
PHASE_1_FOREIGN_MUTATION=false

PHASE_2_POST_SWITCH=REQUIRED
PHASE_2_ACTIONS=NATIVE_PFS_AUTHORITY_SWITCH|NATIVE_CONSUMER_ROUTE_UPDATES|VERIFY_REPO_CURRENT|VERIFY_NO_DRIVE_CURRENT_FALLBACK|DOWNGRADE_DRIVE_ROLE
PHASE_2_EXTERNAL_NATIVE_TRIGGER_REQUIRED=true

ZERO_BLIND_WINDOW_REQUIRED=true
MIGRATION_CLOSEOUT_IF_CONSUMER_CUTOVER_INCOMPLETE=FORBIDDEN
MIGRATION_CLOSEOUT_PASS_CONDITION=ALL_DISCOVERED_CURRENT_CONSUMERS_REPO_CURRENT_OR_VERIFIED_NO_CURRENT_DEPENDENCY


## Cutover state machine and failback
CUTOVER_STATES=PREPARED|SWITCHED|VERIFIED|FAILBACK_REQUIRED|QUARANTINED
INITIAL_STATE=PREPARED

PREPARED_REQUIRES=FULL_VALID_CURRENT_CHILD_SET_MIGRATED|FULL_REQUIRED_CSM_RELATIONS_MIGRATED|EXTERNAL_CONSUMER_CENSUS_COMPLETE|EXTERNAL_CONSUMER_REPO_READINESS_COMPLETE|PRIVATE_RECOVERY_VERIFIED|FRESH_CHAT_REHYDRATION_VERIFIED|POINTER_MANIFEST_READY
SWITCHED_REQUIRES=NATIVE_666PFS_UPDATE_AUTHORITY_SWITCH
VERIFIED_REQUIRES=PFS_REPO_CURRENT_READBACK_PASS|ALL_CURRENT_CONSUMERS_REPO_CURRENT_OR_VERIFIED_NO_CURRENT_DEPENDENCY|NO_SILENT_DRIVE_CURRENT_FALLBACK|DRIVE_ROLE_HISTORY_BACKUP_RECOVERY_PROVENANCE_ONLY

If any current external consumer fails after SWITCHED:
CUTOVER_STATE=FAILBACK_REQUIRED_OR_QUARANTINED
MIGRATION_COMPLETE=false
POINTER_MUST_NOT_CLAIM_VERIFIED=true
FAILED_CONSUMER_EVIDENCE_MUST_BE_PRESERVED=true
LAST_VERIFIED_RECOVERY_ANCHOR_MUST_BE_USED=true
SERVICE_CONTINUITY_RESTORE_MUST_BE_MINIMAL=true
RETRY_REQUIRES_CORRECT_NATIVE_CONSUMER_TRIGGER=true
REVERIFY_BEFORE_PROMOTION=true

After VERIFIED:
SILENT_DRIVE_REPROMOTION=FORBIDDEN
DRIVE_CURRENT_REPROMOTION_REQUIRES_NEW_NATIVE_PFS_DECISION_AND_NEW_EVIDENCE=true
