#!/usr/bin/env python3
"""READ-ONLY own-plugin full-backup ZIP restore preflight. No extraction/writes.

The binding is independent, trusted metadata from the native release workflow, not
inferred from the ZIP itself. This preflight does NOT establish Plugin Creator origin,
remote backup readback, native authorization, or actual successful restoration.
"""
import hashlib
import json
import pathlib
import re
import stat
import sys
import zipfile

MAX_ENTRIES = 4096
MAX_TOTAL_BYTES = 512 * 1024 * 1024
MAX_ENTRY_BYTES = 128 * 1024 * 1024
READ_CHUNK = 1024 * 1024
SHA256_RE = re.compile(r"[a-f0-9]{64}\Z")


def preflight(archive_path, binding, *, expected_owner, expected_plugin_id,
              expected_version, expected_release_id):
    errors = []
    def reject(reason):
        if reason not in errors:
            errors.append(reason)

    result = {
        "status": "RESTORE_PREFLIGHT_BLOCKED", "errors": errors,
        "owner": expected_owner, "plugin_id": expected_plugin_id,
        "release_id": expected_release_id,
        "restored": False, "remote_backup_readback_verified": False,
        "provider_origin_verified_by_this_check": False,
    }
    if not isinstance(binding, dict):
        reject("binding_not_object")
        return result
    for key, expected in (("owner", expected_owner), ("plugin_id", expected_plugin_id),
                          ("version", expected_version), ("release_id", expected_release_id)):
        if not isinstance(expected, str) or not expected or binding.get(key) != expected:
            reject("binding_" + key + "_mismatch")
    archive_hash = binding.get("archive_sha256")
    archive_size = binding.get("archive_size_bytes")
    entry_hashes = binding.get("entry_sha256")
    mandatory = {"plugin.json", ".codex-plugin/plugin.json"}
    if not isinstance(archive_hash, str) or not SHA256_RE.fullmatch(archive_hash):
        reject("archive_hash_invalid")
    if type(archive_size) is not int or archive_size <= 0:
        reject("archive_size_invalid")
    if not isinstance(entry_hashes, dict) or not entry_hashes:
        reject("entry_hash_manifest_missing")
        return result
    if any(not isinstance(k, str) or not isinstance(v, str) or not SHA256_RE.fullmatch(v)
           for k, v in entry_hashes.items()):
        reject("entry_hash_manifest_invalid")
    if not mandatory.issubset(entry_hashes):
        reject("mandatory_entry_hash_missing")
    if errors:
        return result

    path = pathlib.Path(archive_path)
    try:
        if not path.is_file():
            reject("archive_missing")
            return result
        size = path.stat().st_size
        if size != archive_size:
            reject("archive_size_mismatch")
            return result
        hasher = hashlib.sha256()
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(READ_CHUNK), b""):
                hasher.update(chunk)
        if hasher.hexdigest() != archive_hash:
            reject("archive_sha256_mismatch")
            return result

        with zipfile.ZipFile(path) as z:
            infos = z.infolist()
            if not infos or len(infos) > MAX_ENTRIES:
                reject("entry_count_invalid")
                return result
            names = [i.filename for i in infos]
            if len(set(names)) != len(names):
                reject("duplicate_entries")
            if set(names) != set(entry_hashes):
                reject("entry_manifest_coverage_mismatch")
            if not mandatory.issubset(names):
                reject("mandatory_manifest_missing")
            total = 0
            for info in infos:
                name = info.filename
                segments = pathlib.PurePosixPath(name).parts
                if (not name or name.startswith("/") or "\\" in name or
                        ".." in segments or ":" in segments[0]):
                    reject("unsafe_archive_path")
                if info.is_dir():
                    reject("directory_entry_not_bound")
                mode = (info.external_attr >> 16) & 0o170000
                if mode and mode != stat.S_IFREG:
                    reject("non_regular_entry")
                if info.flag_bits & 0x1:
                    reject("encrypted_entry")
                if info.file_size > MAX_ENTRY_BYTES:
                    reject("entry_size_limit")
                total += info.file_size
                if total > MAX_TOTAL_BYTES:
                    reject("archive_uncompressed_limit")
            if errors:
                return result
            for info in infos:
                digest = hashlib.sha256()
                with z.open(info, "r") as stream:
                    while True:
                        chunk = stream.read(READ_CHUNK)
                        if not chunk:
                            break
                        digest.update(chunk)
                if digest.hexdigest() != entry_hashes[info.filename]:
                    reject("entry_sha256_mismatch:" + info.filename)
            for name in mandatory:
                try:
                    manifest = json.loads(z.read(name))
                except (UnicodeDecodeError, ValueError):
                    reject("invalid_json_manifest:" + name)
                    continue
                if not isinstance(manifest, dict) or manifest.get("version") != expected_version:
                    reject("manifest_version_mismatch:" + name)
            result["entries_checked"] = len(infos)
            result["archive_sha256"] = hasher.hexdigest()
    except (OSError, ValueError, RuntimeError, EOFError, zipfile.BadZipFile, zipfile.LargeZipFile):
        reject("archive_corrupt_or_unreadable")
    if not errors:
        result["status"] = "LOCAL_RESTORE_PREFLIGHT_PASS_NOT_RESTORED"
    return result


def main(argv):
    if len(argv) != 7:
        print("Usage: restore_preflight.py FULL.zip binding.json OWNER PLUGIN_ID VERSION RELEASE_ID", file=sys.stderr)
        return 3
    try:
        binding = json.loads(pathlib.Path(argv[2]).read_text(encoding="utf-8"))
        report = preflight(argv[1], binding, expected_owner=argv[3],
                           expected_plugin_id=argv[4], expected_version=argv[5],
                           expected_release_id=argv[6])
    except (OSError, ValueError) as exc:
        report = {"status": "RESTORE_PREFLIGHT_BLOCKED", "errors": ["binding_unreadable:" + type(exc).__name__]}
    print(json.dumps(report, sort_keys=True, indent=2))
    return 0 if report["status"] == "LOCAL_RESTORE_PREFLIGHT_PASS_NOT_RESTORED" else 2


if __name__ == "__main__":
    sys.exit(main(argv=sys.argv))
