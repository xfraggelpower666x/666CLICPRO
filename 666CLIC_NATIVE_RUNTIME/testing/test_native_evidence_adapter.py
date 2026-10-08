import unittest
from native_evidence_adapter import receipt_stage, card_currentness

class AdapterTests(unittest.TestCase):
    def test_no_source(self):
        self.assertEqual(receipt_stage({}), "CONFLICT_QUARANTINE")
    def test_no_receipt(self):
        self.assertEqual(receipt_stage({"source":"CLIC","head":"sha","pointer":"p"}), "PUBLISHED")
    def test_stale_card(self):
        self.assertEqual(card_currentness("old","new","proof"), "STALE_HEAD_CHANGED")
    def test_no_evidence(self):
        self.assertEqual(card_currentness("same","same",""), "PENDING_NATIVE_READ")

if __name__ == "__main__":
    unittest.main()
