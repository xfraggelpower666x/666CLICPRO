"""Offline read-only-source recovery simulation for an owned plugin ZIP.

Only extracts a fully bound ZIP into an empty caller-provided temp directory,
checks extracted hashes/bytes/manifest, and deletes its scratch directory on error.
No remote backup, provider readback, or productive restore is claimed.
"""
import hashlib
import json
import pathlib
import tempfile
import zipfile

from restore_preflight import preflight


def simulate(archive_path, binding, *, owner, plugin_id, version, release_id, scratch_root):
    gate = preflight(archive_path, binding, expected_owner=owner,
                     expected_plugin_id=plugin_id, expected_version=version,
                     expected_release_id=release_id)
    result = {"status": "SIMULATION_BLOCKED", "errors": list(gate["errors"]),
              "source_preflight": gate["status"], "production_restored": False,
              "provider_origin_verified": False, "remote_backup_readback": False}
    if gate["status"] != "LOCAL_RESTORE_PREFLIGHT_PASS_NOT_RESTORED":
        return result
    scratch = pathlib.Path(scratch_root)
    if not scratch.is_dir() or scratch.is_symlink():
        result["errors"].append("scratch_root_invalid")
        return result
    try:
        with tempfile.TemporaryDirectory(prefix="own-restore-probe-", dir=scratch) as tmp:
            dest = pathlib.Path(tmp)
            observed = {}
            with zipfile.ZipFile(archive_path) as z:
                for info in z.infolist():
                    # preflight already rejects traversal, duplicates and non-regular entries
                    rel = pathlib.PurePosixPath(info.filename)
                    target = dest.joinpath(*rel.parts)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    if target.exists() or target.is_symlink():
                        raise ValueError("target_collision")
                    with z.open(info) as src, target.open("xb") as sink:
                        size = 0
                        digest = hashlib.sha256()
                        while (chunk := src.read(1024 * 1024)):
                            sink.write(chunk)
                            digest.update(chunk)
                            size += len(chunk)
                    actual = target.read_bytes()
                    if hashlib.sha256(actual).hexdigest() != digest.hexdigest() or len(actual) != size:
                        raise ValueError("extracted_file_readback_mismatch")
                    if digest.hexdigest() != binding["entry_sha256"][info.filename]:
                        raise ValueError("extracted_sha256_mismatch")
                    observed[info.filename] = {"sha256": digest.hexdigest(), "bytes": size}
            files = {p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file()}
            if files != set(binding["entry_sha256"]):
                raise ValueError("extracted_inventory_mismatch")
            for manifest_name in ("plugin.json", ".codex-plugin/plugin.json"):
                manifest = json.loads((dest / manifest_name).read_text(encoding="utf-8"))
                if not isinstance(manifest, dict) or manifest.get("version") != version:
                    raise ValueError("extracted_manifest_version_mismatch")
            result.update(status="LOCAL_TEMP_RESTORE_SIMULATION_PASS_NOT_PRODUCTION",
                          errors=[], entries_checked=len(observed),
                          extracted_content_readback=True, extracted_manifest_readback=True,
                          scratch_cleaned_on_return=True)
    except (OSError, ValueError, KeyError, UnicodeError, RuntimeError) as exc:
        result["errors"].append("simulation_error:" + type(exc).__name__)
    return result
