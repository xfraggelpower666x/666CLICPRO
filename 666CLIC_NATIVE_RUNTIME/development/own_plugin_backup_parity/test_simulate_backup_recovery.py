"""Real local ZIP fixture -> temporary extraction -> content readback tests."""
import hashlib
import json
import pathlib
import tempfile
import unittest
import zipfile
from simulate_backup_recovery import simulate


class RecoverySimulationTests(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.addCleanup(self.t.cleanup)
        self.root = pathlib.Path(self.t.name)
        self.source = self.root / "owned.zip"
        self.entries = {
            "plugin.json": b'{"version":"1.2.3"}',
            ".codex-plugin/plugin.json": b'{"version":"1.2.3"}',
            "assets/icon.bin": bytes(range(256)),
        }
        self.write_zip(self.entries)

    def write_zip(self, data):
        with zipfile.ZipFile(self.source, "w", compression=zipfile.ZIP_DEFLATED) as z:
            for name, content in data.items():
                z.writestr(name, content)
        raw = self.source.read_bytes()
        self.binding = {"owner": "OWN", "plugin_id": "owned", "version": "1.2.3",
                        "release_id": "rel-A", "archive_sha256": hashlib.sha256(raw).hexdigest(),
                        "archive_size_bytes": len(raw),
                        "entry_sha256": {n: hashlib.sha256(v).hexdigest() for n, v in data.items()}}

    def run_sim(self, binding=None, scratch=None):
        return simulate(self.source, self.binding if binding is None else binding,
                        owner="OWN", plugin_id="owned", version="1.2.3",
                        release_id="rel-A", scratch_root=self.root if scratch is None else scratch)

    def test_real_temp_extract_readback(self):
        r = self.run_sim()
        self.assertEqual(r["status"], "LOCAL_TEMP_RESTORE_SIMULATION_PASS_NOT_PRODUCTION")
        self.assertTrue(r["extracted_content_readback"])
        self.assertTrue(r["extracted_manifest_readback"])
        self.assertFalse(r["production_restored"])
        self.assertEqual(r["entries_checked"], 3)

    def test_scratch_removed_after_success(self):
        self.run_sim()
        self.assertFalse(list(self.root.glob("own-restore-probe-*")))

    def test_wrong_archive_digest_blocks(self):
        b = dict(self.binding, archive_sha256="0"*64)
        self.assertEqual(self.run_sim(b)["status"], "SIMULATION_BLOCKED")

    def test_entry_hash_mismatch_blocks(self):
        b = dict(self.binding, entry_sha256=dict(self.binding["entry_sha256"], **{"assets/icon.bin":"f"*64}))
        self.assertEqual(self.run_sim(b)["status"], "SIMULATION_BLOCKED")

    def test_release_drift_blocks(self):
        b = dict(self.binding, release_id="old")
        self.assertEqual(self.run_sim(b)["status"], "SIMULATION_BLOCKED")

    def test_foreign_owner_blocks(self):
        b = dict(self.binding, owner="FOREIGN")
        self.assertEqual(self.run_sim(b)["status"], "SIMULATION_BLOCKED")

    def test_manifest_version_drift_blocks(self):
        data = dict(self.entries, **{"plugin.json": b'{"version":"9.0"}'})
        self.write_zip(data)
        self.assertEqual(self.run_sim()["status"], "SIMULATION_BLOCKED")

    def test_traversal_blocks_and_no_escape(self):
        data = dict(self.entries, **{"../outside.txt": b'no'})
        self.write_zip(data)
        self.assertEqual(self.run_sim()["status"], "SIMULATION_BLOCKED")
        self.assertFalse((self.root / "outside.txt").exists())

    def test_missing_scratch_blocks(self):
        self.assertEqual(self.run_sim(scratch=self.root / "missing")["status"], "SIMULATION_BLOCKED")

    def test_no_productive_mutation(self):
        preserve = self.root / "production.txt"
        preserve.write_bytes(b"PROTECTED")
        self.run_sim()
        self.assertEqual(preserve.read_bytes(), b"PROTECTED")


if __name__ == "__main__":
    unittest.main()
