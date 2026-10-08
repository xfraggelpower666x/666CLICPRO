"""CLIC staging evidence adapter; no foreign operations."""
def receipt_stage(proof):
    if not all(proof.get(k) for k in ("source", "head", "pointer")):
        return "CONFLICT_QUARANTINE"
    for key, prior in (
        ("receiver_readback", "PUBLISHED"),
        ("acknowledgement", "DELIVERED_VERIFIED"),
        ("semantic_evidence", "ACKNOWLEDGED"),
        ("action_evidence", "SEMANTICALLY_RECONCILED"),
        ("implementation_evidence", "ACTION_CLASSIFIED"),
    ):
        if not proof.get(key):
            return prior
    return "IMPLEMENTED_VERIFIED"

def card_currentness(old_head, new_head, evidence_ref):
    if not new_head or not evidence_ref:
        return "PENDING_NATIVE_READ"
    return "VERIFIED_AT_HEAD" if old_head == new_head else "STALE_HEAD_CHANGED"

def junior_review_implementation(proof):
    """Receipt and outcome must form a complete evidence chain."""
    return "SUPPORTED" if receipt_stage(proof) == "IMPLEMENTED_VERIFIED" else "UNVERIFIED_CLAIM"

def reconcile_card(card, observed_head, evidence_ref):
    """Return a new card; never erase provenance or previous state."""
    updated = dict(card)
    updated["currentness"] = card_currentness(card.get("verified_head"), observed_head, evidence_ref)
    if updated["currentness"] == "STALE_HEAD_CHANGED":
        updated["pending_head"] = observed_head
    return updated

def discovery_candidate(identity, authority, source_ref):
    """New system stays unknown until native readback; CLIC-owned only."""
    if not identity or not authority or not source_ref:
        return {"status": "BLOCKED_UNVERIFIED_IDENTITY"}
    return {"identity": identity, "authority": authority, "source_ref": source_ref,
            "currentness": "UNKNOWN", "visual_compliance": "UNKNOWN"}

def repair_assessment(cause_proven, valid_capabilities_preserved, proportional, functional_pass):
    if not cause_proven:
        return "BLOCK_UNPROVEN_CAUSE"
    if not valid_capabilities_preserved or not proportional:
        return "BLOCK_CAPABILITY_REGRESSION"
    if not functional_pass:
        return "PENDING_FUNCTIONAL_REAUDIT"
    return "ELIGIBLE_FOR_NATIVE_REVIEW"
