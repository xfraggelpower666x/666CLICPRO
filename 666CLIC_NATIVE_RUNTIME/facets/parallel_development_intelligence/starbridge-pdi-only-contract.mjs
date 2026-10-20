// CLIC-owned nonprivileged STARBRIDGE/EVIDENCE proposal guard.
// Pure source validator, NEVER a write authorization, host or CAS executor.
import {validatePdiState,applyPdiEvent} from "./parallel-development.mjs";
export const PDI_ONLY_PATH="666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json";
const REPO="xfraggelpower666x/666CLICPRO",BRANCH="clic-migration-rev79-staging";
const SHA=/^[0-9a-f]{40}$/i;
const PIN=Object.freeze({run_id:39206044536,workflow_id:386131954,run_attempt:1,head_sha:"ed59bb0e8a31e706700efdc055ab353ad454feda",parent_sha:"5fcdb5d050e66f93a50c6be2a6d397bd3292284a",workflow_blob:"ada415502788e74a9cd30b4bd367bea31d2246b4",test_blob:"66d7fcaf1810dc3c2f482f8d1541ad2b0152fd7e"});
const halt=reason=>({status:"WRITE_BLOCKED",reason,source_candidate:false,may_write:false,cas_accepted:false,pdi_persisted:false,host_verified:false,approval_verified:false,pointer_published:false,foreign_mutation:false});
export function validateStarbridgePdiOnlyContract(input={}){
 const {repository,branch,path,origin,source,approval,recovery,cas,pdi_state,event}=input;
 if(repository!==REPO||branch!==BRANCH||path!==PDI_ONLY_PATH)return halt("CLIC_PDI_ONLY_SCOPE_REQUIRED");
 try{validatePdiState(pdi_state)}catch{return halt("INVALID_NATIVE_PDI_STATE")}
 if(!origin||origin.repository!==REPO||origin.run_id!==PIN.run_id||origin.workflow_id!==PIN.workflow_id||origin.run_attempt!==PIN.run_attempt||origin.event!=="push"||origin.head_sha!==PIN.head_sha||origin.actor!=="xfraggelpower666x"||origin.conclusion!=="success")return halt("PINNED_PROVIDER_ORIGIN_UNVERIFIED");
 if(!source||source.head_sha!==PIN.head_sha||source.parent_sha!==PIN.parent_sha||source.workflow_blob!==PIN.workflow_blob||source.test_blob!==PIN.test_blob||source.tree_truncated!==false||source.classification!=="STARBRIDGE_REGRESSION_EXTENSION")return halt("SOURCE_COMMIT_TREE_BLOB_MISMATCH");
 if(event?.stream_id!=="STARBRIDGE"||event?.action!=="EVIDENCE"||event?.source_head!==PIN.head_sha||!event?.evidence_ref||event?.task||event?.obligation||event?.return_anchor)return halt("EVIDENCE_ONLY_NO_TASK_OR_OTHER_STREAM");
 if(!event.event_id||typeof event.event_id!=="string"||!event.event_id.trim())return halt("INDEPENDENT_EVENT_ID_REQUIRED");
 const semantic=`${REPO}:${PIN.head_sha}:STARBRIDGE_REGRESSION_EXTENSION:workflow-and-negative-tests`;
 if(event.semantic_key!==semantic)return halt("SEMANTIC_REPLAY_BINDING_REQUIRED");
 if(pdi_state.processed_event_ids.includes(event.event_id)||pdi_state.processed_event_ids.includes(semantic)||input.existing_semantic_keys?.includes(semantic))return halt("SEMANTIC_OR_EVENT_REPLAY");
 if(input.existing_semantic_keys===undefined||!Array.isArray(input.existing_semantic_keys))return halt("PERSISTED_SEMANTIC_REPLAY_READBACK_REQUIRED");
 if(!SHA.test(cas?.expected_head??"")||!SHA.test(cas?.expected_pdi_blob??"")||cas?.current_head!==cas.expected_head||cas?.current_pdi_blob!==cas.expected_pdi_blob||cas?.target_path!==PDI_ONLY_PATH)return halt("EXPECTED_HEAD_AND_BLOB_CAS_REQUIRED");
 if(!recovery||recovery.head!==cas.expected_head||recovery.readback_verified!==true||!SHA.test(recovery.backup_commit??""))return halt("INDEPENDENT_RECOVERY_READBACK_REQUIRED");
 if(!approval||approval.scope!==PDI_ONLY_PATH||approval.operation!=="STARBRIDGE_EVIDENCE_PDI_ONLY"||approval.expected_head!==cas.expected_head||approval.expected_blob!==cas.expected_pdi_blob||approval.event_id!==event.event_id||approval.semantic_key!==semantic)return halt("EXACT_APPROVAL_SCOPE_REQUIRED");
 // Caller booleans are never independent approval, nonce consumption, CAS or host identity.
 // Readback proof and explicit authorization can only originate from a separate native executor.
 let candidate;
 try{
  candidate=applyPdiEvent(pdi_state,{event_id:event.event_id,stream_id:"STARBRIDGE",action:"EVIDENCE",source_head:PIN.head_sha,evidence_ref:event.evidence_ref},{independent_source_readback:true});
 }catch{return halt("REDUCER_SOURCE_OR_REPLAY_REJECTED")}
 for(const s of pdi_state.streams.filter(s=>s.id!=="STARBRIDGE")){
  if(JSON.stringify(candidate.streams.find(x=>x.id===s.id))!==JSON.stringify(s))return halt("OTHER_WORKSTREAM_CHANGED");
 }
 if(candidate.streams.find(s=>s.id==="STARBRIDGE").status!==pdi_state.streams.find(s=>s.id==="STARBRIDGE").status)return halt("STARBRIDGE_STATUS_PROMOTION_FORBIDDEN");
 return {status:"SOURCE_CANDIDATE_ONLY_AUTHORITY_NOT_INSTALLED",reason:"INDEPENDENT_APPROVER_NONCE_AND_PRIVILEGED_HOST_UNVERIFIED",source_candidate:true,semantic_key:semantic,proposed_event_id:event.event_id,pdi_candidate:candidate,may_write:false,cas_accepted:false,pdi_persisted:false,host_verified:false,approval_verified:false,pointer_published:false,foreign_mutation:false};
}
