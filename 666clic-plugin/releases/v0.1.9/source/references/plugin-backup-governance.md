# 666CLIC plugin backup approval governance
CLIC approves only its own exact plugin release tuples. PFS may execute backup work but may not self-approve CLIC; LYVRA notice never grants CLIC authority.
Approval preflight requires live plugin current, repo plugin current, immutable release snapshot, and semantic parity.
SEMANTIC_AUTHORITY_HEAD = last verified runtime body head before approval publication.
Allowed transaction-tail writes after that body head: APPROVAL_CARRIER then ROOT_POINTER only. Any other post-approval body mutation supersedes the approval.
FOUND_RELEASE != AUTHORIZED_RELEASE; LATEST_RELEASE != AUTHORIZED_RELEASE.
APPROVAL != BACKUP_WRITE; BACKUP_WRITE != READBACK; ONE_LEG_PASS != ROUND_COMPLETE.
Receipt carrier is created only after real executor evidence exists.
Restore bytes enter RECOVERY_CANDIDATE only and require current runtime impact/parity validation. NO_SILENT_PLUGIN_ROLLBACK=true.
