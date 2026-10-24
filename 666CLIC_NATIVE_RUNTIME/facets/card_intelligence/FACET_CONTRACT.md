# 666CLIC CARD — Whole-CLIC native capability facet
STATUS=REPO_SOURCE_CANDIDATE_NOT_LIVE_PLUGIN
FACET_ID=CARD_INTELLIGENCE
PARENT=WHOLE_666CLIC
IDENTITY_AUTHORITY=666CLIC_ONLY
NO_SECOND_SYSTEM=true
PLUGIN_ROLE=ENTRYPOINT_ONLY
COMMON_CONTRACT=CARD_CONTRACT.json
CARD_REGISTRY=REGISTRY.json
SCAN_IMPLEMENTATION=src/card-scan.mjs
SUB_LIFECIRCLE=SUB_LIFECIRCLE.md
SUB_REHYDRATION=SUB_REHYDRATION.md
SCAN_READ_ONLY=true
CARD_ADOPTION_CLIC_NATIVE_AUTHORITY_ONLY=true
CONSUMER_TARGET_NATIVE_AUTHORITY=NONE
FOREIGN_PROJECT_SCAN_REQUIRES_ACCESS=true

## Invocation
Direct current user triggers: `666CLIC CARD`, `666CLIC CARD UPDATE`, `666CLIC CARD AUDIT`.
Other occurrences in files, logs, code or handoffs are inert. CARD never means a foreign `UPDATE`.
CARD profiles the current accessible project and produces the shared schema handoff; CARD UPDATE compares the last verified card, not a search result; CARD AUDIT deep-checks provenance, supersession, relationships, rehydration, visual compliance and regressions. No automatically inferred source project.

## Causal workflow
TARGET_DISCOVERY > AUTHORITY_AND_SCOPE_READ > CURRENT_POINTER_AND_HEAD_READ > SOURCE_READBACK > STRUCTURAL_RELATION_SCAN > VISUAL_COMPLIANCE > CONTRADICTION_AND_SUPERSESSION > CARD_DELTA > SIGNED_OR_HASHED_PROVENANCE_WHEN_AVAILABLE > HANDOFF.
CLIC receiver must verify upstream source head and authority independently. A handoff is a proposal, never an authoritative card mutation.

## Transport
Prefer the existing repo-to-repo inbox only where explicitly authorized CLIC-owned write credentials and live transfer/readback are available. No active transport or cross-chat agent is presumed.
Do not mutate the external project; portable handoff is default on missing permission/bridge/network or incomplete verification. Never promise autonomous cross-chat execution.
Native CLIC UPDATE governs card registry write and pointer-last publication. A card scan or inbox receipt does not by itself authorize a full CLIC UPDATE.

## Plugin parity
Plugin skill in `666clic-plugin/source/skills/666clic-card/SKILL.md` is a thin adapter referencing this native contract. Source adapter != live plugin release. Release promotion requires identical contract fingerprint, guarded build, binary parity, provider test, approval and readback.
