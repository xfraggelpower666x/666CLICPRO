import unittest
from native_evidence_adapter import junior_review_implementation, reconcile_card, discovery_candidate, repair_assessment

class NativeExtensionTests(unittest.TestCase):
    def test_junior_rejects_unproven_delivery(self):
        self.assertEqual(junior_review_implementation({"source":"CLIC","head":"sha","pointer":"p"}),"UNVERIFIED_CLAIM")
    def test_junior_accepts_complete_fixture_chain(self):
        proof={"source":"CLIC","head":"sha","pointer":"p","receiver_readback":"r","acknowledgement":"a","semantic_evidence":"s","action_evidence":"c","implementation_evidence":"o"}
        self.assertEqual(junior_review_implementation(proof),"SUPPORTED")
    def test_card_change_preserves_history(self):
        card={"verified_head":"old","history":["original"]}
        updated=reconcile_card(card,"new","proof")
        self.assertEqual(updated["currentness"],"STALE_HEAD_CHANGED")
        self.assertEqual(updated["history"],["original"])
        self.assertNotIn("pending_head",card)
    def test_discovery_is_not_verified(self):
        self.assertEqual(discovery_candidate("new","owner","native-source")["currentness"],"UNKNOWN")
    def test_discovery_without_authority_is_blocked(self):
        self.assertEqual(discovery_candidate("new","","source")["status"],"BLOCKED_UNVERIFIED_IDENTITY")
    def test_repair_protects_capabilities(self):
        self.assertEqual(repair_assessment(True,False,True,True),"BLOCK_CAPABILITY_REGRESSION")
    def test_repair_requires_real_outcome(self):
        self.assertEqual(repair_assessment(True,True,True,False),"PENDING_FUNCTIONAL_REAUDIT")

    def test_junior_rejects_incomplete_semantic_chain(self):
        proof={"source":"CLIC","head":"sha","pointer":"p","receiver_readback":"r","acknowledgement":"a"}
        self.assertEqual(junior_review_implementation(proof),"UNVERIFIED_CLAIM")
    def test_card_without_evidence_cannot_be_reverified(self):
        card={"verified_head":"same","history":["earlier"]}
        updated=reconcile_card(card,"same","")
        self.assertEqual(updated["currentness"],"PENDING_NATIVE_READ")
        self.assertEqual(updated["history"],["earlier"])
    def test_repair_cause_without_proportionality_is_blocked(self):
        self.assertEqual(repair_assessment(True,True,False,True),"BLOCK_CAPABILITY_REGRESSION")

if __name__=="__main__": unittest.main()
