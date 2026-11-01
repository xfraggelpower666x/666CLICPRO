import hashlib
import io
import pathlib
import tarfile
import tempfile
import unittest
from materialize_complete_plugin_zip import materialize

class MaterializationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.source = self.root / 'source.tar.gz'
        self.target = self.root / 'backup.zip'
        with tarfile.open(self.source, 'w:gz') as z:
            for name, data in [('plugin.json', b'{"version":"0.1.22"}'), ('assets/original.png', b'BINARY')]:
                ti = tarfile.TarInfo(name)
                ti.size = len(data)
                z.addfile(ti, io.BytesIO(data))
        self.sha = hashlib.sha256(self.source.read_bytes()).hexdigest()
    def test_complete_materialization_and_disk_readback(self):
        receipt = materialize(self.source, self.target, self.sha)
        self.assertEqual(receipt['entries'], 2)
        self.assertFalse(receipt['remote_backup_readback'])
        self.assertTrue(self.target.is_file())
    def test_wrong_source_hash_blocks(self):
        with self.assertRaisesRegex(ValueError, 'source_tar_sha256_mismatch'):
            materialize(self.source, self.target, '0' * 64)
        self.assertFalse(self.target.exists())
    def test_no_existing_target_overwrite(self):
        self.target.write_bytes(b'preserved')
        with self.assertRaisesRegex(ValueError, 'target_exists_refuse_overwrite'):
            materialize(self.source, self.target, self.sha)
        self.assertEqual(self.target.read_bytes(), b'preserved')
    def test_unsafe_path_blocks(self):
        with tarfile.open(self.source, 'w:gz') as z:
            entry = tarfile.TarInfo('../escape')
            entry.size = 1
            z.addfile(entry, io.BytesIO(b'x'))
        sha = hashlib.sha256(self.source.read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError, 'unsafe_tar_member_path'):
            materialize(self.source, self.target, sha)
    def test_symlink_blocks(self):
        with tarfile.open(self.source, 'w:gz') as z:
            entry = tarfile.TarInfo('link')
            entry.type = tarfile.SYMTYPE
            entry.linkname = 'elsewhere'
            z.addfile(entry)
        sha = hashlib.sha256(self.source.read_bytes()).hexdigest()
        with self.assertRaisesRegex(ValueError, 'non_regular_tar_member_forbidden'):
            materialize(self.source, self.target, sha)

if __name__ == '__main__':
    unittest.main()
