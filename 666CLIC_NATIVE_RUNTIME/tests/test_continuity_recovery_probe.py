"""Synthetic-only regression fixtures; never read private source archives."""
import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from continuity_recovery_probe import probe, DOMAINS

BASE = {
    'system_id':'666CLIC','current_revision':91,'authority':'GOOGLE_DRIVE',
    'promotion':False,'foreign_mutation':False,
    'domains':{d:{'source':'synthetic_fixture'} for d in DOMAINS},
    'todo':[{'id':'rev91-validation','status':'OPEN'},{'id':'historic','status':'COMPLETED'}],
    'active_work_id':'rev91-validation',
    'temporal_layers':['PRESENT_CURRENT','NEAR_ACTIVE_PAST','DEEP_HISTORICAL_PAST'],
    'reachable':['pointer','work','dev','handoff'],
    'historical_rev79_role':'HISTORICAL_ONLY',
    'p21_historical_closeout':'COMPLETE_CURRENT_SCOPE','p21_functional':'OPEN',
}

class SyntheticContinuityTests(unittest.TestCase):
    def check_error(self, key, change):
        sample=copy.deepcopy(BASE)
        change(sample)
        self.assertIn(key,probe(sample,b'fixture-bytes',b'fixture-bytes')['errors'])
    def test_valid_fixture_only(self):
        x=probe(BASE,b'fixture-bytes',b'fixture-bytes')
        self.assertEqual(x['result'],'PASS_SYNTHETIC_ONLY')
        self.assertEqual(x['runtime'],'NOT_TESTED')
    def test_system_identity(self): self.check_error('IDENTITY_VIOLATION',lambda s:s.update(system_id='LYVRA'))
    def test_revision_conflict(self): self.check_error('AUTHORITY_MISMATCH',lambda s:s.update(current_revision=79))
    def test_promotion_forbidden(self): self.check_error('BOUNDARY_BREACH',lambda s:s.update(promotion=True))
    def test_missing_domain(self): self.check_error('SEVEN_DOMAIN_COVERAGE_MISSING',lambda s:s['domains'].pop('OBLIGATIONS'))
    def test_unknown_todo_state(self): self.check_error('TODO_STATE_INVALID',lambda s:s['todo'][0].update(status='GUESS'))
    def test_active_work_unreachable(self): self.check_error('ACTIVE_WORK_UNREACHABLE',lambda s:s.update(active_work_id='orphan'))
    def test_live_circle_order(self): self.check_error('LIVE_CIRCLE_LAYERS_INVALID',lambda s:s['temporal_layers'].reverse())
    def test_missing_dev_reference(self): self.check_error('KEEP_REACHABLE_UNPROVEN',lambda s:s['reachable'].remove('dev'))
    def test_supersession_cannot_flatten(self): self.check_error('SUPERSESSION_FLATTENING',lambda s:s.update(p21_functional='PASS'))
    def test_fixture_hash_mismatch(self): self.assertIn('FIXTURE_RESTORE_HASH_MISMATCH',probe(BASE,b'a',b'b')['errors'])
    def test_invalid_restore_bytes(self): self.assertIn('INVALID_RESTORE_INPUT',probe(BASE,'a',b'a')['errors'])

if __name__=='__main__': unittest.main()
