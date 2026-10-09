import unittest
from rehydration_dependency_audit import REQUIRED, audit_manifest
ROOT="current/REPO_NATIVE_AUTHORITY_AND_RECOVERY.md"
def valid():
    return {"required_order":[ROOT]+[prefix+n for prefix,names in REQUIRED.items() for n in names]}
class RehydrationAuditTests(unittest.TestCase):
    def test_valid_structural_chain(self):
        self.assertEqual(audit_manifest(valid()),[])
    def test_invalid_order_type(self):
        self.assertEqual(audit_manifest({"required_order":"bad"}),["INVALID_ORDER"])
    def test_duplicate_reference(self):
        m=valid();m["required_order"].append(ROOT)
        self.assertIn("DUPLICATE_REFERENCES",audit_manifest(m))
    def test_missing_root(self):
        m=valid();m["required_order"].pop(0)
        self.assertIn("WHOLE_ROOT_NOT_FIRST",audit_manifest(m))
    def test_missing_bridge_state(self):
        m=valid();m["required_order"].remove("facets/repository_bridge/CURRENT_STATE.json")
        self.assertIn("MISSING:facets/repository_bridge/CURRENT_STATE.json",audit_manifest(m))
    def test_facets_must_follow_contract(self):
        m=valid();a=m["required_order"]; x="facets/junior_clic_self_reflection/SUB_REHYDRATION.md";a.remove(x);a.insert(1,x)
        self.assertTrue(any(y.startswith("FACET_BEFORE_CONTRACT:") for y in audit_manifest(m)))
if __name__=="__main__": unittest.main()
