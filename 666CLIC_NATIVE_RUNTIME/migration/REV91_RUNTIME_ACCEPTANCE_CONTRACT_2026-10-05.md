# 666CLIC REV91 — Runtime Acceptance Contract and Return Anchor
SYSTEM_ID=666CLIC
CLASS=PUBLIC_SANITIZED_CLIC_OWNED_ACCEPTANCE_SPECIFICATION
DATE_LOCAL=2026-10-05
NATIVE_PRODUCT_AUTHORITY=GOOGLE_DRIVE_REV91
NATIVE_POINTER_ID=1y2d-py32XL8S9zJjZXZbNZSiycbbsPDhyGX3lqnqFqA
NATIVE_WORK_ID=1GpABAjo_wwOgIe9z9oj2UvwQ3zCe98n1wpFqpcggjEQ
NATIVE_DEV_CONTROL_ID=1o7VftbTNHFYX5lx0y90cw7NgT5SVNvVVjPOthrb9G3Q
SOURCE_REHYDRATION_MANIFEST=../REHYDRATION_MANIFEST.json
SOURCE_REV91_BRIDGE=../current/REV91_SOURCE_BRIDGE_AND_ACCEPTANCE.md
SOURCE_REV91_GUARD=../current/REV91_SECONDARY_CARRIER_GUARD.md
SOURCE_GATE_AUDIT=REV91_P20_P21_LIVECIRCLE_GATE_AUDIT.md
GITHUB_ROLE=PUBLIC_SANITIZED_NONAUTHORITATIVE_STAGING
STATUS=PARTIAL_SPECIFICATION_NOT_RUNTIME_PROOF
NO_FOREIGN_MUTATION=TRUE
NO_PROMOTION=TRUE
AUTHORITY_SWITCH=FALSE

## Seven-domain expected outcome
SYSTEM=Independent CLIC identity; verified current Drive REV91; never foreign ownership
WORK=Last valid CLIC work package distinguished from source snapshots
TODO=Preserve OPEN|COMPLETED|BLOCKED|PAUSED|WAITING_EXTERNAL without synthetic completion
INTERRUPTIONS=Restore causally valid interruption anchor, reject stale/retired TODO
OBLIGATIONS=Carry P14 event gate, P20 fresh chat, P21 causal, Live-Circle, recovery, privacy
DAEMON=Advisory development companion with no routing or decision authority
CONTINUATION=Choose verified next step, not most recent search result

## Acceptance matrix: use real observations, not source presence
P20_INCOMING_FRESH_CHAT:
  PRECONDITION=Start truly new host chat with direct CLIC trigger and no injected handoff
  TEST=Discover exact Drive current pointer independently, read Work and Dev, consume manifest REV91 required_order
  EXPECT=All seven domains reconstructed with traceable source IDs and correct open obligations
  FAIL=Manual pasted handoff counted as automatic discovery; REV79/80 currentness overrides REV91
  ACTUAL=NOT_RUN
  RESULT=OPEN
P21_FUNCTIONAL_CAUSAL_CONSUMPTION:
  PRECONDITION=Real incoming reconstruction completed
  TEST=Use an open task plus an interruption and an external-system boundary without invented execution
  EXPECT=Correct causal continuation and native ownership; P21 historical A-E remains historic success only
  ACTUAL=NOT_RUN
  RESULT=OPEN
LIVE_CIRCLE_KEEP_ACTIVE:
  TEST=Continue valid current context across real work step and next chat
  EXPECT=Still foregrounded without stale reset
  ACTUAL=NOT_RUN
  RESULT=OPEN
LIVE_CIRCLE_KEEP_REACHABLE:
  TEST=Navigate pointer, Work, TODO, obligations, handoffs and dependent reference sources
  EXPECT=All required valid nodes reachable; private data not mirrored publicly
  ACTUAL=NOT_RUN
  RESULT=OPEN
LIVE_CIRCLE_SUPERSEDE:
  TEST=Present REV79/REV80 historical fields alongside verified Drive REV91
  EXPECT=REV91 wins only for currentness; history preserved unmodified
  ACTUAL=NOT_RUN
  RESULT=OPEN
ISOLATED_RESTORE:
  PRECONDITION=Approved isolated recovery location and controlled private backups
  TEST=Verify byte-level hashes, reconstruction and native boundaries without touching production
  ACTUAL=NOT_RUN
  RESULT=OPEN
SECURITY_PRIVATE_RECOVERY:
  TEST=Inspect repository public exposure, access controls, safe private recovery pointer reachability
  ACTUAL=NOT_RUN
  RESULT=OPEN
P14_EVENT_GATED:
  ACTUAL=EVENT_NOT_PRESENT
  RESULT=OPEN_EVENT_GATED

## Non-runtime structural evidence only
- Current CLIC native Drive pointer and Work/Dev sources directly read at REV91.
- Git staging head and manifest REV91 first two required_order entries directly checked.
- Earlier REV90 and older references remain historical, never effective-current authority.
- This document is a test contract, not evidence that tests ran or full semantic coverage passed.
- PFS/CSM multi-key forensic report remains CLIC-owned evidence only.

## Portable return anchor
CURRENT_STEP=REV91_ACCEPTANCE_CONTRACT_PREPARED_ON_GITHUB_STAGING
COMPLETED=REV91_CURRENTNESS_MANIFEST_GUARD|PFS_CSM_FORENSIC_LEDGER|ACCEPTANCE_TEST_SPECIFICATION
OPEN=P20_REAL_FRESH_CHAT|P21_REAL_CAUSAL|LIVE_CIRCLE_RUNTIME|ISOLATED_RESTORE|PRIVATE_RECOVERY|FULL_SEMANTIC_COVERAGE
NEXT_VALID_ACTION=REAL_FRESH_UI_CHAT_ACCEPTANCE_WITH_INDEPENDENT_SOURCE_DISCOVERY
HANDOFF_STATUS=DOCUMENTED_NOT_EXECUTED
