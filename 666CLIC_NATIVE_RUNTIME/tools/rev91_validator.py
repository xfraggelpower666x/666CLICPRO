#!/usr/bin/env python3
"""Offline static validator for repository-native 666CLIC currentness.

The repository is the sole active working/current authority. Google Drive
snapshots are history/backup/recovery evidence only. This validator never
proves fresh-host-chat, Live-Circle or restore acceptance.
"""
import argparse
import json
import sys
from pathlib import Path

EXPECTED_SYSTEM = "666CLIC"
EXPECTED_AUTHORITY = "GITHUB_REPO_CURRENT"
REPO_CARRIER = "current/REPO_NATIVE_AUTHORITY_AND_RECOVERY.md"
REV91_BRIDGE = "current/REV91_SOURCE_BRIDGE_AND_ACCEPTANCE.md"
REV91_GUARD = "current/REV91_SECONDARY_CARRIER_GUARD.md"
EXPECTED_ORDER = [
    REPO_CARRIER,
    "AUTHORITY_CONTRACT.md",
    "CURRENT_POINTER.json",
    "current/CURRENT_STATE.md",
    "current/FORENSICS_AND_BOUNDARIES.md",
    "continuity/PROVENANCE_SUPERSESSION.md",
    "continuity/LIVE_CIRCLE.md",
    "current/OPERATIONS_CENTER.md",
    "relations/CROSS_SYSTEM_RELATIONS.md",
    "continuity/RECOVERY_AND_HANDOFF.md",
    "relations/LYVRA_UNDERSTANDING_CARD_REV80.md",
    REV91_BRIDGE,
    REV91_GUARD,
]


def assess(manifest, pointer, drive_pointer_text, carrier_names):
    errors = []

    def require(ok, code):
        if not ok:
            errors.append(code)

    require(manifest.get("system") == EXPECTED_SYSTEM, "MANIFEST_WRONG_SYSTEM")
    require(manifest.get("current_source_authority") == EXPECTED_AUTHORITY,
            "MANIFEST_WRONG_AUTHORITY")
    require(manifest.get("authority") == EXPECTED_AUTHORITY,
            "MANIFEST_AUTHORITY_NOT_REPO")

    resolved = manifest.get("currentness_resolution") or {}
    require(resolved.get("effective_source") == EXPECTED_AUTHORITY,
            "MANIFEST_SOURCE_NOT_REPO")
    require(resolved.get("product_authority") == EXPECTED_AUTHORITY,
            "MANIFEST_PRODUCT_AUTHORITY_NOT_REPO")
    require(resolved.get("authority_switch") == "TRUE_2026-10-05",
            "AUTHORITY_SWITCH_NOT_RECORDED")
    require(resolved.get("on_revision_conflict") == "CONFLICT_QUARANTINE",
            "NO_FAIL_CLOSED_CONFLICT")
    require(resolved.get("on_missing_current_pointer") == "CONFLICT_QUARANTINE",
            "NO_FAIL_CLOSED_MISSING_POINTER")

    require(pointer.get("system") == EXPECTED_SYSTEM, "POINTER_WRONG_SYSTEM")
    require(pointer.get("source_authority") == EXPECTED_AUTHORITY,
            "POINTER_AUTHORITY_CONFLICT")
    require(pointer.get("authority_switch") is True,
            "POINTER_AUTHORITY_SWITCH_NOT_TRUE")
    require(pointer.get("migration_promotion") is True,
            "POINTER_REPO_PROMOTION_NOT_TRUE")
    require(pointer.get("drive_active_working_source") is False,
            "DRIVE_STILL_ACTIVE_WORKING_SOURCE")
    require(pointer.get("drive_role") == "HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE",
            "DRIVE_ROLE_NOT_HISTORICAL_BACKUP")

    required = manifest.get("required_order")
    require(isinstance(required, list), "INVALID_REQUIRED_ORDER")
    if isinstance(required, list):
        require(required == EXPECTED_ORDER, "REPO_NATIVE_PRECEDENCE_LOST")
        types_valid = all(isinstance(n, str) for n in required)
        require(types_valid, "INVALID_CARRIER_TYPE")
        if types_valid:
            require(len(required) == len(set(required)), "DUPLICATE_REQUIRED_CARRIER")
            require(all(n in carrier_names for n in required),
                    "MISSING_REQUIRED_CARRIER")
            require(required.index(REV91_BRIDGE) > required.index(REPO_CARRIER),
                    "HISTORICAL_BRIDGE_PROMOTED")
            require(required.index(REV91_GUARD) > required.index(REPO_CARRIER),
                    "HISTORICAL_GUARD_PROMOTED")

    # Preserve old Drive-era evidence as history only.
    require((manifest.get("current_source_evidence") or {}).get("clic_revision") == 90,
            "HISTORICAL_EVIDENCE_CHANGED_UNEXPECTEDLY")
    require("current_source_evidence.clic_revision" in
            resolved.get("legacy_fields_historical_not_current", []),
            "HISTORY_NOT_EXPLICITLY_CLASSIFIED")
    require((resolved.get("legacy_drive_current_carriers_role") ==
             "HISTORICAL_PROVENANCE_ONLY"),
            "DRIVE_CARRIERS_NOT_HISTORICAL")

    # Drive is optional for normal startup but if supplied to this validator,
    # it must show the repo-only role transition and must not claim to be active.
    if drive_pointer_text:
        require("DRIVE_ACTIVE_WORKING_SOURCE=FALSE" in drive_pointer_text,
                "DRIVE_HISTORY_MARKER_MISSING")
        require("DRIVE_ROLE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE" in drive_pointer_text,
                "DRIVE_BACKUP_ROLE_MISSING")
        require("CURRENT_REPO=xfraggelpower666x/666CLICPRO" in drive_pointer_text,
                "DRIVE_REPO_BACKUP_TARGET_MISSING")

    require(manifest.get("result") == "PARTIAL", "FALSE_STATIC_FULL_PASS")
    return {
        "result": "PASS_STATIC_ONLY" if not errors else "CONFLICT_QUARANTINE",
        "errors": errors,
        "runtime_acceptance": "NOT_TESTED",
        "p20": "OPEN",
        "p21": "OPEN",
        "live_circle": "OPEN",
        "restore": "OPEN",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--staging-pointer", required=True, type=Path)
    parser.add_argument("--drive-pointer-snapshot", type=Path)
    parser.add_argument("--carrier-index", required=True, type=Path)
    args = parser.parse_args()
    drive_text = (args.drive_pointer_snapshot.read_text()
                  if args.drive_pointer_snapshot else "")
    result = assess(
        json.loads(args.manifest.read_text()),
        json.loads(args.staging_pointer.read_text()),
        drive_text,
        json.loads(args.carrier_index.read_text()),
    )
    print(json.dumps(result, indent=2))
    return 0 if result["result"] == "PASS_STATIC_ONLY" else 2


if __name__ == "__main__":
    sys.exit(main())
