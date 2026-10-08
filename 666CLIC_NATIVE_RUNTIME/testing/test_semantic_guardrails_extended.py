"""Negative and positive boundary cases for isolated CLIC evidence gates."""
import unittest
from semantic_guardrails import message_state, junior_claim, card_status, RepairCase, repair_status

class ExtendedClicCases(unittest.TestCase):
    def test_received_not_acknowledged(self):
        self.assertEqual(message_state("ACKNOWLEDGED",received=True), "DELIVERED_VERIFIED")
    def test_semantic_claim_not_acknowledged(self):
        self.assertEqual(message_state("SEMANTICALLY_RECONCILED",received=True,semantically_processed=True), "DELIVERED_VERIFIED")
    def test_action_without_semantics(self):
        self.assertEqual(message_state("ACTION_CLASSIFIED",received=True,acknowledged=True,action_classified=True), "ACKNOWLEDGED")
    def test_outcome_without_delivery(self):
        self.assertEqual(message_state("IMPLEMENTED_VERIFIED",outcome=True), "PUBLISHED")
    def test_full_chain_supported(self):
        self.assertEqual(message_state("IMPLEMENTED_VERIFIED",received=True,acknowledged=True,semantically_processed=True,action_classified=True,outcome=True),"IMPLEMENTED_VERIFIED")
    def test_card_same_head(self):
        self.assertEqual(card_status("abc","abc"),"VERIFIED_AT_HEAD")
    def test_missing_source_is_unknown(self):
        self.assertEqual(card_status("abc",None),"UNKNOWN")
    def test_unproven_cause(self):
        self.assertEqual(repair_status(RepairCase(False,True,False,True)),"BLOCK_UNPROVEN_CAUSE")
    def test_repair_still_needs_functional_check(self):
        self.assertEqual(repair_status(RepairCase(True,True,False,False)),"PENDING_FUNCTIONAL_REAUDIT")
    def test_junior_requires_both_readback_and_runtime(self):
        self.assertEqual(junior_claim("IMPLEMENTED",functional=True),"UNVERIFIED_CLAIM")

if __name__=="__main__": unittest.main()
