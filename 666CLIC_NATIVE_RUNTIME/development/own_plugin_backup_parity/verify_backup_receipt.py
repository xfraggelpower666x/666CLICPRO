"""Read-only receipt consistency guard for one system's own plugin backup.

Never grants write authority, proves provider origin, or restores an archive.
"""
import json
import re
import sys
from pathlib import Path, PurePosixPath

_SHA = re.compile(r"[0-9a-f]{64}\Z")


def verify(receipt, *, owner, plugin_id, version, release_id):
    errors = []
    if not isinstance(receipt, dict):
        return {"status": "BACKUP_RECEIPT_BLOCKED", "errors": ["not_object"]}
    for field, expected in (("owner", owner), ("plugin_id", plugin_id),
                            ("version", version), ("release_id", release_id)):
        if not isinstance(expected, str) or not expected or receipt.get(field) != expected:
            errors.append("identity_mismatch:" + field)
    if receipt.get("source_release_id") != release_id:
        errors.append("source_release_mismatch")
    if receipt.get("backup_release_id") != release_id:
        errors.append("backup_release_mismatch")
    for field in ("source_archive_sha256", "backup_zip_sha256", "remote_readback_sha256"):
        v = receipt.get(field)
        if not isinstance(v, str) or not _SHA.fullmatch(v):
            errors.append("invalid_sha256:" + field)
    if (isinstance(receipt.get("backup_zip_sha256"), str) and
            receipt.get("backup_zip_sha256") != receipt.get("remote_readback_sha256")):
        errors.append("remote_hash_mismatch")
    for field in ("source_archive_bytes", "backup_zip_bytes", "remote_readback_bytes"):
        if type(receipt.get(field)) is not int or receipt[field] <= 0:
            errors.append("invalid_bytes:" + field)
    if (type(receipt.get("backup_zip_bytes")) is int and
            receipt.get("backup_zip_bytes") != receipt.get("remote_readback_bytes")):
        errors.append("remote_size_mismatch")
    path = receipt.get("backup_path")
    if (not isinstance(path, str) or not path.endswith(".zip") or path.startswith("/")
            or "\\" in path or ".." in PurePosixPath(path).parts
            or any(":" in s for s in PurePosixPath(path).parts)):
        errors.append("unsafe_backup_path")
    for field in ("original_archive_bytes_verified", "complete_zip_integrity_verified",
                  "remote_readback_independent", "native_storage_authority_verified"):
        if receipt.get(field) is not True:
            errors.append("missing_evidence:" + field)
    if receipt.get("live_release_changed_since_binding") is not False:
        errors.append("release_freshness_unverified")
    return {
        "status": "RECEIPT_CONSISTENT_REVIEW_ONLY" if not errors else "BACKUP_RECEIPT_BLOCKED",
        "errors": errors,
        "write_authorized": False,
        "restored": False,
        "provider_origin_verified_by_this_guard": False,
    }


def main(argv):
    if len(argv) != 6:
        print("usage: verify_backup_receipt.py receipt.json OWNER PLUGIN_ID VERSION RELEASE_ID", file=sys.stderr)
        return 3
    try:
        data = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
        result = verify(data, owner=argv[2], plugin_id=argv[3], version=argv[4], release_id=argv[5])
    except (OSError, ValueError) as e:
        result = {"status": "BACKUP_RECEIPT_BLOCKED", "errors": [type(e).__name__]}
    print(json.dumps(result, sort_keys=True, indent=2))
    return 0 if result["status"] == "RECEIPT_CONSISTENT_REVIEW_ONLY" else 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
