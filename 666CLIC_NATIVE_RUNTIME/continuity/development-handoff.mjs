// CLIC-owned pure native handoff lifecycle, no network, mutation or foreign authority.
const VALID_STATES=new Set(["PREPARED","DELIVERED","ACKNOWLEDGED","ADOPTED","HOST_VERIFIED"]);
export function makeDevelopmentHandoff(input={}){
 const id=input.handoff_id, target=input.target, source=input.source;
 if(typeof id!=="string"||!id.trim()||typeof target!=="string"||!target.trim()||typeof source?.head!=="string"||!source.head.trim())return {valid:false,reason:"MISSING_PROVENANCE"};
 if(!Array.isArray(input.source_refs)||!input.source_refs.length||input.source_refs.some(x=>typeof x!=="string"||!x.trim()))return {valid:false,reason:"MISSING_SOURCE_REFS"};
 return {valid:true,handoff:{schema:"CLIC_NATIVE_DEVELOPMENT_HANDOFF_V1",handoff_id:id,target,source,status:"PREPARED",source_refs:[...input.source_refs],requirements:Array.isArray(input.requirements)?[...input.requirements]:[],native_target_decision_required:true,delivery_receipt:null,target_readback:null,foreign_mutation:false}};
}
export function assessHandoffState(h={}){
 if(!VALID_STATES.has(h.status))return {valid:false,reason:"INVALID_STATE"};
 if(h.status==="PREPARED")return {valid:true,status:"PREPARED",delivered:false,adopted:false};
 if(typeof h.delivery_receipt!=="string"||!h.delivery_receipt.trim())return {valid:false,reason:"MISSING_DELIVERY_RECEIPT"};
 if(h.status==="ADOPTED"||h.status==="HOST_VERIFIED"){
  if(typeof h.target_readback!=="string"||!h.target_readback.trim()||h.native_adoption_verified!==true)return {valid:false,reason:"MISSING_NATIVE_TARGET_READBACK"};
 }
 if(h.status==="HOST_VERIFIED"&&(!h.host_evidence||typeof h.host_evidence!=="string"))return {valid:false,reason:"MISSING_HOST_ACCEPTANCE"};
 return {valid:true,status:h.status,delivered:true,adopted:h.status==="ADOPTED"||h.status==="HOST_VERIFIED"};
}
export function nextDevelopmentExchange(x={}){
 const state=assessHandoffState(x.handoff??{});
 if(!state.valid)return {status:"BLOCKED",reason:state.reason,may_auto_mutate_target:false};
 if(state.status==="PREPARED")return {status:"AWAITING_NATIVE_CONSUMER_OR_RECEIPT",next:"VERIFY_TARGET_CONSUMER_AND_WAIT_FOR_REAL_DELIVERY_RECEIPT",may_auto_mutate_target:false};
 if(state.status==="DELIVERED")return {status:"AWAITING_TARGET_ACK",next:"READ_TARGET_NATIVE_RESPONSE",may_auto_mutate_target:false};
 if(state.status==="ACKNOWLEDGED")return {status:"AWAITING_TARGET_NATIVE_DECISION",next:"WAIT_FOR_NATIVE_ADOPTION_OR_REJECTION",may_auto_mutate_target:false};
 return {status:"TARGET_EVIDENCE_AVAILABLE",next:"REVALIDATE_TARGET_CURRENT_THEN_REFRESH_CLIC_CARD",may_auto_mutate_target:false};
}
