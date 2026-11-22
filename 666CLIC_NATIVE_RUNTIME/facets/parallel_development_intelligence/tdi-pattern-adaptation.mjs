// R11 CLIC-native interpretation of TDI evidence disciplines.
// Pure advisory projections: no I/O, no global learning promotion, no musical authority.
const sha40 = /^[0-9a-f]{40}$/i;
const sha256 = /^[0-9a-f]{64}$/i;
const str = x => typeof x === 'string' && x.trim().length > 0;
const denied = (reason, status = 'READBACK_PENDING') => ({status, reason, advisory:true, write_authorized:false, host_accepted:false, learning_promoted:false});
const current = x => x?.owner === '666CLIC' && sha40.test(x?.observed_head ?? '') && sha40.test(x?.source_head ?? '') && x.observed_head === x.source_head;

// An interpretation is NOT a measured observation and an edge is NOT proof of causality.
export function assessCounterrelationEvidence(x = {}) {
  if (!current(x) || !str(x.case_id) || !str(x.hypothesis) || !str(x.source_path) || !sha40.test(x.source_blob ?? '')) return denied('PINNED_CLIC_CASE_AND_SOURCE_REQUIRED');
  if (x.foreign_authority || x.foreign_activation) return denied('FOREIGN_AUTHORITY_VIOLATION', 'CONFLICT_QUARANTINE');
  if (x.independent_commit_tree_blob_readback !== true) return denied('INDEPENDENT_SOURCE_READBACK_REQUIRED');
  if (!Array.isArray(x.supporting) || !Array.isArray(x.counterrelations)) return denied('RELATION_SETS_REQUIRED');
  if (x.unresolved_contradiction === true) return { ...denied('CONTRADICTION_REQUIRES_REVIEW', 'CONFLICT_QUARANTINE'), case_id:x.case_id };
  const clean = a => a.filter(y => str(y?.claim) && str(y?.source_ref)).map(y => ({ claim:y.claim, source_ref:y.source_ref, status:'CLAIM_NOT_CAUSAL_PROOF' }));
  return {status:'SCOPED_COUNTERRELATION_PROJECTION',case_id:x.case_id,hypothesis:x.hypothesis,supporting:clean(x.supporting),counterrelations:clean(x.counterrelations),causal_confirmed:false,source_head:x.source_head,write_authorized:false,learning_promoted:false,host_accepted:false};
}

// Keep raw measurements, reviewer interpretations and outcomes in separate evidentiary lanes.
export function assessMeasurementInterpretationBoundary(x = {}) {
  if (!current(x) || !str(x.case_id)) return denied('NATIVE_CASE_REVISION_REQUIRED');
  if (x.foreign_authority || x.foreign_mutation) return denied('FOREIGN_AUTHORITY_VIOLATION', 'CONFLICT_QUARANTINE');
  const m=x.measurement;
  if (!m || !str(m.artifact_id) || !sha256.test(m.artifact_sha256 ?? '') || m.independent_readback !== true) return denied('INDEPENDENT_MEASUREMENT_ARTIFACT_REQUIRED');
  if (x.interpretation?.claim_confirmed === true && (x.interpretation?.review_verified !== true || x.interpretation?.controlled_countercheck !== true)) return denied('UNREVIEWED_CAUSAL_ASSERTION', 'CONFLICT_QUARANTINE');
  return {status:'MEASUREMENT_SEPARATED_FROM_INTERPRETATION',case_id:x.case_id,measurement:{artifact_id:m.artifact_id,sha256:m.artifact_sha256},interpretation:x.interpretation?.hypothesis ?? null,outcome:x.outcome?.observed_effect ?? null,causal_confirmed:false,review_candidate_only:true,write_authorized:false,learning_promoted:false,host_accepted:false};
}

// Native CLIC learning governs actual promotion; this function can never promote.
export function assessReviewBeforeLearning(x = {}) {
  if (!current(x) || !str(x.case_id) || !str(x.outcome_id)) return denied('CURRENT_OUTCOME_CASE_REQUIRED');
  if (x.foreign_memory_mutation === true || x.global_auto_promotion === true) return denied('AUTO_PROMOTION_FORBIDDEN', 'CONFLICT_QUARANTINE');
  if (!sha40.test(x.outcome_blob ?? '') || x.independent_outcome_readback !== true) return denied('OUTCOME_BLOB_READBACK_REQUIRED');
  if (x.outcome_is_newer_valid === false || x.unresolved_contradiction === true) return denied('SUPERSESSION_OR_CONTRADICTION', 'CONFLICT_QUARANTINE');
  if (!str(x.reviewer) || !str(x.review_basis) || !Array.isArray(x.counterchecks) || !x.counterchecks.length || x.counterchecks.some(c => c?.independently_verified !== true)) return denied('INDEPENDENT_COUNTERCHECK_AND_REVIEW_REQUIRED');
  return {status:'CLIC_LOCAL_LEARNING_REVIEW_CANDIDATE',case_id:x.case_id,outcome_id:x.outcome_id,outcome_blob:x.outcome_blob,reviewer:x.reviewer,review_basis:x.review_basis,counterchecks:x.counterchecks.length,requires_existing_clic_promotion_gate:true,learning_promoted:false,write_authorized:false,host_accepted:false};
}
