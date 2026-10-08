"""Bounded CLIC staging evidence guardrails. Not a production transport."""
from dataclasses import dataclass

def message_state(want, received=False, acknowledged=False, outcome=False):
    stages = ["CREATED","PUBLISHED","DELIVERED_VERIFIED","ACKNOWLEDGED","SEMANTICALLY_RECONCILED","ACTION_CLASSIFIED","IMPLEMENTED_VERIFIED"]
    if want not in stages: raise ValueError("unknown state")
    i=stages.index(want)
    if i>=2 and not received: return "PUBLISHED"
    if i>=3 and not acknowledged: return "DELIVERED_VERIFIED"
    if i==6 and not outcome: return "ACTION_CLASSIFIED"
    return want

def junior_claim(claim, readback=False, functional=False):
    if claim=="IMPLEMENTED" and not (readback and functional): return "UNVERIFIED_CLAIM"
    return "SUPPORTED" if readback else "UNKNOWN"

def card_status(verified_head, current_head):
    if not verified_head or not current_head: return "UNKNOWN"
    return "VERIFIED_AT_HEAD" if verified_head==current_head else "STALE_HEAD_CHANGED"

@dataclass(frozen=True)
class RepairCase:
    cause: bool
    capabilities: bool
    restrictive: bool
    functional: bool

def repair_status(c):
    if not c.cause: return "BLOCK_UNPROVEN_CAUSE"
    if not c.capabilities or c.restrictive: return "BLOCK_CAPABILITY_REGRESSION"
    if not c.functional: return "PENDING_FUNCTIONAL_REAUDIT"
    return "ELIGIBLE_FOR_NATIVE_REVIEW"
