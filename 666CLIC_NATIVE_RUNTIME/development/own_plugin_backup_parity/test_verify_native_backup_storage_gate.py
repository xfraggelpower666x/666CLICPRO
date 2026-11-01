import unittest
from verify_native_backup_storage_gate import evaluate

class StorageGateTests(unittest.TestCase):
    def setUp(self):
        self.e={'owner':'CLIC','plugin_id':'plugin_own','version':'1.0','release_id':'rel1','source_release_id':'rel1','backup_path':'backups/plugin_own/rel1.zip','source_sha256':'a'*64,'backup_sha256':'b'*64,'source_bytes_verified':True,'archive_integrity_verified':True,'native_storage_permission_verified':True,'remote_backup_byte_readback_verified':True}
    def test_complete_evidence_only_ready_for_review(self):
        self.assertEqual(evaluate(self.e, owner='CLIC', plugin_id='plugin_own')['status'],'READY_FOR_NATIVE_APPROVAL_REVIEW')
    def test_missing_original_bytes_blocks(self):
        self.e['source_bytes_verified']=False
        self.assertIn('gate_open_source_bytes_verified',evaluate(self.e,owner='CLIC',plugin_id='plugin_own')['errors'])
    def test_foreign_owner_blocks(self):
        self.assertIn('owner_mismatch',evaluate(self.e,owner='PFS',plugin_id='plugin_own')['errors'])
    def test_release_mismatch_blocks(self):
        self.e['source_release_id']='older'
        self.assertIn('release_binding_mismatch',evaluate(self.e,owner='CLIC',plugin_id='plugin_own')['errors'])
    def test_no_remote_byte_readback_blocks(self):
        self.e['remote_backup_byte_readback_verified']=False
        self.assertIn('gate_open_remote_backup_byte_readback_verified',evaluate(self.e,owner='CLIC',plugin_id='plugin_own')['errors'])
    def test_path_traversal_blocks(self):
        self.e['backup_path']='../other-system.zip'
        self.assertIn('unsafe_backup_path',evaluate(self.e,owner='CLIC',plugin_id='plugin_own')['errors'])

if __name__=='__main__':unittest.main()
