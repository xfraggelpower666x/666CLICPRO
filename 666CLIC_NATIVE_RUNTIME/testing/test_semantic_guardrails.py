import unittest
from semantic_guardrails import message_state, junior_claim, card_status, RepairCase, repair_status

class Guardrails(unittest.TestCase):
    def test_no_false_delivery(self):
        self.assertEqual(message_state("DELIVERED_VERIFIED"), "PUBLISHED")
    def test_no_false_implementation(self):
        self.assertEqual(junior_claim("IMPLEMENTED", readback=True), "UNVERIFIED_CLAIM")
    def test_stale_card(self):
        self.assertEqual(card_status("old","new"), "STALE_HEAD_CHANGED")
    def test_restrictive_repair_rejected(self):
        self.assertEqual(repair_status(RepairCase(True,False,True,True)), "BLOCK_CAPABILITY_REGRESSION")
    def test_receipt_not_execution(self):
        self.assertEqual(message_state("IMPLEMENTED_VERIFIED",received=True,acknowledged=True), "ACKNOWLEDGED")
    def test_repair_approval_is_not_execution(self):
        self.assertEqual(repair_status(RepairCase(True,True,False,True)), "ELIGIBLE_FOR_NATIVE_REVIEW")
    def test_semantics_need_independent_proof(self):
        self.assertEqual(message_state("SEMANTICALLY_RECONCILED",received=True,acknowledged=True), "ACKNOWLEDGED")
    def test_action_requires_classification_proof(self):
        self.assertEqual(message_state("ACTION_CLASSIFIED",received=True,acknowledged=True,semantically_processed=True), "SEMANTICALLY_RECONCILED")
    def test_outcome_requires_separate_evidence(self):
        self.assertEqual(message_state("IMPLEMENTED_VERIFIED",received=True,acknowledged=True,semantically_processed=True,action_classified=True), "ACTION_CLASSIFIED")
    def test_full_chain_requires_all_proofs(self):
        self.assertEqual(message_state("IMPLEMENTED_VERIFIED",received=True,acknowledged=True,semantically_processed=True,action_classified=True,outcome=True), "IMPLEMENTED_VERIFIED")
    def test_no_unknown_message_state(self):
        with self.assertRaises(ValueError): message_state("MAGIC")
    def test_missing_card_head_is_unknown(self):
        self.assertEqual(card_status(None,"new"), "UNKNOWN")

if __name__=="__main__": unittest.main()
