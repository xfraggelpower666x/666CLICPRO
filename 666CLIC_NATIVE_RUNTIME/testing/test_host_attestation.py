import unittest
from evidence_integrity import verify_host_attestation
R={"receiver_system":"CLIC","receiver_receipt_path":"inbox/e.json","receipt_blob_sha":"a"*40}
A={"host_origin_verified":True,"connector_response_bound":True,"repository":"xfraggelpower666x/666CLICPRO",
   "receiver_system":"CLIC","receipt_path":"inbox/e.json","receipt_blob_sha":"a"*40}
REPO="xfraggelpower666x/666CLICPRO"
class HostAttestationTests(unittest.TestCase):
    def test_missing_attestation(self):
        self.assertEqual(verify_host_attestation(R,None,"CLIC",REPO),"HOST_ATTESTATION_PENDING")
    def test_self_report_only(self):
        self.assertEqual(verify_host_attestation(R,dict(A,host_origin_verified=False),"CLIC",REPO),"HOST_ATTESTATION_PENDING")
    def test_unbound_connector(self):
        self.assertEqual(verify_host_attestation(R,dict(A,connector_response_bound=False),"CLIC",REPO),"HOST_ATTESTATION_PENDING")
    def test_wrong_repo(self):
        self.assertEqual(verify_host_attestation(R,A,"CLIC","different/repo"),"REPOSITORY_CONFLICT")
    def test_wrong_receiver(self):
        self.assertEqual(verify_host_attestation(R,A,"OTHER",REPO),"RECEIVER_CONFLICT")
    def test_wrong_blob(self):
        self.assertEqual(verify_host_attestation(R,dict(A,receipt_blob_sha="b"*40),"CLIC",REPO),"BLOB_CONFLICT")
    def test_wrong_path(self):
        self.assertEqual(verify_host_attestation(R,dict(A,receipt_path="wrong"),"CLIC",REPO),"PATH_CONFLICT")
    def test_fixture_fields_do_not_prove_host_origin(self):
        self.assertEqual(verify_host_attestation(R,A,"CLIC",REPO),"HOST_ATTESTATION_FIELDS_MATCH_NOT_AUTHENTICITY_PROOF")
if __name__=="__main__": unittest.main()
