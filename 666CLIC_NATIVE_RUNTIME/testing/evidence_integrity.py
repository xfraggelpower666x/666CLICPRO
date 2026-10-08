"""Strict staging validator for source-attributed receipts, not a connector or authority."""
import re

_SHA = re.compile(r"^[0-9a-f]{40}$")
_REQUIRED = ("source_system", "source_head", "source_pointer", "receiver_system",
             "receiver_head", "receiver_receipt_path", "receipt_blob_sha")

def verify_receipt_shape(receipt, trusted_readback=None):
    """A well-shaped receipt is NOT proof unless independently read back by its native owner."""
    if not isinstance(receipt, dict) or any(not receipt.get(k) for k in _REQUIRED):
        return "MISSING_EVIDENCE"
    if not _SHA.fullmatch(str(receipt["source_head"])) or not _SHA.fullmatch(str(receipt["receiver_head"])):
        return "INVALID_HEAD"
    if not _SHA.fullmatch(str(receipt["receipt_blob_sha"])):
        return "INVALID_BLOB"
    if not isinstance(trusted_readback, dict):
        return "READBACK_PENDING"
    if not trusted_readback.get("connector_verified"):
        return "READBACK_PENDING"
    if trusted_readback.get("receiver_system") != receipt["receiver_system"]:
        return "CONFLICT_QUARANTINE"
    if trusted_readback.get("receiver_head") != receipt["receiver_head"]:
        return "STALE_RECEIVER_HEAD"
    if trusted_readback.get("receipt_blob_sha") != receipt["receipt_blob_sha"]:
        return "CONFLICT_QUARANTINE"
    if trusted_readback.get("receipt_path") != receipt["receiver_receipt_path"]:
        return "CONFLICT_QUARANTINE"
    return "RECEIPT_SHAPE_AND_READBACK_MATCH"

def junior_delivery_gate(receipt, trusted_readback=None):
    return ("ELIGIBLE_FOR_NATIVE_SEMANTIC_REVIEW"
            if verify_receipt_shape(receipt, trusted_readback) == "RECEIPT_SHAPE_AND_READBACK_MATCH"
            else "UNVERIFIED_DELIVERY")

def verify_host_attestation(receipt, attestation, expected_receiver, expected_repo):
    """A host attestation is accepted only after caller independently validates connector origin.
    A plain dict cannot establish authenticity; the host is responsible for binding it.
    """
    if not isinstance(attestation, dict) or not isinstance(receipt, dict):
        return "HOST_ATTESTATION_PENDING"
    if not attestation.get("host_origin_verified"):
        return "HOST_ATTESTATION_PENDING"
    if not attestation.get("connector_response_bound"):
        return "HOST_ATTESTATION_PENDING"
    if attestation.get("repository") != expected_repo:
        return "REPOSITORY_CONFLICT"
    if attestation.get("receiver_system") != expected_receiver:
        return "RECEIVER_CONFLICT"
    if receipt.get("receiver_system") != expected_receiver:
        return "RECEIVER_CONFLICT"
    if attestation.get("receipt_blob_sha") != receipt.get("receipt_blob_sha"):
        return "BLOB_CONFLICT"
    if attestation.get("receipt_path") != receipt.get("receiver_receipt_path"):
        return "PATH_CONFLICT"
    return "HOST_ATTESTATION_FIELDS_MATCH_NOT_AUTHENTICITY_PROOF"
