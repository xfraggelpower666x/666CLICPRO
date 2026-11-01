"""Read-only native own-plugin backup storage gate. No writes or network."""
import hashlib
import json
from pathlib import Path


def evaluate(evidence, *, owner, plugin_id):
    errors = []
    if not isinstance(evidence, dict):
        return {'status': 'WRITE_BLOCKED', 'errors': ['invalid_evidence']}
    if evidence.get('owner') != owner:
        errors.append('owner_mismatch')
    if evidence.get('plugin_id') != plugin_id:
        errors.append('plugin_id_mismatch')
    for k in ('version', 'release_id', 'backup_path', 'source_sha256', 'backup_sha256'):
        if not isinstance(evidence.get(k), str) or not evidence[k]:
            errors.append('missing_' + k)
    for k in ('source_sha256', 'backup_sha256'):
        if isinstance(evidence.get(k), str) and (len(evidence[k]) != 64 or any(c not in '0123456789abcdef' for c in evidence[k])):
            errors.append('invalid_' + k)
    path = evidence.get('backup_path', '')
    if isinstance(path, str) and (path.startswith('/') or '\\' in path or '..' in Path(path).parts):
        errors.append('unsafe_backup_path')
    for k in ('source_bytes_verified', 'archive_integrity_verified', 'native_storage_permission_verified', 'remote_backup_byte_readback_verified'):
        if evidence.get(k) is not True:
            errors.append('gate_open_' + k)
    if evidence.get('source_release_id') != evidence.get('release_id'):
        errors.append('release_binding_mismatch')
    return {'status': 'READY_FOR_NATIVE_APPROVAL_REVIEW' if not errors else 'WRITE_BLOCKED',
            'errors': errors, 'owner': owner, 'plugin_id': plugin_id,
            'note': 'Never authorizes write or claims actual backup execution'}


def main(argv):
    if len(argv) != 4:
        raise SystemExit('usage: python verify_native_backup_storage_gate.py evidence.json OWNER PLUGIN_ID')
    print(json.dumps(evaluate(json.loads(Path(argv[1]).read_text()), owner=argv[2], plugin_id=argv[3]), indent=2))

if __name__ == '__main__':
    import sys
    main(sys.argv)
