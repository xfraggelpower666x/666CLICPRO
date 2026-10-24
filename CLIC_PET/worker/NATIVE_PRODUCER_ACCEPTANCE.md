# CLIC + Junior Native Producer Acceptance Gate
STATUS=SOURCE_ONLY_PURE_PREFLIGHT
IDENTITY=ONE_SHARED_CLIC_JUNIOR_PET
OWNER=WHOLE_666CLIC
NO_SECOND_AUTHORITY=true
PRODUCER_STATUS=NOT_BOUND
JUNIOR_NATIVE_SOURCE=UNVERIFIED
TRUSTED_PRODUCTION_KEYS=NOT_BOUND
CLOUDFLARE_DURABLE_BUDGET_LIVE=NOT_VERIFIED
WORKER_DEPLOYMENT=NOT_PERFORMED
PET_APP_VISUAL_HOST_ACCEPTANCE=NOT_PERFORMED
SOURCE=src/native-producer-gate.mjs
TESTS=tests/native-producer-gate.test.mjs
SIGNATURE_VERIFIER=src/verified-events.mjs
BUDGET_AND_COOLDOWN=src/github-budget.mjs|src/github-transport.mjs
NO_BACKGROUND_POLLING=true
NO_CROSS_SYSTEM_AUTO_ACTIVATION=true
NO_FOREIGN_MUTATION=true

This preflight is a pure prerequisite checker. It does not discover a Junior repository,
connect producer keys, validate live signer custody, publish signed events, approve
foreign native authority, deploy a worker or mutate any native system.
Never equate fixture test success to real provider/worker/Junior readback.
Joint events require separately proven joint native authority; no actor spoofing.
Unknowns stay BLOCKED. Owner-native and host tests must verify the actual deployment.
