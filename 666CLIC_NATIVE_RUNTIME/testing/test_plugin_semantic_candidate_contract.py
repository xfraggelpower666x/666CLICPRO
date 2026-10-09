"""Contract checks for the uninstalled mainline plugin adapter candidate."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
CANDIDATE = ROOT / "plugin_candidates/mainline_semantic_parity/CLIC_RUNTIME_INTEGRATION_SKILL.md"

class CandidateSemantics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.body = CANDIDATE.read_text(encoding="utf-8")

    def test_explicit_uninstalled_status(self):
        self.assertIn("STATUS=STAGING_CANDIDATE_NOT_INSTALLED", self.body)
        self.assertIn("PLUGIN_RELEASE=NOT_PUBLISHED", self.body)

    def test_whole_first_and_direct_user_trigger(self):
        self.assertIn("direct native 666CLIC command", self.body)
        self.assertIn("Whole CLIC from fresh GitHub current pointer", self.body)

    def test_no_new_authority_or_controller(self):
        for phrase in ("one CLIC identity", "No router, second controller or foreign activation"):
            self.assertIn(phrase, self.body)

    def test_receipt_semantics(self):
        for phrase in ("Published does not mean delivered", "Acknowledged does not mean semantically accepted",
                       "independently verified target-native outcome"):
            self.assertIn(phrase, self.body)

    def test_untrusted_attestation_rejected(self):
        self.assertIn("cannot authenticate its own connector origin", self.body)

    def test_no_self_authorizing_bridge(self):
        for phrase in ("No bridge-written root pointer", "live plugin release or worker deployment"):
            self.assertIn(phrase, self.body)

    def test_junior_no_independent_identity(self):
        self.assertIn("without decision authority or independent identity", self.body)

    def test_card_freshness_and_negative_evidence(self):
        for phrase in ("counterevidence and contradictions", "mark affected assertions stale"):
            self.assertIn(phrase, self.body)

    def test_no_fake_native_operational_success(self):
        self.assertIn("UNIT_TEST_PASS != NATIVE_OPERATIONAL_PASS", self.body)

    def test_release_has_independent_gates(self):
        for phrase in ("native receipt provenance", "source parity", "logo/binary fingerprint",
                       "release-specific backup approval"):
            self.assertIn(phrase, self.body)

if __name__ == "__main__":
    unittest.main()
