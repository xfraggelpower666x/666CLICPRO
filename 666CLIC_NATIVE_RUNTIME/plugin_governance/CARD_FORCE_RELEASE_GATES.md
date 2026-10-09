# CLIC CARD/FORCE controlled plugin release gates
STATUS=WRITE_BLOCKED_PENDING_BINARY_AND_HOST_READBACK
PROVIDER_PLUGIN=plugins_6abfb2e08fdc8191920dcdc4349c69c8
LIVE_RELEASE=pluginrel_6ac6f4e703288191b8757f336d33e186
LIVE_VERSION=0.1.22
SOURCE_AHEAD=true
SOURCE_PARITY_BASELINE=26_OF_27_MATCH_SOURCE_README_AHEAD
CANDIDATE_SOURCE=666clic-plugin/source/skills/666clic-card/SKILL.md|666clic-plugin/source/skills/666clic-force/SKILL.md
ARCHIVE_FETCH=SIGNED_URL_OBTAINED_DOWNLOAD_FAILED
LOGO_PROVIDER_SIZE=2929725
LOGO_SOURCE_EXPECTED_SHA256=f2f3897727b62aa22f9d99d2cb8dca2920b7ca26829c902d45795822edbb0b7d
LOGO_ACTUAL_SHA256=NOT_VERIFIED
MISSING_BINARY_CANNOT_BE_WAIVED=true
RELEASE_ALLOWED=false

## Release sequence after all proof gates
1. Obtain byte-complete immutable current Plugin Creator release archive and store secured backup. Hash full archive and extracted assets/clic-logo.png; compare actual binary length/hash to the approved source expectation; classify any mismatch CONFLICT_QUARANTINE.
2. Pin exact provider live release ID; inspect all live text and binary files and their actual byte inventory.
3. Build guarded next plugin candidate by overlaying changed plugin-root text files (CARD/FORCE skills, references, README, manifests). Omitted binary assets must be preserved by the provider. Validate plugin schema and both V1/V2 manifests before write.
4. Confirm canonical native facet and plugin adapter share schema/semantics. CI verifies fixtures. Confirm user has authorized this native release and plugin editor rights; update with expected release ID.
5. Provider readback: inspect new exact release ID, manifests, both skills, logo file presence/byte count and full text parity. If an independent post-release asset hash is unavailable, retain causal-binding only with verifiable proven source bytes and unaltered-overlay contract; never invent direct hash.
6. Test CARD and FORCE commands in an actual fresh host context, including foreign read-only project scope, portable fallback, malicious handoff and conflict tests, and native return anchor.
7. Record release evidence and guarded backup approval; update CLIC repo pointers only after verified body readback, Current pointer last.
PLUGIN_HOST_TRIGGER_SOURCE_FILE_NE_FUNCTIONAL_ACCEPTANCE=true
CI_PASS_NE_PLUGIN_PUBLICATION=true
PLUGIN_SOURCE_NE_LIVE_CURRENT=true
NO_FOREIGN_MUTATION=true

## Two-stage host gate clarification
PREPUBLISH requires a verified archive backup, source/logo hash evidence, manifest validity, pinned active release and host compatibility preflight.
POSTPUBLISH requires new exact release readback and real host CARD/FORCE acceptance. Actual post-release host acceptance is not falsely required before publication; failure at that stage mandates HOLD/rollback governance, not a success claim.
CURRENT_GATE=PREPUBLISH_WRITE_BLOCKED_MISSING_BINARY_BYTES
