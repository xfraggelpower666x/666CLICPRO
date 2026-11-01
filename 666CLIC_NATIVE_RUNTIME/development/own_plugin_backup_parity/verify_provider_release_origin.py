#!/usr/bin/env python3
"""Read-only origin gate: matches live Plugin Creator metadata to exact archive export.
A signed download URL NEVER proves archived bytes or completed backup.
Input: sanitized JSON (no signed URLs)."""
import json
import sys
from pathlib import Path

def verify_origin(receipt):
    errors = []
    if not isinstance(receipt, dict):
        return {'status': 'BLOCKED', 'errors': ['receipt_not_object']}
    plugin_id = receipt.get('expected_plugin_id')
    metadata = receipt.get('live_metadata')
    export = receipt.get('archive_export')
    if not isinstance(metadata, dict) or not isinstance(export, dict):
        return {'status': 'BLOCKED', 'errors': ['live_metadata_or_archive_export_missing']}
    if not isinstance(plugin_id, str) or not plugin_id:
        errors.append('expected_plugin_id_missing')
    for field in ('plugin_id', 'version', 'current_release_id'):
        if not isinstance(metadata.get(field), str) or not metadata[field]:
            errors.append('metadata_' + field + '_missing')
    provider_plugin = export.get('plugin')
    release = export.get('release')
    if not isinstance(provider_plugin, dict) or not isinstance(release, dict):
        return {'status': 'BLOCKED', 'errors': errors + ['export_plugin_or_release_missing']}
    if metadata.get('plugin_id') != plugin_id or provider_plugin.get('plugin_id') != plugin_id:
        errors.append('plugin_identity_mismatch')
    if release.get('release_id') != metadata.get('current_release_id'):
        errors.append('release_id_mismatch')
    if provider_plugin.get('current_release_id') != metadata.get('current_release_id'):
        errors.append('export_current_release_mismatch')
    if release.get('version') != metadata.get('version') or provider_plugin.get('version') != metadata.get('version'):
        errors.append('version_mismatch')
    if release.get('is_current') is not True:
        errors.append('export_release_not_current')
    if export.get('mime_type') not in ('application/gzip', 'application/x-gzip'):
        errors.append('unexpected_archive_media_type')
    if not isinstance(export.get('file_name'), str) or not export['file_name'].endswith('.tar.gz'):
        errors.append('unexpected_archive_filename')
    if 'download_url' in export or 'download_url' in receipt:
        errors.append('signed_url_must_not_be_persisted')
    return {
        'status': 'PROVIDER_RELEASE_EXPORT_BOUND_BYTES_PENDING' if not errors else 'BLOCKED',
        'errors': errors,
        'plugin_id': plugin_id,
        'release_id': metadata.get('current_release_id'),
        'version': metadata.get('version'),
        'original_archive_bytes_readback': False,
        'backup_zip_readback': False,
        'origin_status_is_not_backup_pass': True,
    }

def main(argv):
    if len(argv) != 2:
        print('Usage: verify_provider_release_origin.py sanitized_receipt.json', file=sys.stderr)
        return 3
    try:
        receipt = json.loads(Path(argv[1]).read_text(encoding='utf-8'))
        result = verify_origin(receipt)
    except (OSError, ValueError) as exc:
        print(json.dumps({'status': 'ERROR', 'error': str(exc)}))
        return 3
    print(json.dumps(result, sort_keys=True, indent=2))
    return 0 if result['status'] == 'PROVIDER_RELEASE_EXPORT_BOUND_BYTES_PENDING' else 2

if __name__ == '__main__':
    sys.exit(main(sys.argv))
