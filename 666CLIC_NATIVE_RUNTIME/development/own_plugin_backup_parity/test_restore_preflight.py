"""Offline restore-preflight tests with genuine locally written ZIP files."""
import copy
import hashlib
import json
import pathlib
import stat
import tempfile
import unittest
import zipfile
from restore_preflight import preflight


class RestorePreflightTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = pathlib.Path(self.temp.name) / "complete.zip"
        self.owner, self.plugin, self.version, self.release = "OWN", "owned_plugin", "1.2.3", "release_A"
        self.entries = {
            "plugin.json": b'{"version":"1.2.3","name":"own"}',
            ".codex-plugin/plugin.json": b'{"version":"1.2.3"}',
            "assets/logo.png": b"real-local-binary-test-fixture",
        }
        self.make_archive(self.entries)

    def make_archive(self, entries, *, symlink=False):
        with zipfile.ZipFile(self.path, "w", compression=zipfile.ZIP_DEFLATED) as z:
            for name, data in entries.items():
                if symlink and name == "assets/logo.png":
                    info = zipfile.ZipInfo(name)
                    info.create_system = 3
                    info.external_attr = (stat.S_IFLNK | 0o777) << 16
                    z.writestr(info, "../../bad")
                else:
                    z.writestr(name, data)
        with zipfile.ZipFile(self.path) as z:
            self.binding = {
                "owner": self.owner, "plugin_id": self.plugin,
                "version": self.version, "release_id": self.release,
                "archive_sha256": hashlib.sha256(self.path.read_bytes()).hexdigest(),
                "archive_size_bytes": self.path.stat().st_size,
                "entry_sha256": {i.filename: hashlib.sha256(z.read(i.filename)).hexdigest() for i in z.infolist()},
            }

    def run_gate(self, binding=None):
        return preflight(self.path, self.binding if binding is None else binding,
                         expected_owner=self.owner, expected_plugin_id=self.plugin,
                         expected_version=self.version, expected_release_id=self.release)

    def test_complete_zip_preflight_succeeds_without_restore_claim(self):
        r = self.run_gate()
        self.assertEqual(r["status"], "LOCAL_RESTORE_PREFLIGHT_PASS_NOT_RESTORED")
        self.assertFalse(r["restored"])
        self.assertFalse(r["remote_backup_readback_verified"])
        self.assertEqual(r["entries_checked"], 3)

    def test_wrong_archive_sha_blocks(self):
        b = copy.deepcopy(self.binding); b["archive_sha256"] = "0" * 64
        self.assertIn("archive_sha256_mismatch", self.run_gate(b)["errors"])

    def test_missing_entry_hash_blocks(self):
        b = copy.deepcopy(self.binding); del b["entry_sha256"]["assets/logo.png"]
        self.assertIn("entry_manifest_coverage_mismatch", self.run_gate(b)["errors"])

    def test_wrong_binary_entry_hash_blocks(self):
        b = copy.deepcopy(self.binding); b["entry_sha256"]["assets/logo.png"] = "f" * 64
        self.assertIn("entry_sha256_mismatch:assets/logo.png", self.run_gate(b)["errors"])

    def test_wrong_release_binding_blocks(self):
        b = copy.deepcopy(self.binding); b["release_id"] = "old_release"
        self.assertIn("binding_release_id_mismatch", self.run_gate(b)["errors"])

    def test_foreign_owner_blocks(self):
        b = copy.deepcopy(self.binding); b["owner"] = "FOREIGN"
        self.assertIn("binding_owner_mismatch", self.run_gate(b)["errors"])

    def test_manifest_version_drift_blocks(self):
        e = dict(self.entries); e["plugin.json"] = b'{"version":"9.9.9"}'
        self.make_archive(e)
        self.assertIn("manifest_version_mismatch:plugin.json", self.run_gate()["errors"])

    def test_traversal_path_blocks(self):
        e = dict(self.entries); e["../escape.txt"] = b"evil"
        self.make_archive(e)
        self.assertIn("unsafe_archive_path", self.run_gate()["errors"])

    def test_symlink_blocks(self):
        self.make_archive(self.entries, symlink=True)
        self.assertIn("non_regular_entry", self.run_gate()["errors"])

    def test_missing_mandatory_manifest_blocks(self):
        e = dict(self.entries); del e[".codex-plugin/plugin.json"]
        self.make_archive(e)
        self.assertIn("mandatory_entry_hash_missing", self.run_gate()["errors"])

    def test_archive_size_mismatch_blocks(self):
        b = copy.deepcopy(self.binding); b["archive_size_bytes"] += 1
        self.assertIn("archive_size_mismatch", self.run_gate(b)["errors"])

    def test_corrupt_archive_does_not_claim_pass(self):
        self.path.write_bytes(self.path.read_bytes()[:-20])
        b = copy.deepcopy(self.binding)
        b["archive_sha256"] = hashlib.sha256(self.path.read_bytes()).hexdigest()
        b["archive_size_bytes"] = self.path.stat().st_size
        self.assertEqual(self.run_gate(b)["status"], "RESTORE_PREFLIGHT_BLOCKED")


if __name__ == "__main__":
    unittest.main()
