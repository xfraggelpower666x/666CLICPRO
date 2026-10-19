// CLIC-native forced Google connector preflight. Only caller-supplied trusted provider handles.
// Source-only fixtures and historical permissions cannot attest a real host or authorize writes.
// No CLS/PFS/LYVRA/foreign mutation. No automatic execution or credential routing.
import {createHash,randomUUID} from "node:crypto";
const sha=s=>createHash("sha256").update(s,"utf8").digest("hex");
const blocked=(reason,extra={})=>({schema:"CLIC_FORCE_GOOGLE_CONNECTOR_GATE_V1",status:"WRITE_BLOCKED",reason,
 read_verified:false,write_verified:false,restore_verified:false,host_verified:false,
 cas_verified:false,foreign_mutation:false,...extra});
const valid=x=>typeof x==="string"&&x.length>0;
const identity=x=>x&&valid(x.id)&&valid(x.revision)&&typeof x.content==="string"&&valid(x.mimeType);
const same=(a,b)=>a.id===b.id&&a.revision===b.revision&&a.content===b.content&&a.mimeType===b.mimeType;
export async function forceGoogleConnectorGate({provider,scope,live=false}={}){
 // Mandatory independent proof is a host-owned authorization transaction for a CLIC-owned
 // isolated test file. Never accept a caller flag, past receipt, or blanket edit permission.
 if(!provider||typeof provider.read!=="function")return blocked("LIVE_PROVIDER_READ_HANDLE_REQUIRED");
 if(!scope||scope.owner!=="666CLIC"||scope.mode!=="ISOLATED_TEST"||
   !valid(scope.fileId)||!valid(scope.parentId)||!valid(scope.expectedMime))
   return blocked("CLIC_ISOLATED_SCOPE_REQUIRED");
 let before;
 try{
  before=await provider.read(scope.fileId);
  if(!identity(before)||before.id!==scope.fileId||before.parentId!==scope.parentId||
      before.mimeType!==scope.expectedMime)
   return blocked("PROVIDER_READ_OR_SCOPE_INVALID");
  const readback=await provider.read(scope.fileId);
  if(!identity(readback)||!same(before,readback)||readback.parentId!==before.parentId)
    return blocked("PROVIDER_READ_REVISION_UNSTABLE");
 }catch(e){return blocked("PROVIDER_READ_FAILED:"+String(e?.message??e))}
 const readState={read_verified:true,read_revision:before.revision,read_sha256:sha(before.content)};
 if(!live)return blocked("SOURCE_OR_MOCK_RUN_NOT_LIVE_ATTESTATION",readState);
 if(typeof provider.authorizeIsolatedWrite!=="function"||typeof provider.writeIfRevision!=="function"||
    typeof provider.restoreIfRevision!=="function")
   return blocked("INDEPENDENT_AUTHORIZED_WRITE_HANDLES_REQUIRED",readState);
 const nonce=randomUUID(),testContent=before.content+"\nCLIC_CONNECTOR_FORCE_NONCE="+nonce+"\n";
 let permit;
 try{permit=await provider.authorizeIsolatedWrite({fileId:scope.fileId,parentId:scope.parentId,
  owner:"666CLIC",nonce,expectedRevision:before.revision,expectedMime:scope.expectedMime});}
 catch(e){return blocked("WRITE_AUTHORIZATION_FAILED:"+String(e?.message??e),readState)}
 if(!permit||permit.fileId!==scope.fileId||permit.nonce!==nonce||
   permit.parentId!==scope.parentId||permit.expectedRevision!==before.revision||
   permit.authority!=="PROVIDER_AUTHENTICATED"||!valid(permit.proofId))
   return blocked("INDEPENDENT_WRITE_AUTHORITY_NOT_PROVEN",readState);
 let written,after;
 try{
  written=await provider.writeIfRevision({fileId:scope.fileId,expectedRevision:before.revision,
   content:testContent,permit});
  after=await provider.read(scope.fileId);
 }catch(e){return blocked("WRITE_OR_READBACK_FAILED_RECOVERY_REQUIRED:"+String(e?.message??e),
  {...readState,recovery_required:true})}
 if(!identity(after)||after.id!==scope.fileId||after.parentId!==scope.parentId||
   after.mimeType!==before.mimeType||after.content!==testContent||
   after.revision===before.revision||written?.revision!==after.revision)
   return blocked("POSTWRITE_PROVIDER_READBACK_MISMATCH_RECOVERY_REQUIRED",
    {...readState,recovery_required:true});
 // Recovery uses the revision of the observed write. Never restore with an unconditional overwrite.
 try{
  const restored=await provider.restoreIfRevision({fileId:scope.fileId,
   expectedRevision:after.revision,content:before.content,permit});
  const final=await provider.read(scope.fileId);
  if(!identity(final)||final.id!==before.id||final.parentId!==before.parentId||
    final.mimeType!==before.mimeType||final.content!==before.content||
    final.revision===after.revision||restored?.revision!==final.revision)
   return blocked("RECOVERY_READBACK_FAILED_MANUAL_REPAIR_REQUIRED",
    {...readState,write_verified:true,recovery_required:true});
  return {schema:"CLIC_FORCE_GOOGLE_CONNECTOR_GATE_V1",
   status:"PROVIDER_ISOLATED_READ_WRITE_RESTORE_VERIFIED",
   read_verified:true,write_verified:true,restore_verified:true,
   host_verified:false,cas_verified:true,cas_scope:"ISOLATED_TEST_ONLY",
   foreign_mutation:false,authority_proof_id:permit.proofId,
   file_id:scope.fileId,parent_id:scope.parentId,
   pre_revision:before.revision,write_revision:after.revision,restore_revision:final.revision,
   initial_sha256:sha(before.content),restored_sha256:sha(final.content),
   fresh_host_acceptance:"SEPARATE_GATE"};
 }catch(e){return blocked("RECOVERY_FAILED_MANUAL_REPAIR_REQUIRED:"+String(e?.message??e),
   {...readState,write_verified:true,recovery_required:true})}
}
export const GOOGLE_GATE_RULES=Object.freeze({project:"666CLIC",mode:"ISOLATED_TEST_ONLY",
 foreign_writes:false,history_is_not_proof:true,read_is_not_write:true,
 write_is_not_host:true,host_acceptance_separate:true});
