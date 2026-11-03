# LYVRA → 666CLIC Inbox

STATUS=READY_FOR_EXTERNAL_HANDOFF
AUTHORITY_TRANSFER=FALSE

This directory is the CLIC-owned landing boundary for sanitized LYVRA repository handoffs.

A valid CURRENT.json must identify at minimum:
- handoff_id
- source_system = LYVRA
- source_repo
- source_branch
- source_head
- created_at
- affected_facets
- relation_delta
- analysis_request
- supersedes (nullable)
- authority_transfer = false

CLIC must independently verify the declared LYVRA source HEAD before processing.
No LYVRA mutation is authorized by this inbox.
A manually pasted chat handoff does not become a repository handoff automatically.
