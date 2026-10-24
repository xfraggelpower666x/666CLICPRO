# 666CLIC runtime/plugin-state fingerprint approval governance

Backup approval freshness is bound to a revalidated runtime/plugin-state fingerprint, not to every repository HEAD change.

HEAD_CHANGE != AUTOMATIC_APPROVAL_SUPERSESSION.
APPROVAL_CARRIER_WRITE != RUNTIME_STATE_CHANGE.
ROOT_POINTER_WRITE != RUNTIME_STATE_CHANGE.

Fingerprint inputs include:
- plugin_id
- plugin version
- plugin release_id
- repo text-source tree SHA
- binary binding manifest SHA or not-applicable
- runtime semantic body head
- plugin-current semantic class

A changed or unverifiable fingerprint supersedes approval.
A governance-only HEAD advance may preserve approval only after direct current readback proves the fingerprint unchanged.

The repository HEAD and semantic authority head remain provenance.
The fingerprint is not authority, approval, backup execution or receipt.
Never reuse approval blindly.
