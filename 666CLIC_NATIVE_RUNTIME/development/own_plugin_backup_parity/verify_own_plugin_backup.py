#!/usr/bin/env python3
"""Read-only integrity gate for an OWNED plugin's complete ZIP backup.
No plugin update, release creation, vault write, or foreign authority.
Usage: python verify_own_plugin_backup.py backup.zip binding.json
binding.json: {"plugin_id":"...","version":"...","release_id":"...",
              "archive_sha256":"64 lowercase hex","archive_size_bytes":123,
              "required_paths":["plugin.json",".codex-plugin/plugin.json"]}
Exit: 0 = verified; 2 = invalid/mismatch; 3 = IO/JSON error.
"""
import hashlib
import json
import pathlib
import re
import sys
import zipfile

def verify(archive, binding):
    report = {"status": "BLOCKED", "errors": [], "archive": str(archive)}
    required = ("plugin_id", "version", "release_id", "archive_sha256",
                "archive_size_bytes", "required_paths")
    for key in required:
        if key not in binding:
            report["errors"].append("missing_binding:" + key)
    if report["errors"]:
        return report
    if not isinstance(binding["required_paths"], list) or not binding["required_paths"]:
        report["errors"].append("required_paths_empty_or_invalid")
        return report
    for key in ("plugin_id", "version", "release_id"):
        if not isinstance(binding[key], str) or not binding[key].strip():
            report["errors"].append("invalid_binding:" + key)
    if not re.fullmatch("[0-9a-f]{64}", str(binding["archive_sha256"])):
        report["errors"].append("invalid_sha256")
    raw = archive.read_bytes()
    observed = hashlib.sha256(raw).hexdigest()
    report["archive_sha256"] = observed
    report["archive_size_bytes"] = len(raw)
    if observed != binding["archive_sha256"]:
        report["errors"].append("archive_sha256_mismatch")
    if len(raw) != binding["archive_size_bytes"]:
        report["errors"].append("archive_size_mismatch")
    if report["errors"]:
        return report
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        files = [i for i in z.infolist() if not i.is_dir()]
        if len(names) != len(set(names)):
            report["errors"].append("duplicate_zip_entries")
        for name in names:
            parts = pathlib.PurePosixPath(name).parts
            if (name.startswith("/") or "\\" in name or ".." in parts):
                report["errors"].append("unsafe_zip_path:" + name)
        if z.testzip() is not None:
            report["errors"].append("zip_crc_failed")
        for p in binding["required_paths"]:
            if not isinstance(p, str) or p not in names:
                report["errors"].append("required_file_missing:" + str(p))
        if "plugin.json" in names:
            try:
                manifest = json.loads(z.read("plugin.json"))
                if manifest.get("version") != binding["version"]:
                    report["errors"].append("manifest_version_mismatch")
            except (ValueError, UnicodeDecodeError):
                report["errors"].append("manifest_invalid")
        if ".codex-plugin/plugin.json" in names:
            try:
                manifest = json.loads(z.read(".codex-plugin/plugin.json"))
                if manifest.get("version") != binding["version"]:
                    report["errors"].append("codex_manifest_version_mismatch")
            except (ValueError, UnicodeDecodeError):
                report["errors"].append("codex_manifest_invalid")
        report["entry_count"] = len(files)
    report["plugin_id"] = binding["plugin_id"]
    report["version"] = binding["version"]
    report["release_id"] = binding["release_id"]
    report["status"] = "VERIFIED_ARCHIVE_INTEGRITY_NOT_LIVE_RELEASE_PARITY" if not report["errors"] else "BLOCKED"
    return report

def main(argv):
    if len(argv) != 3:
        print("Usage: verify_own_plugin_backup.py backup.zip binding.json", file=sys.stderr)
        return 3
    try:
        binding = json.loads(pathlib.Path(argv[2]).read_text(encoding="utf-8"))
        result = verify(pathlib.Path(argv[1]), binding)
    except (OSError, ValueError, zipfile.BadZipFile, KeyError, TypeError) as exc:
        result = {"status": "ERROR", "error": str(exc)}
    print(json.dumps(result, sort_keys=True, indent=2))
    return 0 if result["status"].startswith("VERIFIED_") else (3 if result["status"] == "ERROR" else 2)

if __name__ == "__main__":
    sys.exit(main(sys.argv))
