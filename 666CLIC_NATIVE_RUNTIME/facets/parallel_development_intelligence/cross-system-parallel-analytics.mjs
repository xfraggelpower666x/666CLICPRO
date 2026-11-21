// CLIC-owned read-only analytic cooperation. Not a controller, scheduler, transport or writer.
// Inputs must be independently verified by the caller at each native authority.
const SHA=/^[a-f0-9]{40}$/i;
const nonempty=x=>typeof x==="string"&&x.trim().length>0;
const sha=x=>nonempty(x)&&SHA.test(x);
export const ANALYTICS_STATES=Object.freeze(["VERIFIED_EXTERNAL_PATTERN","SOURCE_UNVERIFIED","CONFLICT_QUARANTINE","NOT_RELEVANT"]);
const denied=(reason,extra={})=>({status:"READBACK_PENDING",reason,write_authorized:false,host_accepted:false,...extra});
export function classifyPeerPattern(peer={}){
 if(!nonempty(peer.system)||!nonempty(peer.native_repo)||!nonempty(peer.native_branch)||!sha(peer.current_head)||!sha(peer.source_blob)||!nonempty(peer.source_path)||peer.direct_readback!==true)
  return denied("NATIVE_CURRENT_AND_SOURCE_BLOB_READBACK_REQUIRED",{source_system:peer.system??null});
 if(peer.authority_transfer===true||peer.foreign_identity_copy===true||peer.contradiction_unresolved===true)
  return {status:"CONFLICT_QUARANTINE",reason:"AUTHORITY_OR_PROVENANCE_CONFLICT",write_authorized:false,host_accepted:false};
 if(!nonempty(peer.pattern)||!nonempty(peer.clic_relevance))
  return {status:"NOT_RELEVANT",reason:"NO_CAUSALLY_EXPLAINED_CLIC_VALUE",write_authorized:false,host_accepted:false};
 return {status:"VERIFIED_EXTERNAL_PATTERN",source_system:peer.system,source_head:peer.current_head,
  source_blob:peer.source_blob,source_path:peer.source_path,pattern:peer.pattern,
  clic_relevance:peer.clic_relevance,repair_hypothesis:peer.repair_hypothesis??null,
  visual_compliance:peer.visual_compliance??"UNKNOWN",write_authorized:false,host_accepted:false};
}
export async function analyzePeersReadOnly(peers,reader,{concurrency=3}={}){
 if(!Array.isArray(peers)||!reader||typeof reader!=="function")
  return {status:"READBACK_PENDING",reason:"EXPLICIT_PEERS_AND_READONLY_READER_REQUIRED",results:[],writes:0};
 const unique=[...new Set(peers.filter(nonempty))];
 const width=Math.max(1,Math.min(8,Number.isInteger(concurrency)?concurrency:3));
 const results=new Array(unique.length);
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(width,unique.length)},async()=>{
  while(cursor<unique.length){
   const i=cursor++;
   try{results[i]=classifyPeerPattern(await reader(unique[i]));}
   catch(e){results[i]=denied("READONLY_SOURCE_UNAVAILABLE",{source_system:unique[i],error_type:e?.name??"UNKNOWN"});}
  }
 }));
 return {status:results.every(x=>x.status==="VERIFIED_EXTERNAL_PATTERN"||x.status==="NOT_RELEVANT")?"READONLY_ANALYSIS_COMPLETE":"PARTIAL",
  results,writes:0,deployments:0,foreign_activations:0};
}
export function deriveClicNativeProposal(observation={},scope={}){
 if(observation.status!=="VERIFIED_EXTERNAL_PATTERN")
  return denied("UNVERIFIED_PEER_PATTERN");
 if(scope.target_system!=="666CLIC"||scope.owner!=="WHOLE_666CLIC")
  return {status:"WRITE_BLOCKED",reason:"CLIC_NATIVE_SCOPE_REQUIRED",write_authorized:false};
 if(!nonempty(scope.existing_module)||!nonempty(scope.generalized_principle))
  return denied("EXISTING_MODULE_AND_GENERALIZED_PRINCIPLE_REQUIRED");
 return {status:"CLIC_NATIVE_ADAPTATION_PROPOSED",target_system:"666CLIC",module:scope.existing_module,
  principle:scope.generalized_principle,source_head:observation.source_head,source_blob:observation.source_blob,
  no_identity_copy:true,no_new_controller:true,no_new_router:true,
  plugin_impact:"REVIEW_REQUIRED",visual_impact:"REVIEW_REQUIRED",write_authorized:false,host_accepted:false};
}
export function prepareForeignRepairHandoff(observation={},diagnosis={}){
 if(observation.status!=="VERIFIED_EXTERNAL_PATTERN"||!nonempty(diagnosis.target_system)||
  diagnosis.target_system!==observation.source_system||!nonempty(diagnosis.failure_effect)||
  !nonempty(diagnosis.proposed_minimal_fix)||!nonempty(diagnosis.regression_scope))
  return denied("NATIVE_TARGET_AND_CAUSAL_REPAIR_EVIDENCE_REQUIRED");
 return {status:"CLIC_INFORMATIONAL_REPAIR_PROPOSAL",source_system:"666CLIC",
  target_system:diagnosis.target_system,source_head:observation.source_head,
  source_blob:observation.source_blob,source_path:observation.source_path,
  observed_effect:diagnosis.failure_effect,confirmed_cause:diagnosis.confirmed_cause??null,
  cause_class:diagnosis.confirmed_cause?"CONFIRMED":"HYPOTHESIS",
  proposed_minimal_fix:diagnosis.proposed_minimal_fix,regression_scope:diagnosis.regression_scope,
  target_native_approval_required:true,prepared_not_delivered:true,adoption_verified:false,foreign_write:false};
}
// Independent targets can be prepared in parallel; actual deployment is never authorized by this planner.
export function planParallelDevelopment(work=[]){
 if(!Array.isArray(work))return denied("INVALID_WORKSTREAM_LIST");
 const seen=new Set(),stages=[],blocked=[];
 for(const w of work){
  if(!nonempty(w?.id)||!nonempty(w?.repository)||!nonempty(w?.target_path)||
   !sha(w?.base_head)||!nonempty(w?.return_anchor)||w?.native_scope_verified!==true||
   w?.foreign_write===true){blocked.push({id:w?.id??null,reason:"INCOMPLETE_SCOPE_OR_FOREIGN_WRITE"});continue;}
  const key=w.repository+":"+w.target_path;
  if(seen.has(key)){blocked.push({id:w.id,reason:"SHARED_WRITE_TARGET_SERIALIZE"});continue;}
  seen.add(key);
  stages.push({id:w.id,repository:w.repository,target_path:w.target_path,base_head:w.base_head,
   return_anchor:w.return_anchor,stage:"ISOLATED_PREPARATION",execute:false,deploy:false});
 }
 return {status:blocked.length?"PARTIAL":"ISOLATED_PREPARATION_PLANNED",
  stages,blocked,write_authorized:false,deployments:0,
  rules:["BACKUP_BEFORE_MUTATION","VERIFY_TARGET_LOCK_AND_HEAD","DIRECT_BODY_READBACK",
   "ROOT_POINTER_LAST","NO_POST_POINTER_MUTATION","NO_FOREIGN_WRITE_WITHOUT_NATIVE_TRIGGER"]};
}
export function assessClicLocalLearning(outcome={}){
 if(!nonempty(outcome.case_id)||!sha(outcome.source_head)||!sha(outcome.result_commit)||
  !sha(outcome.result_blob)||outcome.independent_readback!==true||
  !nonempty(outcome.observed_effect))
  return denied("INDEPENDENT_OUTCOME_EVIDENCE_REQUIRED");
 if(outcome.contradiction_unresolved===true||outcome.superseded_by_newer_valid===true)
  return {status:"CONFLICT_QUARANTINE",reason:"CONTRADICTION_OR_SUPERSESSION",learning_promoted:false};
 if(outcome.foreign_memory_mutation===true||outcome.authority_transfer===true)
  return {status:"WRITE_BLOCKED",reason:"LEARNING_AUTHORITY_BOUNDARY",learning_promoted:false};
 return {status:"CLIC_LOCAL_LEARNING_CANDIDATE",case_id:outcome.case_id,
  source_head:outcome.source_head,result_commit:outcome.result_commit,result_blob:outcome.result_blob,
  effect:outcome.observed_effect,learning_promoted:false,requires_native_update:true,
  foreign_memory_mutation:false};
}
