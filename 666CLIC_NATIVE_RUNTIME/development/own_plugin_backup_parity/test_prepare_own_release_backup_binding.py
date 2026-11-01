"""Offline tests: no provider or vault calls."""
import hashlib
import pathlib
import tempfile
import unittest
import zipfile
from prepare_own_release_backup_binding import prepare
from verify_own_plugin_backup import verify

class OwnReleaseBindingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.zip = pathlib.Path(self.tmp.name)/'full.zip'
        with zipfile.ZipFile(self.zip, 'w') as z:
            z.writestr('plugin.json', '{"version":"1.2.3"}')
            z.writestr('.codex-plugin/plugin.json', '{"version":"1.2.3"}')
        self.readback = {'plugin_id':'own-only','version':'1.2.3','current_release_id':'release-example'}

    def test_proposes_binding_and_verifier_accepts_integrity(self):
        b = prepare(self.zip, self.readback)
        self.assertEqual(verify(self.zip, b)['status'], 'VERIFIED_ARCHIVE_INTEGRITY_NOT_LIVE_RELEASE_PARITY')
        self.assertFalse(b['provider_full_archive_origin_verified'])

    def test_rejects_stale_version(self):
        with self.assertRaisesRegex(ValueError, 'manifest_version_mismatch'):
            prepare(self.zip, dict(self.readback, version='0.0.1'))

    def test_requires_exact_current_release_field(self):
        with self.assertRaisesRegex(ValueError, 'missing_or_invalid_creator_readback'):
            prepare(self.zip, dict(plugin_id='own-only', version='1.2.3'))

    def test_rejects_missing_manifest(self):
        with zipfile.ZipFile(self.zip, 'w') as z:
            z.writestr('plugin.json','{"version":"1.2.3"}')
        with self.assertRaisesRegex(ValueError, 'full_plugin_manifest_missing'):
            prepare(self.zip, self.readback)

if __name__ == '__main__':
    unittest.main()
