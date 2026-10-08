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
