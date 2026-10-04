#!/usr/bin/env python3
"""Offline REV91 *static* CLIC manifest consistency validator.

Inputs are snapshots supplied by a trusted caller; this never fetches remote
CURRENT and cannot prove fresh-host-chat acceptance or live recovery.
"""
import argparse
import json
import sys
from pathlib import Path

EXPECTED_SYSTEM = '666CLIC'
EXPECTED_AUTHORITY = 'GOOGLE_DRIVE_REV91'
REV91_BRIDGE = 'current/REV91_SOURCE_BRIDGE_AND_ACCEPTANCE.md'
REV91_GUARD = 'current/REV91_SECONDARY_CARRIER_GUARD.md'


def assess(manifest, pointer, drive_pointer_text, carrier_names):
    errors = []
    def require(ok, code):
        if not ok:
            errors.append(code)

    marker = 'BEGIN_666CLIC_CURRENT_POINTER_REV91'
    ending = 'END_666CLIC_CURRENT_POINTER_REV91'
    # Explicit bounded record, not a free-floating string from earlier history.
    start = drive_pointer_text.rfind(marker)
    end = drive_pointer_text.find(ending, start) if start >= 0 else -1
    record = drive_pointer_text[start:end] if start >= 0 and end > start else ''
    lines = dict(
        line.split('=', 1) for line in record.splitlines()
        if '=' in line and not line.startswith('BEGIN_')
    )
    require(bool(record), 'MISSING_VERIFIED_REV91_RECORD')
    require(lines.get('CURRENT_REV') == '91', 'DRIVE_CURRENT_NOT_REV91')
    require(lines.get('SYSTEM_ID') == EXPECTED_SYSTEM, 'DRIVE_WRONG_SYSTEM')
    require(lines.get('CURRENT_PRODUCT_AUTHORITY') == 'GOOGLE_DRIVE', 'DRIVE_WRONG_AUTHORITY')
    require(manifest.get('system') == EXPECTED_SYSTEM, 'MANIFEST_WRONG_SYSTEM')
    require(manifest.get('current_source_authority') == EXPECTED_AUTHORITY, 'MANIFEST_WRONG_AUTHORITY')
    resolved = manifest.get('currentness_resolution') or {}
    require(resolved.get('effective_source_revision') == 91, 'MANIFEST_STALE_CURRENT')
    require(resolved.get('effective_source') == 'GOOGLE_DRIVE_CURRENT_POINTER', 'MANIFEST_SOURCE_NOT_DRIVE_POINTER')
    require(resolved.get('on_revision_conflict') == 'CONFLICT_QUARANTINE', 'NO_FAIL_CLOSED_CONFLICT')
    require(pointer.get('source_authority') == EXPECTED_AUTHORITY, 'STAGING_POINTER_AUTHORITY_CONFLICT')
    require(pointer.get('native_source_revision_verified') == 91, 'STAGING_POINTER_STALE_REVISION')
    require(pointer.get('authority_switch') is False, 'AUTHORITY_SWITCH_UNAUTHORIZED')
    require(pointer.get('migration_promotion') is False, 'PRODUCTION_PROMOTION_UNAUTHORIZED')
    required = manifest.get('required_order')
    require(isinstance(required, list) and len(required) == 12, 'INVALID_REQUIRED_ORDER')
    if isinstance(required, list):
        require(required[:2] == [REV91_BRIDGE, REV91_GUARD], 'REV91_PRECEDENCE_LOST')
        require(len(required) == len(set(required)), 'DUPLICATE_REQUIRED_CARRIER')
        require(all(isinstance(n, str) and n in carrier_names for n in required), 'MISSING_REQUIRED_CARRIER')
    # Historical REV90 evidence is intentionally retained, but never promoted.
    require((manifest.get('current_source_evidence') or {}).get('clic_revision') == 90, 'HISTORICAL_EVIDENCE_CHANGED_UNEXPECTEDLY')
    require('current_source_evidence.clic_revision' in resolved.get('legacy_fields_historical_not_current', []), 'HISTORY_NOT_EXPLICITLY_CLASSIFIED')
    require(manifest.get('result') == 'PARTIAL', 'FALSE_STATIC_FULL_PASS')
    return {'result': 'PASS_STATIC_ONLY' if not errors else 'CONFLICT_QUARANTINE', 'errors': errors,
            'runtime_acceptance': 'NOT_TESTED', 'p20': 'OPEN', 'p21': 'OPEN', 'live_circle': 'OPEN', 'restore': 'OPEN'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--staging-pointer', required=True, type=Path)
    parser.add_argument('--drive-pointer-snapshot', required=True, type=Path)
    parser.add_argument('--carrier-index', required=True, type=Path, help='JSON list of successfully fetched carrier paths')
    args = parser.parse_args()
    result = assess(json.loads(args.manifest.read_text()), json.loads(args.staging_pointer.read_text()),
                    args.drive_pointer_snapshot.read_text(), json.loads(args.carrier_index.read_text()))
    print(json.dumps(result, indent=2))
    return 0 if result['result'] == 'PASS_STATIC_ONLY' else 2


if __name__ == '__main__':
    sys.exit(main())
