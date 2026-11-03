// Native CLIC StarBridge evidence gates — pure read-only classification; no transport side effects.
const SHA=/^[0-9a-f]{40}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._-]{5,127}$/;
const STAGES=["PREPARED","DELIVERED","ACKNOWLEDGED","ADOPTED","HOST_VERIFIED"];
const SAFE_SYSTEM=/^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/;
export function validateStarbridgeEnvelope(x={}){
 const errors=[];
 if(!ID.test(x.handoff_id??"")) errors.push("INVALID_HANDOFF_ID");
 if(!SAFE_SYSTEM.test(x.source_system??"")||!SAFE_SYSTEM.test(x.target_system??"")||x.source_system===x.target_system) errors.push("INVALID_SYSTEM_BOUNDARY");
 if(!SHA.test(x.source_head??"")) errors.push("INVALID_SOURCE_HEAD");
 if(typeof x.source_path!=="string"||!x.source_path.trim()||x.source_path.startsWith("/")||x.source_path.split("/").includes("..")) errors.push("UNSAFE_SOURCE_PATH");
 if(typeof x.source_repository!=="string"||! /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(x.source_repository)) errors.push("INVALID_SOURCE_REPO");
 if(!STAGES.includes(x.status)) errors.push("INVALID_STATUS");
 if(x.status&&x.status!=="PREPARED"){
   if(!ID.test(x.receipt_id??"")||!SHA.test(x.recipient_head??"")) errors.push("RECEIPT_AND_RECIPIENT_HEAD_REQUIRED");
 }
 if(["ADOPTED","HOST_VERIFIED"].includes(x.status)&&(!SHA.test(x.native_readback_head??"")||x.native_adoption_verified!==true))errors.push("NATIVE_ADOPTION_PROOF_REQUIRED");
 if(x.status==="HOST_VERIFIED"&& !(typeof x.host_evidence==="string"&&x.host_evidence.trim()))errors.push("REAL_HOST_EVIDENCE_REQUIRED");
 return {valid:errors.length===0,errors,stage:x.status??null,may_mutate_foreign:false};
}
export function classifyStarbridgeReceipt(envelope={},receipt={},evidence={}){
 const checked=validateStarbridgeEnvelope(envelope);
 if(!checked.valid)return {status:"BLOCKED",errors:checked.errors,may_mutate_foreign:false};
 if(envelope.status!=="PREPARED")return {status:"NO_TRANSITION",may_mutate_foreign:false};
 if(receipt.handoff_id!==envelope.handoff_id||receipt.source_path!==envelope.source_path||receipt.source_head!==envelope.source_head||receipt.source_system!==envelope.source_system||receipt.target_system!==envelope.target_system||!ID.test(receipt.receipt_id??"")||!SHA.test(receipt.recipient_head??""))
  return {status:"AWAIT_RECEIPT",reason:"RECEIPT_PROVENANCE_MISMATCH",may_mutate_foreign:false};
 // Never trust an unsigned in-envelope claim of provider readback.
 if(evidence.recipient_repository_verified!==true||evidence.receipt_blob_verified!==true||evidence.source_blob_verified!==true)
  return {status:"AWAIT_RECEIPT",reason:"INDEPENDENT_REPOSITORY_READBACK_REQUIRED",may_mutate_foreign:false};
 return {status:"DELIVERED_EVIDENCED",receipt_id:receipt.receipt_id,recipient_head:receipt.recipient_head,adopted:false,host_verified:false,may_mutate_foreign:false};
}
export function reconcileStarbridgeInbox(records=[]){
 const index=new Map(),accepted=[],conflicts=[],duplicates=[];
 for(const row of records){
  const e=validateStarbridgeEnvelope(row);
  if(!e.valid){conflicts.push({handoff_id:row?.handoff_id??null,reason:"INVALID_ENVELOPE",errors:e.errors});continue;}
  const k=row.handoff_id, prior=index.get(k), identity=[row.source_repository,row.source_head,row.source_path,row.source_system,row.target_system].join("|");
  if(prior){
   if(prior===identity)duplicates.push(k);
   else conflicts.push({handoff_id:k,reason:"CONFLICT_QUARANTINE_SOURCE_ID_REUSE"});
   continue;
  }
  index.set(k,identity);accepted.push(k);
 }
 return {accepted,duplicates,conflicts,may_mutate_foreign:false};
}
export function resumeStarbridgeWork(before={},event={}){
 if(typeof before.return_anchor!=="string"||!before.return_anchor.trim()||typeof before.work_scope!=="string"||!before.work_scope.trim())
  return {status:"PARTIAL",reason:"NO_VERIFIED_WORK_ANCHOR",may_mutate_foreign:false};
 if(event.supersession_verified===true&&typeof event.new_return_anchor==="string"&&event.new_return_anchor.trim())
  return {status:"SUPERSEDED_WITH_EVIDENCE",work_scope:before.work_scope,return_anchor:event.new_return_anchor,may_mutate_foreign:false};
 return {status:"RESUME_PRIOR_VERIFIED_WORK",work_scope:before.work_scope,return_anchor:before.return_anchor,may_mutate_foreign:false};
}
