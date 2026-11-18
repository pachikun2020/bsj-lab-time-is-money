import unittest,tempfile,shutil,json,zipfile,hashlib
from pathlib import Path
from unittest.mock import patch
import build_release as release

class ReleaseBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.base=Path(self.tmp.name);self.root=self.base/'source';self.root.mkdir()
        for name in release.ASSETS:shutil.copyfile(release.ROOT/name,self.root/name)
        (self.root/'deploy').mkdir();shutil.copyfile(release.ROOT/'deploy/pages-preview-headers',self.root/'deploy/pages-preview-headers')
        self.root_patch=patch.object(release,'ROOT',self.root);self.root_patch.start()
        self.git_patch=patch.object(release.subprocess,'check_output',return_value='test-revision\n');self.git_patch.start()
    def tearDown(self):self.git_patch.stop();self.root_patch.stop();self.tmp.cleanup()
    def test_private_files_never_enter_zip_and_hashes_match(self):
        (self.root/'.env').write_text('PRIVATE_SENTINEL');(self.root/'review.csv').write_text('PRIVATE_CSV')
        out=self.base/'output';release.build(out)
        with zipfile.ZipFile(out/'time-is-money-preview.zip') as z:
            self.assertNotIn('.env',z.namelist());self.assertNotIn('review.csv',z.namelist())
            self.assertFalse(any('PRIVATE_SENTINEL' in z.read(n).decode(errors='ignore') for n in z.namelist()))
            m=json.loads((out/'manifest.json').read_text())
            for record in m['files']:self.assertEqual(hashlib.sha256(z.read(record['path'])).hexdigest(),record['sha256'])
    def test_asset_symlink_rejected(self):
        (self.base/'private').write_text('PRIVATE_SENTINEL');(self.root/'app.js').unlink();(self.root/'app.js').symlink_to(self.base/'private')
        with self.assertRaises(ValueError):release.build(self.base/'output')
        self.assertFalse((self.base/'output').exists())
    def test_output_inside_source_rejected(self):
        with self.assertRaises(ValueError):release.build(self.root/'output')
    def test_service_worker_mismatch_rejected(self):
        p=self.root/'sw.js';p.write_text(p.read_text().replace("'./countries.js', ",''))
        with self.assertRaises(ValueError):release.build(self.base/'output')
        self.assertFalse((self.base/'output').exists())
    def test_existing_output_not_overwritten(self):
        out=self.base/'output';out.mkdir();(out/'keep').write_text('existing')
        with self.assertRaises(ValueError):release.build(out)
        self.assertEqual((out/'keep').read_text(),'existing')

if __name__=='__main__':unittest.main()
