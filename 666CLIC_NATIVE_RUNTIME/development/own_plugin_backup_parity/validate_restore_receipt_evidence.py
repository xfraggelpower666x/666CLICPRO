"""Offline fail-closed restore receipt evidence validation. Local synthetic evidence only."""
import hashlib
import json
import pathlib
import re
import stat
import tempfile
import zipfile

SHA = re.compile(r"[0-9a-f]{64}\Z")
MANDATORY = {"plugin.json", ".codex-plugin/plugin.json"}
MAX_ENTRIES = 4096
MAX_FILE_BYTES = 128 * 1024 * 1024
MAX_TOTAL_BYTES = 512 * 1024 * 1024


def _hash_bytes(data):
    return hashlib.sha256(data).hexdigest()


def validate(archive, binding, receipt, *, owner, plugin_id, version, release_id, scratch_root):
    errors = []
    def block(error):
        if error not in errors:
            errors.append(error)

    report = {"status": "RESTORE_RECEIPT_BLOCKED", "errors": errors,
              "production_restored": False, "remote_backup_verified": False,
              "plugin_provider_origin_verified": False, "write_authorized": False}
    if not isinstance(binding, dict) or not isinstance(receipt, dict):
        block("binding_or_receipt_not_object")
        return report
    expected = {"owner": owner, "plugin_id": plugin_id,
                "version": version, "release_id": release_id}
    if any(not isinstance(v, str) or not v for v in expected.values()):
        block("invalid_expected_identity")
    for key, value in expected.items():
        if binding.get(key) != value or receipt.get(key) != value:
            block("identity_mismatch:" + key)
    if receipt.get("source_release_id") != release_id or receipt.get("backup_release_id") != release_id:
        block("stale_receipt_release")
    if receipt.get("live_release_changed_since_binding") is not False:
        block("release_freshness_unverified")
    if receipt.get("evidence_scope") != "SYNTHETIC_LOCAL_ONLY":
        block("evidence_scope_mismatch")
    if receipt.get("claims_production_restore") is not False:
        block("production_claim_forbidden")
    if receipt.get("claims_remote_backup") is not False:
        block("remote_claim_forbidden")
    hash_map = binding.get("entry_sha256")
    if not isinstance(hash_map, dict) or not hash_map or not MANDATORY.issubset(hash_map):
        block("entry_manifest_invalid")
    elif any(not isinstance(n, str) or not isinstance(h, str) or not SHA.fullmatch(h)
             for n, h in hash_map.items()):
        block("entry_hash_invalid")
    archive_hash = binding.get("archive_sha256")
    if not isinstance(archive_hash, str) or not SHA.fullmatch(archive_hash):
        block("archive_hash_invalid")
    if type(binding.get("archive_size_bytes")) is not int or binding["archive_size_bytes"] <= 0:
        block("archive_size_invalid")
    if errors:
        return report
    path = pathlib.Path(archive)
    scratch = pathlib.Path(scratch_root)
    if not scratch.is_dir() or scratch.is_symlink():
        block("scratch_root_invalid")
        return report
    try:
        if not path.is_file() or path.is_symlink():
            block("archive_file_invalid")
            return report
        raw = path.read_bytes()
        if len(raw) != binding["archive_size_bytes"] or _hash_bytes(raw) != archive_hash:
            block("archive_sha_or_size_mismatch")
            return report
        with zipfile.ZipFile(path) as z:
            infos = z.infolist()
            names = [i.filename for i in infos]
            if not infos or len(infos) > MAX_ENTRIES or len(set(names)) != len(names):
                block("archive_inventory_invalid")
            if set(names) != set(hash_map):
                block("manifest_entry_coverage_mismatch")
            total = 0
            for i in infos:
                p = pathlib.PurePosixPath(i.filename)
                mode = (i.external_attr >> 16) & 0o170000
                if (not i.filename or i.filename.startswith("/") or "\\" in i.filename
                        or ".." in p.parts or ":" in p.parts[0] or i.is_dir()
                        or (mode and mode != stat.S_IFREG) or i.flag_bits & 1):
                    block("unsafe_archive_member")
                if i.file_size > MAX_FILE_BYTES:
                    block("file_limit_exceeded")
                total += i.file_size
                if total > MAX_TOTAL_BYTES:
                    block("total_limit_exceeded")
            if errors:
                return report
            checked = {}
            with tempfile.TemporaryDirectory(dir=scratch, prefix="restore-receipt-probe-") as d:
                dest = pathlib.Path(d)
                for i in infos:
                    data = z.read(i)
                    if len(data) != i.file_size or _hash_bytes(data) != hash_map[i.filename]:
                        block("source_entry_mismatch:" + i.filename)
                        return report
                    target = dest.joinpath(*pathlib.PurePosixPath(i.filename).parts)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with target.open("xb") as f:
                        f.write(data)
                    read = target.read_bytes()
                    if len(read) != len(data) or _hash_bytes(read) != hash_map[i.filename]:
                        block("extracted_entry_mismatch:" + i.filename)
                        return report
                    checked[i.filename] = {"sha256": _hash_bytes(read), "size_bytes": len(read)}
                actual = {p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file()}
                if actual != set(hash_map):
                    block("extracted_inventory_mismatch")
                    return report
                for name in MANDATORY:
                    m = json.loads((dest / name).read_text(encoding="utf-8"))
                    if not isinstance(m, dict) or m.get("version") != version:
                        block("extracted_manifest_version_mismatch:" + name)
                if errors:
                    return report
                if receipt.get("archive_sha256") != _hash_bytes(raw):
                    block("receipt_archive_sha_mismatch")
                if receipt.get("archive_size_bytes") != len(raw):
                    block("receipt_archive_size_mismatch")
                if receipt.get("entry_readback") != checked:
                    block("receipt_entry_readback_mismatch")
                if receipt.get("manifest_versions") != {n: version for n in sorted(MANDATORY)}:
                    block("receipt_manifest_version_mismatch")
                if errors:
                    return report
                report.update({"status": "LOCAL_RESTORE_RECEIPT_REVIEW_ONLY",
                               "entries_checked": len(checked),
                               "archive_sha256": _hash_bytes(raw),
                               "temporary_restore_readback": True,
                               "manifest_readback": True})
    except (OSError, ValueError, UnicodeError, RuntimeError, EOFError, zipfile.BadZipFile, zipfile.LargeZipFile, KeyError):
        block("unreadable_or_corrupt_archive_or_manifest")
    return report
