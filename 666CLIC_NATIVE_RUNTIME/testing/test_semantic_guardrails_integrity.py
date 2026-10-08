"""Contract integrity cases beyond the original twenty-two staging tests."""
import unittest
from semantic_guardrails import message_state, junior_claim, card_status, RepairCase, repair_status

class EvidenceIntegrity(unittest.TestCase):
    def test_missing_ack_stops_semantics(self):
        self.assertEqual(message_state("SEMANTICALLY_RECONCILED",received=True,semantically_processed=True),"DELIVERED_VERIFIED")
    def test_missing_action_classification_stops_outcome(self):
        self.assertEqual(message_state("IMPLEMENTED_VERIFIED",received=True,acknowledged=True,semantically_processed=True,outcome=True),"SEMANTICALLY_RECONCILED")
    def test_repair_unproven_even_with_successful_output(self):
        self.assertEqual(repair_status(RepairCase(False,True,False,True)),"BLOCK_UNPROVEN_CAUSE")
    def test_repair_tech_pass_ne_override_restriction(self):
        self.assertEqual(repair_status(RepairCase(True,True,True,True)),"BLOCK_CAPABILITY_REGRESSION")
    def test_card_cannot_verify_without_evidence(self):
        self.assertEqual(card_status(None,None),"UNKNOWN")
    def test_junior_not_fooled_by_only_functional_claim(self):
        self.assertEqual(junior_claim("IMPLEMENTED",False,True),"UNVERIFIED_CLAIM")

if __name__=="__main__":
    unittest.main()
