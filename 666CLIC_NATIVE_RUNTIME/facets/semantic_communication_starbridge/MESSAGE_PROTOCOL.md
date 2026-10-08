# StarBridge — Canonical Semantic Event and Receipt Protocol
STATUS=STAGING_IMPLEMENTATION_NOT_PRODUCTIVE
SCHEMA=CLIC_STARBRIDGE_EVENT_V1

## Required event envelope
schema_version, event_id, source_system, source_scope, source_authority_ref, source_head, source_pointer_sha, event_type, created_at_utc, evidence_paths, evidence_hashes, verified_facts, causal_claims, uncertainties, affected_scopes, target_system, intended_action, required_authority, dependency_ids, supersedes_event_ids, confidentiality, delivery_state, receiver_receipt_ref, outcome_evidence_ref, next_recheck_condition.

## Delivery state machine
CREATED -> PUBLISHED -> DELIVERED_VERIFIED -> ACKNOWLEDGED -> SEMANTICALLY_RECONCILED -> ACTION_CLASSIFIED -> IMPLEMENTED_VERIFIED | REJECTED_REASONED | DEFERRED | CONFLICT_QUARANTINE
PUBLISHED_NE_DELIVERED=true
ACKNOWLEDGED_NE_SEMANTICALLY_RECONCILED=true
DELIVERED_REQUIRES_DIRECT_TARGET_READBACK=true
IMPLEMENTED_REQUIRES_TARGET_NATIVE_EVIDENCE=true
IDEMPOTENCY_KEY=source_system|event_id|source_revision
MESSAGE_NE_TRIGGER=true
MESSAGE_NE_WRITE_AUTHORITY=true
PRIVATE_MATERIAL_MUST_NOT_ENTER_PUBLIC_REPO=true
CIRCULAR_ECHO_GUARD=origin_event_id|delivery_chain|hop_limit
RETRY_REQUIRES_SAME_EVENT_ID_AND_FRESH_ATTEMPT_RECEIPT=true
BLOCKED_RECEIPTS_PRESERVE_RETRY_CONTEXT=true
SUPERSEDED_EVENTS_RETAIN_PROVENANCE=true
