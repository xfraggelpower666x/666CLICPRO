"""Offline repository-native currentness tests; no remote/runtime acceptance claims."""
import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from rev91_validator import assess, EXPECTED_ORDER, REPO_CARRIER

ORDER = list(EXPECTED_ORDER)
MANIFEST = {
    "system": "666CLIC",
    "authority": "GITHUB_REPO_CURRENT",
    "current_source_authority": "GITHUB_REPO_CURRENT",
    "current_source_evidence": {"clic_revision": 90},
    "required_order": ORDER,
    "result": "PARTIAL",
    "currentness_resolution": {
        "effective_source": "GITHUB_REPO_CURRENT",
        "product_authority": "GITHUB_REPO_CURRENT",
        "authority_switch": "TRUE_2026-10-05",
        "on_revision_conflict": "CONFLICT_QUARANTINE",
        "on_missing_current_pointer": "CONFLICT_QUARANTINE",
        "legacy_fields_historical_not_current": ["current_source_evidence.clic_revision"],
        "legacy_drive_current_carriers_role": "HISTORICAL_PROVENANCE_ONLY",
    },
}
POINTER = {
    "system": "666CLIC",
    "source_authority": "GITHUB_REPO_CURRENT",
    "authority_switch": True,
    "migration_promotion": True,
    "drive_active_working_source": False,
    "drive_role": "HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE",
}
DRIVE = (
    "DRIVE_ACTIVE_WORKING_SOURCE=FALSE\n"
    "DRIVE_ROLE=HISTORY|REPO_BACKUP|RECOVERY|PROVENANCE\n"
    "CURRENT_REPO=xfraggelpower666x/666CLICPRO\n"
)


class GuardTests(unittest.TestCase):
    def test_valid_static(self):
        out = assess(MANIFEST, POINTER, DRIVE, ORDER)
        self.assertEqual(out["result"], "PASS_STATIC_ONLY")
        self.assertEqual(out["runtime_acceptance"], "NOT_TESTED")

    def test_drive_optional_for_normal_repo_validation(self):
        self.assertEqual(assess(MANIFEST, POINTER, "", ORDER)["result"], "PASS_STATIC_ONLY")

    def test_manifest_drive_authority_rejected(self):
        x = copy.deepcopy(MANIFEST)
        x["current_source_authority"] = "GOOGLE_DRIVE_REV91"
        self.assertIn("MANIFEST_WRONG_AUTHORITY", assess(x, POINTER, DRIVE, ORDER)["errors"])

    def test_pointer_drive_authority_rejected(self):
        x = copy.deepcopy(POINTER)
        x["source_authority"] = "GOOGLE_DRIVE_REV91"
        self.assertIn("POINTER_AUTHORITY_CONFLICT", assess(MANIFEST, x, DRIVE, ORDER)["errors"])

    def test_authority_switch_required(self):
        x = copy.deepcopy(POINTER)
        x["authority_switch"] = False
        self.assertIn("POINTER_AUTHORITY_SWITCH_NOT_TRUE", assess(MANIFEST, x, DRIVE, ORDER)["errors"])

    def test_repo_promotion_required(self):
        x = copy.deepcopy(POINTER)
        x["migration_promotion"] = False
        self.assertIn("POINTER_REPO_PROMOTION_NOT_TRUE", assess(MANIFEST, x, DRIVE, ORDER)["errors"])

    def test_repo_carrier_first(self):
        x = copy.deepcopy(MANIFEST)
        x["required_order"][0], x["required_order"][1] = x["required_order"][1], x["required_order"][0]
        self.assertIn("REPO_NATIVE_PRECEDENCE_LOST", assess(x, POINTER, DRIVE, ORDER)["errors"])

    def test_missing_carrier(self):
        self.assertIn("MISSING_REQUIRED_CARRIER", assess(MANIFEST, POINTER, DRIVE, ORDER[:-1])["errors"])

    def test_duplicate_carrier(self):
        x = copy.deepcopy(MANIFEST)
        x["required_order"][-1] = REPO_CARRIER
        self.assertIn("REPO_NATIVE_PRECEDENCE_LOST", assess(x, POINTER, DRIVE, ORDER)["errors"])

    def test_drive_history_marker_required_when_snapshot_supplied(self):
        self.assertIn("DRIVE_HISTORY_MARKER_MISSING", assess(MANIFEST, POINTER, "x", ORDER)["errors"])

    def test_drive_role_required_when_snapshot_supplied(self):
        bad = "DRIVE_ACTIVE_WORKING_SOURCE=FALSE\nCURRENT_REPO=xfraggelpower666x/666CLICPRO\n"
        self.assertIn("DRIVE_BACKUP_ROLE_MISSING", assess(MANIFEST, POINTER, bad, ORDER)["errors"])

    def test_drive_cannot_be_active(self):
        x = copy.deepcopy(POINTER)
        x["drive_active_working_source"] = True
        self.assertIn("DRIVE_STILL_ACTIVE_WORKING_SOURCE", assess(MANIFEST, x, DRIVE, ORDER)["errors"])

    def test_history_classification_required(self):
        x = copy.deepcopy(MANIFEST)
        x["currentness_resolution"]["legacy_fields_historical_not_current"] = []
        self.assertIn("HISTORY_NOT_EXPLICITLY_CLASSIFIED", assess(x, POINTER, DRIVE, ORDER)["errors"])

    def test_false_runtime_pass(self):
        x = copy.deepcopy(MANIFEST)
        x["result"] = "VERIFIED"
        self.assertIn("FALSE_STATIC_FULL_PASS", assess(x, POINTER, DRIVE, ORDER)["errors"])

    def test_foreign_identity(self):
        x = copy.deepcopy(MANIFEST)
        x["system"] = "LYVRA"
        self.assertIn("MANIFEST_WRONG_SYSTEM", assess(x, POINTER, DRIVE, ORDER)["errors"])

    def test_conflict_must_fail_closed(self):
        x = copy.deepcopy(MANIFEST)
        x["currentness_resolution"]["on_revision_conflict"] = "IGNORE"
        self.assertIn("NO_FAIL_CLOSED_CONFLICT", assess(x, POINTER, DRIVE, ORDER)["errors"])


if __name__ == "__main__":
    unittest.main()
