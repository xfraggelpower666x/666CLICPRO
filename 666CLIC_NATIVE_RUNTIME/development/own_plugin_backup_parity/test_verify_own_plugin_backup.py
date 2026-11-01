"""Isolated offline tests for own-plugin ZIP integrity; no provider or vault access."""
import hashlib
import io
import json
import pathlib
import tempfile
import unittest
import zipfile

from verify_own_plugin_backup import verify

class OwnPluginBackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = pathlib.Path(self.temp.name) / "complete.zip"
        with zipfile.ZipFile(self.path, "w") as z:
            z.writestr("plugin.json", '{"name":"own-plugin","version":"1.2.3"}')
            z.writestr(".codex-plugin/plugin.json", '{"name":"own-plugin","version":"1.2.3"}')
            z.writestr("assets/logo.png", b"ORIGINAL_BINARY_TEST_ONLY")
        raw = self.path.read_bytes()
        self.binding = {
            "plugin_id": "test-own-plugin",
            "version": "1.2.3",
            "release_id": "test-release",
            "archive_sha256": hashlib.sha256(raw).hexdigest(),
            "archive_size_bytes": len(raw),
            "required_paths": ["plugin.json", ".codex-plugin/plugin.json", "assets/logo.png"]
        }

    def test_valid_archive_is_integrity_only(self):
        result = verify(self.path, self.binding)
        self.assertEqual(result["status"], "VERIFIED_ARCHIVE_INTEGRITY_NOT_LIVE_RELEASE_PARITY")

    def test_wrong_hash_fails_closed(self):
        binding = dict(self.binding, archive_sha256="0" * 64)
        self.assertIn("archive_sha256_mismatch", verify(self.path, binding)["errors"])

    def test_wrong_size_fails_closed(self):
        binding = dict(self.binding, archive_size_bytes=42)
        self.assertIn("archive_size_mismatch", verify(self.path, binding)["errors"])

    def test_missing_binary_asset_fails_closed(self):
        binding = dict(self.binding, required_paths=["assets/missing.png"])
        self.assertIn("required_file_missing:assets/missing.png", verify(self.path, binding)["errors"])

    def test_version_mismatch_fails_closed(self):
        binding = dict(self.binding, version="2.0.0")
        self.assertIn("manifest_version_mismatch", verify(self.path, binding)["errors"])

if __name__ == "__main__":
    unittest.main()
