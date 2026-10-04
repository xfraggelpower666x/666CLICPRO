"""Offline deterministic unit tests; no remote calls and no runtime acceptance claims."""
import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from rev91_validator import assess, REV91_BRIDGE, REV91_GUARD

ORDER = [REV91_BRIDGE, REV91_GUARD] + [f'history/{i}.md' for i in range(10)]
MANIFEST = {
 'system':'666CLIC','current_source_authority':'GOOGLE_DRIVE_REV91',
 'current_source_evidence':{'clic_revision':90},'required_order': ORDER,'result':'PARTIAL',
 'currentness_resolution':{'effective_source_revision':91,'effective_source':'GOOGLE_DRIVE_CURRENT_POINTER',
  'on_revision_conflict':'CONFLICT_QUARANTINE','legacy_fields_historical_not_current':['current_source_evidence.clic_revision']}
}
POINTER = {'source_authority':'GOOGLE_DRIVE_REV91','native_source_revision_verified':91,'authority_switch':False,'migration_promotion':False}
DRIVE = ('BEGIN_666CLIC_CURRENT_POINTER_REV91\nSYSTEM_ID=666CLIC\nCURRENT_REV=91\n'
         'CURRENT_PRODUCT_AUTHORITY=GOOGLE_DRIVE\nEND_666CLIC_CURRENT_POINTER_REV91')

class GuardTests(unittest.TestCase):
 def test_valid_static(self):
  out=assess(MANIFEST, POINTER, DRIVE, ORDER)
  self.assertEqual(out['result'],'PASS_STATIC_ONLY')
  self.assertEqual(out['runtime_acceptance'],'NOT_TESTED')
 def test_missing_drive_authority(self):
  self.assertEqual(assess(MANIFEST,POINTER,'',ORDER)['result'],'CONFLICT_QUARANTINE')
 def test_stale_manifest(self):
  x=copy.deepcopy(MANIFEST);x['currentness_resolution']['effective_source_revision']=90
  self.assertIn('MANIFEST_STALE_CURRENT',assess(x,POINTER,DRIVE,ORDER)['errors'])
 def test_reversed_required_order(self):
  x=copy.deepcopy(MANIFEST);x['required_order'][:2]=x['required_order'][1::-1]
  self.assertIn('REV91_PRECEDENCE_LOST',assess(x,POINTER,DRIVE,ORDER)['errors'])
 def test_missing_carrier(self):
  self.assertIn('MISSING_REQUIRED_CARRIER',assess(MANIFEST,POINTER,DRIVE,ORDER[:-1])['errors'])
 def test_unauthorized_promotion(self):
  x=copy.deepcopy(POINTER);x['migration_promotion']=True
  self.assertIn('PRODUCTION_PROMOTION_UNAUTHORIZED',assess(MANIFEST,x,DRIVE,ORDER)['errors'])
 def test_history_override(self):
  x=copy.deepcopy(MANIFEST);x['currentness_resolution']['legacy_fields_historical_not_current']=[]
  self.assertIn('HISTORY_NOT_EXPLICITLY_CLASSIFIED',assess(x,POINTER,DRIVE,ORDER)['errors'])
 def test_false_runtime_pass(self):
  x=copy.deepcopy(MANIFEST);x['result']='VERIFIED'
  self.assertIn('FALSE_STATIC_FULL_PASS',assess(x,POINTER,DRIVE,ORDER)['errors'])
 def test_foreign_identity(self):
  x=copy.deepcopy(MANIFEST);x['system']='LYVRA'
  self.assertIn('MANIFEST_WRONG_SYSTEM',assess(x,POINTER,DRIVE,ORDER)['errors'])

if __name__ == '__main__': unittest.main()
