"""Offline, fail-closed native receipt tests: no provider, GitHub, or backup writes."""
import copy
import unittest
from verify_backup_receipt import verify


class ReceiptTests(unittest.TestCase):
    def setUp(self):
        self.r = {
            "owner": "OWN", "plugin_id": "owned_plugin", "version": "1.2.3",
            "release_id": "release_A", "source_release_id": "release_A",
            "backup_release_id": "release_A", "source_archive_sha256": "a" * 64,
            "backup_zip_sha256": "b" * 64, "remote_readback_sha256": "b" * 64,
            "source_archive_bytes": 500, "backup_zip_bytes": 900,
            "remote_readback_bytes": 900, "backup_path": "own-backups/release_A.zip",
            "original_archive_bytes_verified": True, "complete_zip_integrity_verified": True,
            "remote_readback_independent": True, "native_storage_authority_verified": True,
            "live_release_changed_since_binding": False,
        }

    def gate(self, data=None):
        return verify(self.r if data is None else data, owner="OWN",
                      plugin_id="owned_plugin", version="1.2.3", release_id="release_A")

    def test_consistent_receipt_does_not_grant_write(self):
        result = self.gate()
        self.assertEqual(result["status"], "RECEIPT_CONSISTENT_REVIEW_ONLY")
        self.assertFalse(result["write_authorized"])
        self.assertFalse(result["restored"])

    def test_foreign_owner_blocks(self):
        d = copy.deepcopy(self.r); d["owner"] = "FOREIGN"
        self.assertIn("identity_mismatch:owner", self.gate(d)["errors"])

    def test_stale_source_release_blocks(self):
        d = copy.deepcopy(self.r); d["source_release_id"] = "old"
        self.assertIn("source_release_mismatch", self.gate(d)["errors"])

    def test_remote_hash_mismatch_blocks(self):
        d = copy.deepcopy(self.r); d["remote_readback_sha256"] = "c" * 64
        self.assertIn("remote_hash_mismatch", self.gate(d)["errors"])

    def test_remote_size_mismatch_blocks(self):
        d = copy.deepcopy(self.r); d["remote_readback_bytes"] = 899
        self.assertIn("remote_size_mismatch", self.gate(d)["errors"])

    def test_missing_original_archive_bytes_blocks(self):
        d = copy.deepcopy(self.r); d["original_archive_bytes_verified"] = False
        self.assertIn("missing_evidence:original_archive_bytes_verified", self.gate(d)["errors"])

    def test_path_escape_blocks(self):
        d = copy.deepcopy(self.r); d["backup_path"] = "../foreign/archive.zip"
        self.assertIn("unsafe_backup_path", self.gate(d)["errors"])

    def test_freshness_drift_blocks(self):
        d = copy.deepcopy(self.r); d["live_release_changed_since_binding"] = True
        self.assertIn("release_freshness_unverified", self.gate(d)["errors"])

    def test_missing_remote_independence_blocks(self):
        d = copy.deepcopy(self.r); d["remote_readback_independent"] = False
        self.assertIn("missing_evidence:remote_readback_independent", self.gate(d)["errors"])

    def test_boolean_size_blocks(self):
        d = copy.deepcopy(self.r); d["backup_zip_bytes"] = True
        self.assertIn("invalid_bytes:backup_zip_bytes", self.gate(d)["errors"])


if __name__ == "__main__":
    unittest.main()
