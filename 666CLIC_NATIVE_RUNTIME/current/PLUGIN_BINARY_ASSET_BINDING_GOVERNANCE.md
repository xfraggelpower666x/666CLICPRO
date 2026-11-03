# 666CLIC Plugin Binary Asset Binding Governance

STATUS=CURRENT_PRODUCTIVE
DATE_LOCAL=2026-10-07

## Purpose
Repository current remains CLIC authority even when a plugin release contains binary assets that the connected GitHub write surface cannot ingest from a local file reference.

REPO_CURRENT_REMAINS_AUTHORITY=true
PLUGIN_NE_AUTHORITY=true
NO_FAKE_BYTE_PARITY=true
NO_BINARY_TEXT_SUBSTITUTION=true

## Hybrid parity model
TEXT_SOURCE_PARITY requires direct repo/live equality for every UTF-8 plugin source file.
BINARY_ASSET_BINDING requires:
1. exact plugin_id + version + release_id;
2. plugin-relative binary path;
3. trusted source bytes hash before publication;
4. trusted source byte size before publication;
5. successful guarded plugin publication from those source bytes;
6. post-publication live inventory showing the same path and byte size;
7. publication contract proving omitted binary files remain unchanged for later text-only overlays;
8. immutable repo binding carrier recording all above evidence.

DIRECT_LIVE_BINARY_HASH_READBACK > CAUSAL_BINARY_BINDING.
When direct live binary hash readback is unavailable, VERIFIED_CAUSAL_BINARY_BINDING is allowed only if all eight conditions pass.

VERIFIED_CAUSAL_BINARY_BINDING_NE_DIRECT_LIVE_HASH_READBACK=true
VERIFIED_CAUSAL_BINARY_BINDING_NE_REPO_BINARY_COPY=true

## Immutable hybrid release snapshot
IMMUTABLE_HYBRID_RELEASE_SNAPSHOT=
REPO_TEXT_SOURCE_TREE |
BINARY_ASSET_BINDING_MANIFEST |
EXACT_LIVE_RELEASE_TUPLE |
PROVENANCE

The repository snapshot does not pretend to contain unavailable binary bytes.
The binary transport source is the exact immutable plugin release archive identified by release_id.

## Backup execution contract
PFS may execute a CLIC plugin backup only after fresh CLIC approval.
PFS must obtain the exact approved plugin release archive, store it in its authorized backup location, hash the backup archive and extracted bound binary assets, and return readback evidence.
For each bound binary asset:
BACKUP_EXTRACTED_SHA256_MUST_EQUAL_APPROVED_SHA256=true
BACKUP_EXTRACTED_SIZE_MUST_EQUAL_APPROVED_SIZE=true

APPROVAL_NE_BACKUP_WRITE=true
BACKUP_WRITE_NE_READBACK=true
READBACK_NE_RECEIPT=true

## Current bound asset
PLUGIN_ID=plugins_6abfb2e08fdc8191920dcdc4349c69c8
PLUGIN_VERSION_SOURCE=0.1.12
PLUGIN_RELEASE_SOURCE=pluginrel_6ac6988775bc8191b6742f4f873c8967
ASSET_PATH=assets/clic-logo.png
ASSET_SHA256=f2f3897727b62aa22f9d99d2cb8dca2920b7ca26829c902d45795822edbb0b7d
ASSET_SIZE_BYTES=2929725
SOURCE_UPLOAD=EXACT_USER_DESIGNATED_OFFICIAL_LOGO
POST_PUBLICATION_LIVE_SIZE=2929725
CAUSAL_BINDING=VERIFIED

## Safety
Any release change, path change, source hash change, size change, delete/replacement, or uncertain publication provenance invalidates the binding and requires re-verification.
