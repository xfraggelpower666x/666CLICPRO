# 666CLIC · Current plugin binary transport and recovery decision tree
DATE=2026-10-08
MODE=CLIC_OWNED_RECOVERY_DESIGN_NOT_BACKUP_EXECUTION
EVIDENCE_HEAD=4f3681448a33953126fc45e0731060309e1dbc4b
CURRENT_PLUGIN_ID=plugins_6abfb2e08fdc8191920dcdc4349c69c8
CURRENT_PLUGIN_VERSION=0.1.22
CURRENT_LIVE_RELEASE=pluginrel_6ac6f4e703288191b8757f336d33e186
HISTORICAL_BINDING_RELEASE=pluginrel_6ac6da22f8f4819186d1ad6481f7d27c
PRESERVE_HISTORICAL_PROVENANCE=TRUE
GITHUB_TEXT_PARITY=27_OF_27_PREVIOUS_DIRECT_COMPARISON
CURRENT_BINARY_HASH=UNKNOWN
CURRENT_BINARY_BYTE_BACKUP=NOT_PROVEN
FULL_RUNTIME_PLUGIN_FINGERPRINT=NOT_ESTABLISHED
BACKUP_APPROVAL=WRITE_BLOCKED
PFS_BACKUP_EXECUTION=NOT_AUTHORIZED

## Decision path A: exact current release archive
1. Resolve live plugin tuple directly; reject a changed release identifier and re-audit.
2. Request original release archive through authorized Plugin Creator.
3. If signed URL transport fails, mark TRANSPORT_BLOCKED; URL_ISSUED_NE_BYTES_OBTAINED.
4. If bytes obtained through an authorized path, preserve archive and compute content hashes.
5. Extract assets/clic-logo.png without modifications; compare byte length and SHA-256 to evidence and release binding.
6. Evaluate plugin current, text source tree, binary binding, runtime semantic body head and semantic class.
7. Issue a new CLIC-owned approval only if exact-release evidence and freshness gates pass.
8. PFS native execution is separate; require backup write, independent readback and receipt.

## Decision path B: authorized owner-supplied original archive
1. Accept only provenance-bound, exact-current-release owner-provided bytes.
2. Verify release tuple, archive integrity, text parity and binary hash before treating it as authoritative backup input.
3. Mismatch => CONFLICT_QUARANTINE. Unknown => WRITE_BLOCKED.

## Decision path C: immutable GitHub hybrid snapshot
1. Preserve existing v0.1.22 27 text blobs and immutable provenance.
2. Binary hash/size publication provenance may support VERIFIED_CAUSAL_BINARY_BINDING as policy allows; it does not equal live byte equality.
3. Existing binding names the superseded release; revalidate current exact-release causal publication evidence. Never silently replace historical manifest.
4. Backup executor must hash and read back extracted original binary; no receipt without actual bytes.

## Decision path D: source logo / reconstructed package
1. Source logo hash matching an earlier published source does not prove newest live release binary equality.
2. Reconstructed package is a RECOVERY_CANDIDATE_ONLY, not an exact original release.
3. Validate any restoration against current runtime semantics and native approval. NO_SILENT_ROLLBACK.

## Fail-closed invariant
FOUND_ARCHIVE_URL_NE_ARCHIVE_BYTES
HISTORICAL_HASH_NE_CURRENT_LIVE_HASH
GIT_TEXT_PARITY_NE_FULL_BINARY_PARITY
APPROVAL_NE_BACKUP_WRITE
BACKUP_WRITE_NE_READBACK
READBACK_NE_RESTORE_APPROVAL
PEER_NOTICE_NE_NATIVE_AUTHORITY
CLIC_DECISION_AUTHORITY=CLIC_OWNED_SCOPE_ONLY
FOREIGN_MUTATION=NONE
NEXT=AUTHORIZED_BYTES_OR_REVALIDATED_EXACT_RELEASE_CAUSAL_EVIDENCE_THEN_FULL_FINGERPRINT_AND_CLIC_APPROVAL_REVIEW
