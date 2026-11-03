// CLIC-native peer channel semantics. Pure functions: no GitHub API calls or foreign writes.
export const CLIC_LYVRA_CHANNEL=Object.freeze({
 schema:"CLIC_LYVRA_PEER_CHANNEL_V1",
 transport:"GITHUB_REPOSITORY_FILE_REFERENCE",
 producer:{repo:"xfraggelpower666x/666CLICPRO",branch:"clic-migration-rev79-staging",outbox:"666CLIC_NATIVE_RUNTIME/outbox/LYVRA"},
 consumer:{repo:"xfraggelpower666x/LYVRA-Living-Yielding-Vibration-and-Resonance-Architecture",branch:"lyvra",inbox:"LYVRA_NATIVE_RUNTIME/handoffs/666CLIC"},
 return_outbox:"LYVRA_NATIVE_RUNTIME/continuity/development_exchange",
 return_inbox:"666CLIC_NATIVE_RUNTIME/inbox/LYVRA",
 receipt_directory:"666CLIC_NATIVE_RUNTIME/inbox/LYVRA/receipts",
 owner_decision:"LYVRA_ONLY"
});
const sha=/^[0-9a-f]{40}$/i;
const id=/^[A-Za-z0-9][A-Za-z0-9._-]{5,127}$/;
const stages=["PREPARED","DELIVERED","ACKNOWLEDGED","ADOPTED","HOST_VERIFIED"];
export function validatePeerEnvelope(x={}){
 const errors=[];
 if(!id.test(x.handoff_id??""))errors.push("INVALID_HANDOFF_ID");
 if(x.source_system!=="666CLIC"||x.target_system!=="LYVRA")errors.push("WRONG_NATIVE_BOUNDARY");
 if(!sha.test(x.source_head??""))errors.push("SOURCE_HEAD_REQUIRED");
 if(typeof x.source_path!=="string"||!x.source_path.startsWith(CLIC_LYVRA_CHANNEL.producer.outbox+"/")||x.source_path.includes(".."))errors.push("INVALID_SOURCE_PATH");
 if(!stages.includes(x.status))errors.push("INVALID_STAGE");
 if(x.status!=="PREPARED"&&(!sha.test(x.recipient_head??"")||!id.test(x.receipt_id??"")))errors.push("NO_NATIVE_RECIPIENT_RECEIPT");
 if(["ADOPTED","HOST_VERIFIED"].includes(x.status)&&(!sha.test(x.native_readback_head??"")||x.native_adoption_verified!==true))errors.push("NO_NATIVE_ADOPTION_PROOF");
 if(x.status==="HOST_VERIFIED"&&!(typeof x.host_evidence==="string"&&x.host_evidence.trim()))errors.push("NO_HOST_ACCEPTANCE_PROOF");
 return {valid:errors.length===0,errors,status:errors.length?"PARTIAL":x.status};
}
export function reconcilePeerReceipt(envelope={},receipt={}){
 const base=validatePeerEnvelope(envelope);
 if(!base.valid)return {status:"BLOCKED",reason:base.errors,mutation:false};
 if(envelope.status!=="PREPARED")return {status:"NO_TRANSITION",reason:"ALREADY_ADVANCED",mutation:false};
 if(receipt.handoff_id!==envelope.handoff_id||receipt.sender!=="LYVRA"||receipt.recipient!=="666CLIC"||
 !sha.test(receipt.lyvra_head??"")||!id.test(receipt.receipt_id??"")||receipt.source_path!==envelope.source_path)
 return {status:"AWAIT_RECEIPT",reason:"NO_MATCHING_NATIVE_RECEIPT",mutation:false};
 // Evidence must be independently read from recipient repository; caller is responsible for verifying provenance.
 if(receipt.recipient_repository_readback_verified!==true)return {status:"AWAIT_RECEIPT",reason:"RECIPIENT_READBACK_NOT_VERIFIED",mutation:false};
 return {status:"DELIVERED_EVIDENCED",receipt_id:receipt.receipt_id,recipient_head:receipt.lyvra_head,mutation:false,adoption:false};
}
export function peerExchangeNextStep(envelope={},receipt={}){
 const r=reconcilePeerReceipt(envelope,receipt);
 return r.status==="DELIVERED_EVIDENCED"
  ?{next:"WAIT_LYVRA_NATIVE_ACK_OR_DECISION",status:"DELIVERED_EVIDENCED",foreign_mutation:false}
  :{next:"READ_LYVRA_NATIVE_RECEIVER_AND_VERIFIED_RECEIPT",status:r.status,foreign_mutation:false};
}
