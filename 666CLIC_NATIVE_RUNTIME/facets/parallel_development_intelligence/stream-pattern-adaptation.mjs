 // CLIC R08. Existing PDI/continuity/parity/learning engines retain ownership.
// Pure advisory projections: no I/O, background process, network or write authority.
const SHA=/^[0-9a-f]{40}$/i;
const FINGERPRINT=/^[0-9a-f]{64}$/i;
const safeString=x=>typeof x==='string'&&x.trim().length>0;
const denied=(reason,status='READBACK_PENDING')=>({status,reason,executed:false,write_authorized:false,host_accepted:false});

export function assessScopedResume({owner,project_id,chat_scope,checkpoint,observed_head}={}) {
  if(owner!=='666CLIC')return denied('NATIVE_CLIC_OWNER_REQUIRED','WRITE_BLOCKED');
  if(!safeString(project_id)||!safeString(chat_scope)||chat_scope!==project_id)return denied('SCOPE_MISMATCH','CONFLICT_QUARANTINE');
  if(!checkpoint||checkpoint.owner!=='666CLIC'||checkpoint.project_id!==project_id||!safeString(checkpoint.return_anchor)||!SHA.test(checkpoint.source_head??'')||!SHA.test(observed_head??''))return denied('PINNED_CHECKPOINT_REQUIRED');
  if(checkpoint.source_head!==observed_head||checkpoint.superseded===true)return denied('STALE_CHECKPOINT','CONFLICT_QUARANTINE');
  if(checkpoint.direct_readback!==true)return denied('INDEPENDENT_SOURCE_READBACK_REQUIRED');
  return {status:'SCOPED_RESUME_CANDIDATE',project_id,return_anchor:checkpoint.return_anchor,source_head:observed_head,other_project_switched:false,executed:false,write_authorized:false,host_accepted:false};
}

export function assessAdapterParityEvent({owner,event_id,source_commit,semantic_fingerprint,observed_fingerprint,accepted=[],actual_release_id,host_readback=false}={}) {
  if(owner!=='666CLIC'||!safeString(event_id)||!SHA.test(source_commit??'')||!FINGERPRINT.test(semantic_fingerprint??''))return denied('PINNED_CLIC_PARITY_EVENT_REQUIRED');
  if(!FINGERPRINT.test(observed_fingerprint??''))return denied('INDEPENDENT_FINGERPRINT_REQUIRED');
  if(observed_fingerprint!==semantic_fingerprint)return denied('SEMANTIC_FINGERPRINT_CONFLICT','CONFLICT_QUARANTINE');
  if(!Array.isArray(accepted))return denied('ACCEPTED_EVENTS_ARRAY_REQUIRED');
  const matching=accepted.filter(x=>x?.event_id===event_id);
  if(matching.some(x=>x?.semantic_fingerprint!==semantic_fingerprint))return denied('EVENT_ID_REUSED_WITH_DIFFERENT_FINGERPRINT','CONFLICT_QUARANTINE');
  if(matching.length)return {status:'ACKNOWLEDGED_NO_REEMISSION',event_id,write_authorized:false,host_accepted:false};
  return {status:'NATIVE_PARITY_IMPACT_REVIEW_REQUIRED',event_id,source_commit,semantic_fingerprint,release_verified:safeString(actual_release_id)&&host_readback===true,host_accepted:false,executed:false,write_authorized:false};
}

export function assessCausalPromotion({owner,scope,obligation,observed_head,independent_blob_readback=false,host_pass=false}={}) {
  if(owner!=='666CLIC'||!safeString(scope)||!obligation||obligation.project_id!==scope)return denied('CLIC_LOCAL_OBLIGATION_SCOPE_REQUIRED','WRITE_BLOCKED');
  if(!safeString(obligation.id)||!SHA.test(observed_head??'')||!SHA.test(obligation.source_head??''))return denied('OBLIGATION_SOURCE_REVISION_REQUIRED');
  if(obligation.source_head!==observed_head)return denied('SUPERSEDED_OR_STALE_SOURCE','CONFLICT_QUARANTINE');
  if(obligation.state==='ACCEPTED_PENDING_PROMOTION')return {status:'ACCEPTED_PENDING_PROMOTION',may_promote:false,write_authorized:false,host_accepted:false};
  if(obligation.state!=='PROMOTED_CURRENT')return denied('NOT_A_PROMOTION_STATE');
  if(!independent_blob_readback||!SHA.test(obligation.promotion_blob??'')||!safeString(obligation.promotion_receipt))return denied('INDEPENDENT_PROMOTION_READBACK_REQUIRED');
  return {status:'PROMOTION_EVIDENCE_CANDIDATE',source_head:observed_head,promotion_blob:obligation.promotion_blob,host_accepted:host_pass===true,may_promote:false,write_authorized:false,executed:false};
}
