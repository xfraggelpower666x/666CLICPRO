import unittest
from evidence_integrity import verify_receipt_shape, junior_delivery_gate

HEAD="a"*40
BLOB="b"*40
R={"source_system":"666CLIC","source_head":HEAD,"source_pointer":"CURRENT_POINTER.json",
   "receiver_system":"TARGET","receiver_head":HEAD,"receiver_receipt_path":"inbox/msg.json",
   "receipt_blob_sha":BLOB}
E={"connector_verified":True,"receiver_system":"TARGET","receiver_head":HEAD,
   "receipt_path":"inbox/msg.json","receipt_blob_sha":BLOB}

class ReceiptIntegrity(unittest.TestCase):
    def test_missing_evidence(self):
        self.assertEqual(verify_receipt_shape({}),"MISSING_EVIDENCE")
    def test_placeholder_sha_rejected(self):
        self.assertEqual(verify_receipt_shape(dict(R,source_head="sha"),E),"INVALID_HEAD")
    def test_only_strings_are_insufficient(self):
        self.assertEqual(verify_receipt_shape(R),"READBACK_PENDING")
    def test_declared_unverified_is_insufficient(self):
        self.assertEqual(verify_receipt_shape(R,dict(E,connector_verified=False)),"READBACK_PENDING")
    def test_wrong_receiver_is_conflict(self):
        self.assertEqual(verify_receipt_shape(R,dict(E,receiver_system="OTHER")),"CONFLICT_QUARANTINE")
    def test_changed_receiver_head_is_stale(self):
        self.assertEqual(verify_receipt_shape(R,dict(E,receiver_head="c"*40)),"STALE_RECEIVER_HEAD")
    def test_wrong_blob_is_conflict(self):
        self.assertEqual(verify_receipt_shape(R,dict(E,receipt_blob_sha="c"*40)),"CONFLICT_QUARANTINE")
    def test_matched_fixture_requires_native_review(self):
        self.assertEqual(junior_delivery_gate(R,E),"ELIGIBLE_FOR_NATIVE_SEMANTIC_REVIEW")
        self.assertNotEqual(junior_delivery_gate(R,E),"IMPLEMENTED_VERIFIED")

if __name__=="__main__": unittest.main()
