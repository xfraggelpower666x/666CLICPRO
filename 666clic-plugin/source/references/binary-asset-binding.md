# 666CLIC binary asset binding
Repository current remains authority even when a live plugin release contains binary assets that the connected GitHub write surface cannot ingest from a local file reference.

TEXT_SOURCE_PARITY requires direct repo/live equality for UTF-8 plugin source files.

For binary assets, VERIFIED_CAUSAL_BINARY_BINDING is allowed only when all of the following are known and fixed:
- exact plugin_id, version and release_id;
- plugin-relative binary path;
- trusted pre-publication source SHA-256 and byte size;
- successful guarded publication from those exact source bytes;
- post-publication live inventory with matching path and byte size;
- publication semantics that preserve omitted binary files on later text-only overlays;
- immutable repository binding metadata recording this evidence.

VERIFIED_CAUSAL_BINARY_BINDING != DIRECT_LIVE_BINARY_HASH_READBACK.
VERIFIED_CAUSAL_BINARY_BINDING != REPO_BINARY_COPY.
Never claim unavailable byte readback.

An immutable hybrid release snapshot may consist of the repo text-source tree plus a binary-asset binding manifest, exact live release tuple and provenance.

PFS backup execution must fetch the exact approved plugin release archive and verify every bound binary asset after extraction:
BACKUP_EXTRACTED_SHA256 == APPROVED_SHA256
BACKUP_EXTRACTED_SIZE == APPROVED_SIZE

Any release/path/hash/size/provenance change invalidates the binding until reverified.
