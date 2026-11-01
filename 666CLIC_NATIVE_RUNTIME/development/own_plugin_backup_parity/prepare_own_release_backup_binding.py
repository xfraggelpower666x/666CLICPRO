#!/usr/bin/env python3
"""Prepare an OWN-plugin ZIP binding from a caller-supplied fresh Plugin Creator readback.
Read-only: does NOT fetch provider bytes, update plugins, or back up archives.
Use only after independently obtaining the exact release's full original ZIP.
Usage: python prepare_own_release_backup_binding.py full.zip creator_readback.json
Output is a proposed binding, NOT live-byte provenance or a backup receipt.
"""
import hashlib
import json
import pathlib
import sys
import zipfile


def prepare(archive, readback):
    required = ('plugin_id', 'version', 'current_release_id')
    if not isinstance(readback, dict) or any(not isinstance(readback.get(k), str) or not readback[k].strip() for k in required):
        raise ValueError('missing_or_invalid_creator_readback')
    data = archive.read_bytes()
    with zipfile.ZipFile(archive) as z:
        names = set(z.namelist())
        for path in ('plugin.json', '.codex-plugin/plugin.json'):
            if path not in names:
                raise ValueError('full_plugin_manifest_missing:' + path)
            manifest = json.loads(z.read(path))
            if manifest.get('version') != readback['version']:
                raise ValueError('manifest_version_mismatch:' + path)
    return {
        'plugin_id': readback['plugin_id'],
        'version': readback['version'],
        'release_id': readback['current_release_id'],
        'archive_sha256': hashlib.sha256(data).hexdigest(),
        'archive_size_bytes': len(data),
        'required_paths': ['plugin.json', '.codex-plugin/plugin.json'],
        'evidence_class': 'PROPOSED_LOCAL_ZIP_BINDING_RELEASE_ORIGIN_UNVERIFIED',
        'provider_full_archive_origin_verified': False,
        'independent_remote_backup_readback': False,
    }


def main(argv):
    if len(argv) != 3:
        print('Usage: prepare_own_release_backup_binding.py full.zip creator_readback.json', file=sys.stderr)
        return 3
    try:
        r = json.loads(pathlib.Path(argv[2]).read_text(encoding='utf-8'))
        print(json.dumps(prepare(pathlib.Path(argv[1]), r), indent=2, sort_keys=True))
        return 0
    except (OSError, ValueError, TypeError, zipfile.BadZipFile) as e:
        print('BLOCKED: '+str(e), file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
