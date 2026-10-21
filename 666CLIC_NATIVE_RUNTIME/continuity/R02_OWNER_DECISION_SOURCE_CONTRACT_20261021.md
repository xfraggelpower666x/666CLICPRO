# CLIC R02 single-account owner-decision contract — source only
STATUS=PROPOSED_SOURCE_VALIDATOR; NOT APPROVED; NOT EXECUTABLE; WRITE_BLOCKED
BASE_HEAD=20a05b32199ffa692892d3f0de60d85e4e91647d
GOVERNANCE_CLASS=SINGLE_ACCOUNT_OWNER_DECISION; OWNER=xfraggelpower666x
NATIVE_APPROVAL_VERIFIED=false; INDEPENDENT_APPROVAL=false
This is a weaker recorded owner decision, NOT a replacement for the CLIC native independent approval requirement. No one may set `native_approval_verified` or `separate_receipt_write_approved` to true based on this decision. The original R02 gate, independent approval readback, and one-time host validator remain unchanged.
The pure function `inspectR02OwnerDecision` validates owner/declaration, exact repository/branch/path/handoff/source commit/blob, receipt SHA-256, expected HEAD, recovery, CAS without force, duplicate/replay, postwrite commit/bytes/readback requirements and preserves WRITE_BLOCKED even for synthetic complete input. All evidence object booleans remain untrusted caller data; no independent attested host exists here.
No R02 receipt, no workflow execution by validator, no governance configuration changes, no foreign changes. Future owner authority requires a separate explicit one-operation approval and independently tested host execution boundary, before any change to WRITE_BLOCKED; ambiguous writes must be reconciled, never blindly retried. SOURCE != INTAKE != DELIVERY != ADOPTION != HOST.
