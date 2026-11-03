"""Fresh, actual local ZIP + temporary restore tests; no production interactions."""
import hashlib
import json
import pathlib
import tempfile
import unittest
import zipfile
from validate_restore_receipt_evidence import validate


def sha(x):
    return hashlib.sha256(x).hexdigest()


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.archive = self.root / "local-fixture.zip"
        self.entries = {
            "plugin.json": b'{"version":"3.4.5"}',
            ".codex-plugin/plugin.json": b'{"version":"3.4.5"}',
            "assets/binary.dat": bytes(range(256)),
        }
        self.make_zip()

    def make_zip(self):
        with zipfile.ZipFile(self.archive, "w", zipfile.ZIP_DEFLATED) as z:
            for n, data in self.entries.items():
                z.writestr(n, data)
        raw = self.archive.read_bytes()
        ids = dict(owner="OWN", plugin_id="plugin-1", version="3.4.5", release_id="rel-current")
        self.binding = dict(ids, archive_sha256=sha(raw), archive_size_bytes=len(raw),
                            entry_sha256={n: sha(d) for n, d in self.entries.items()})
        self.receipt = dict(ids, source_release_id="rel-current", backup_release_id="rel-current",
                            live_release_changed_since_binding=False, evidence_scope="SYNTHETIC_LOCAL_ONLY",
                            claims_production_restore=False, claims_remote_backup=False,
                            archive_sha256=sha(raw), archive_size_bytes=len(raw),
                            entry_readback={n: {"sha256": sha(d), "size_bytes": len(d)}
                                            for n, d in self.entries.items()},
                            manifest_versions={n: "3.4.5" for n in sorted(("plugin.json", ".codex-plugin/plugin.json"))})

    def probe(self):
        return validate(self.archive, self.binding, self.receipt,
                        owner="OWN", plugin_id="plugin-1", version="3.4.5",
                        release_id="rel-current", scratch_root=self.root)

    def test_01_real_local_zip_restore_evidence(self):
        r = self.probe()
        self.assertEqual(r["status"], "LOCAL_RESTORE_RECEIPT_REVIEW_ONLY")
        self.assertTrue(r["temporary_restore_readback"])
        self.assertTrue(r["manifest_readback"])
        self.assertEqual(r["entries_checked"], 3)

    def test_02_never_claims_production_backup_or_write(self):
        r = self.probe()
        self.assertFalse(r["production_restored"])
        self.assertFalse(r["remote_backup_verified"])
        self.assertFalse(r["write_authorized"])

    def test_03_cleaned_temp_and_existing_file_preserved(self):
        protected = self.root / "production.txt"
        protected.write_bytes(b"DO-NOT-TOUCH")
        self.probe()
        self.assertEqual(protected.read_bytes(), b"DO-NOT-TOUCH")
        self.assertFalse(list(self.root.glob("restore-receipt-probe-*")))

    def test_04_rejects_stale_release(self):
        self.receipt["backup_release_id"] = "old"
        self.assertIn("stale_receipt_release", self.probe()["errors"])

    def test_05_rejects_foreign_identity(self):
        self.binding["owner"] = "FOREIGN"
        self.assertIn("identity_mismatch:owner", self.probe()["errors"])

    def test_06_rejects_false_readback_sha(self):
        self.receipt["entry_readback"]["assets/binary.dat"]["sha256"] = "f" * 64
        self.assertIn("receipt_entry_readback_mismatch", self.probe()["errors"])

    def test_07_rejects_changed_zip(self):
        self.archive.write_bytes(self.archive.read_bytes() + b"tamper")
        self.assertIn("archive_sha_or_size_mismatch", self.probe()["errors"])

    def test_08_rejects_manifest_drift(self):
        self.entries["plugin.json"] = b'{"version":"4.0.0"}'
        self.make_zip()
        self.assertIn("extracted_manifest_version_mismatch:plugin.json", self.probe()["errors"])

    def test_09_rejects_zip_traversal(self):
        self.entries["../outside.txt"] = b"unsafe"
        self.make_zip()
        self.binding["entry_sha256"]["../outside.txt"] = sha(b"unsafe")
        self.assertIn("unsafe_archive_member", self.probe()["errors"])
        self.assertFalse((self.root / "outside.txt").exists())

    def test_10_rejects_missing_scratch(self):
        r = validate(self.archive, self.binding, self.receipt, owner="OWN",
                     plugin_id="plugin-1", version="3.4.5", release_id="rel-current",
                     scratch_root=self.root / "missing")
        self.assertIn("scratch_root_invalid", r["errors"])

    def test_11_rejects_false_remote_claim(self):
        self.receipt["claims_remote_backup"] = True
        self.assertIn("remote_claim_forbidden", self.probe()["errors"])

    def test_12_rejects_uncertain_release_freshness(self):
        self.receipt["live_release_changed_since_binding"] = None
        self.assertIn("release_freshness_unverified", self.probe()["errors"])


if __name__ == "__main__":
    unittest.main()
