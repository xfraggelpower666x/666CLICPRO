import copy
import unittest
from verify_provider_release_origin import verify_origin

class ProviderOriginTests(unittest.TestCase):
    def setUp(self):
        self.receipt = {
            'expected_plugin_id': 'plugins_owned_123',
            'live_metadata': {'plugin_id': 'plugins_owned_123', 'version': '0.1.11', 'current_release_id': 'pluginrel_example'},
            'archive_export': {
                'plugin': {'plugin_id': 'plugins_owned_123', 'version': '0.1.11', 'current_release_id': 'pluginrel_example'},
                'release': {'release_id': 'pluginrel_example', 'version': '0.1.11', 'is_current': True},
                'file_name': 'plugin-export.tar.gz', 'mime_type': 'application/gzip', 'has_download_url': True,
            },
        }
    def test_exact_release_is_metadata_only(self):
        result = verify_origin(self.receipt)
        self.assertEqual(result['status'], 'PROVIDER_RELEASE_EXPORT_BOUND_BYTES_PENDING')
        self.assertFalse(result['original_archive_bytes_readback'])
        self.assertFalse(result['backup_zip_readback'])
    def test_wrong_plugin_identity_blocks(self):
        v=copy.deepcopy(self.receipt);v['archive_export']['plugin']['plugin_id']='another'
        self.assertIn('plugin_identity_mismatch', verify_origin(v)['errors'])
    def test_stale_release_blocks(self):
        v=copy.deepcopy(self.receipt);v['archive_export']['release']['release_id']='old'
        self.assertIn('release_id_mismatch',verify_origin(v)['errors'])
    def test_noncurrent_release_blocks(self):
        v=copy.deepcopy(self.receipt);v['archive_export']['release']['is_current']=False
        self.assertIn('export_release_not_current',verify_origin(v)['errors'])
    def test_version_drift_blocks(self):
        v=copy.deepcopy(self.receipt);v['archive_export']['release']['version']='0.1.10'
        self.assertIn('version_mismatch',verify_origin(v)['errors'])
    def test_url_not_allowed_in_receipt(self):
        v=copy.deepcopy(self.receipt);v['archive_export']['download_url']='https://example.invalid/signed'
        self.assertIn('signed_url_must_not_be_persisted',verify_origin(v)['errors'])
    def test_no_export_blocks(self):
        v=copy.deepcopy(self.receipt);v['archive_export']=None
        self.assertIn('live_metadata_or_archive_export_missing',verify_origin(v)['errors'])

if __name__ == '__main__':
    unittest.main()
