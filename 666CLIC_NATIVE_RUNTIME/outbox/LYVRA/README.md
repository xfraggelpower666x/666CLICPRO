# 666CLIC → LYVRA Outbox

STATUS=READY_FOR_CLIC_RESULTS
AUTHORITY_TRANSFER=FALSE

CLIC may place sanitized analysis results and return handoffs here after a verified LYVRA repository handoff is consumed.

A return handoff must preserve:
- originating handoff_id
- verified LYVRA source_head
- CLIC analysis/result
- evidence/provenance references
- unresolved gates
- authority_transfer = false

LYVRA remains the only decision authority for LYVRA. CLIC output is advisory/forensic input only.
