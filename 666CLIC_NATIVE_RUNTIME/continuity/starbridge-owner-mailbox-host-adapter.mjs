// CLIC-owned connector-host adapter for owner-controlled technical StarBridge mailbox.
// Explicit host invocation only. No foreign writes, no native receipt/adoption/host promotion.
import {bindVerifiedOutboxToMailbox,correlateMailboxReplyReadback} from "./starbridge-owner-mailbox-github-binding.mjs";
import {inspectClicMailboxDocument,CLIC_MAILBOX} from "./starbridge-owner-mailbox-transport.mjs";
import {createScopedDriveProviderAdapter} from "./starbridge-drive-scoped-receiver.mjs";
const DOC_MIME="application/vnd.google-apps.document";
const unwrap=x=>x?.result??x;
const valid=x=>typeof x==="string"&&x.trim().length>0;
const stopped=(reason,extra={})=>({status:"HOLD",reason,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false,...extra});
const reject=()=>{throw Error("TRUSTED_CONNECTOR_HANDLES_REQUIRED")};
function readAdapter(drive){
 const keys=["get_file_metadata","list_file_revisions","get_document","get_document_text"];
 if(keys.some(k=>typeof drive?.[k]!=="function"))return null;
 return createScopedDriveProviderAdapter({
 driveMetadata:({fileId})=>drive.get_file_metadata({fileId}),
 driveRevisions:({fileId,pageSize})=>drive.list_file_revisions({fileId,pageSize}),
 docsDocument:({document_id})=>drive.get_document({document_id}),
 docsText:({document_id})=>drive.get_document_text({document_id})
 });
}
function checkHandles(github,drive){
 return !!(github&&typeof github.fetch==="function"&&typeof github.fetchFile==="function"&&
 drive&&["create_file","batch_update_document","update_file","get_file_metadata","list_file_revisions","get_document","get_document_text","list_folder"].every(x=>typeof drive[x]==="function"));
}
async function folderEntries(drive){
 const r=unwrap(await drive.list_folder({url:"https://drive.google.com/drive/folders/"+CLIC_MAILBOX.folder_id,top_k:100}));
 if(!Array.isArray(r?.files))throw Error("MAILBOX_LIST_UNVERIFIED");
 if(r.next_page_token||r.nextPageToken)throw Error("MAILBOX_LIST_NOT_EXHAUSTIVE");
 return r.files;
}
function nameFor(x){return "CLIC_SB_MSG_"+x.handoff_id+"_"+x.source_blob_sha.slice(0,12)}
export async function publishVerifiedClicOutbox({github,drive,source_path,execute=false,approval}={}){
 // A caller boolean is not an approval. Only an independent authenticated verifier may authorize live writes.
 if(!checkHandles(github,drive))return stopped("TRUSTED_CONNECTOR_HANDLES_REQUIRED");
 const source=await bindVerifiedOutboxToMailbox({github,source_path});
 if(source.status!=="MESSAGE_PREPARED")return stopped("SOURCE_UNVERIFIED",{source_reason:source.reason});
 if(execute!==true)return {...source,status:"MESSAGE_PREPARED",publish_invoked:false};
 // Explicit approval verification binds this exact source, target and mailbox; no general write capability.
 if(typeof approval?.verify!=="function")return stopped("INDEPENDENT_APPROVAL_SERVICE_REQUIRED");
 // No independently authenticated host-backed approval provenance exists in the current
 // connector surface. Callback return fields (valid, independentVerifier, proofId) are
 // forgeable by the caller. Likewise no durable pre-create transaction ledger exists.
 // Fail closed BEFORE any provider create/write/move, including purported valid approvals.
 return stopped("HOST_AUTHENTICITY_AND_DURABLE_PRECREATE_RECOVERY_NOT_VERIFIED",{
   publish_invoked:false,provider_writes:0,recovery_state:"NO_TRANSACTION_STARTED",
   approval_trust:"CALLBACK_ASSERTIONS_NOT_AUTHORITY",
   blocked_gates:["HOST_AUTHENTICATED_APPROVAL_PROVENANCE","DURABLE_RECOVERY_PRECREATE_CAS"],
   source_blob_sha:source.source_blob_sha
 });

 let permission;
 try {
   const m=unwrap(await drive.get_file_metadata({fileId:CLIC_MAILBOX.folder_id}));
   if(m?.id!==CLIC_MAILBOX.folder_id||!Array.isArray(m.permissions))
      return stopped("MAILBOX_ACL_UNVERIFIED");
   const worldWrite=m.permissions.some(p=>p?.type==="anyone"&&["writer","owner","organizer","fileOrganizer"].includes(p.role));
   const evidence=unwrap(await approval.verify({operation:"CLIC_OWNER_MAILBOX_PUBLISH",
     source_head:source.source_head,source_blob_sha:source.source_blob_sha,
     handoff_id:source.handoff_id,folder_id:CLIC_MAILBOX.folder_id,
     target_system:source.target_system,world_writable:worldWrite}));
   if(!evidence?.proofId||!evidence?.opaqueReceipt||evidence?.independentVerifier!==true||
      evidence?.valid!==true||evidence?.source_head!==source.source_head||
      evidence?.source_blob_sha!==source.source_blob_sha||evidence?.handoff_id!==source.handoff_id||
      evidence?.folder_id!==CLIC_MAILBOX.folder_id||
      evidence?.target_system!==source.target_system||
      (worldWrite&&evidence?.worldWritableRiskApproved!==true))
      return stopped(worldWrite?"WORLD_WRITER_ACL_UNTRUSTED":"INDEPENDENT_APPROVAL_INVALID");
   permission={proofId:evidence.proofId,worldWrite};
 } catch(e){return stopped("APPROVAL_PREFLIGHT_FAILED:"+String(e?.message??e))}

 let file_id=null,stage="BEFORE_CREATE";
 try{
  const provider=readAdapter(drive);
  const existing=await folderEntries(drive);
  const filename=nameFor(source);
  const candidates=existing.filter(f=>f.title===filename);
  if(candidates.length>1)return stopped("DUPLICATE_MAILBOX_SOURCE",{candidate_count:candidates.length});
  if(candidates.length===1){
   const check=await inspectClicMailboxDocument({provider,file_id:candidates[0].id,expected_handoff_id:source.handoff_id});
   if(check.status!=="MESSAGE_ACCESSIBLE"||check.evidence?.source_blob_sha&&check.evidence.source_blob_sha!==source.source_blob_sha)
    return stopped("EXISTING_MESSAGE_UNVERIFIED",{file_id:candidates[0].id});
   const metadata=unwrap(await drive.get_file_metadata({fileId:candidates[0].id}));
   // Validate original source bytes, not only sender-provided id.
   const t=unwrap(await drive.get_document_text({document_id:candidates[0].id}));
   const msg=JSON.parse(t.paragraphs.map(p=>p.text).join("\n"));
   if(msg.source_blob_sha!==source.source_blob_sha||msg.correlation_key!==source.correlation_key||
      msg.source_head!==source.source_head||msg.source_path!==source.source_path||
      !metadata.parent_ids?.includes(CLIC_MAILBOX.folder_id))
     return stopped("EXISTING_SOURCE_MISMATCH",{file_id:candidates[0].id});
   return {...check,status:"MESSAGE_ACCESSIBLE",reused:true,file_id:candidates[0].id,delivery_verified:false,adoption_verified:false,host_verified:false};
  }
  stage="CREATE";
  const created=unwrap(await drive.create_file({title:filename,mime_type:DOC_MIME}));
  if(!valid(created?.fileId)||created.mimeType!==DOC_MIME)throw Error("CREATE_NOT_CONFIRMED");
  file_id=created.fileId;
  const message={...source,status:"MESSAGE_PREPARED"};
  const body=JSON.stringify(message);
  stage="WRITE";
  const doc=unwrap(await drive.get_document({document_id:file_id}));
  if(!valid(doc?.revisionId))throw Error("DOCS_INITIAL_REVISION_MISSING");
  const written=unwrap(await drive.batch_update_document({document_id:file_id,requests:[{insertText:{location:{index:1},text:body}}],write_control:{requiredRevisionId:doc.revisionId}}));
  if(!valid(written?.revisionId)||written.revisionId===doc.revisionId)throw Error("DOCS_WRITE_REVISION_UNVERIFIED");
  stage="MOVE";
  const meta=unwrap(await drive.get_file_metadata({fileId:file_id}));
  if(!Array.isArray(meta.parent_ids)||meta.parent_ids.length!==1)throw Error("SOURCE_PARENT_AMBIGUOUS");
  const moved=unwrap(await drive.update_file({fileId:file_id,addParents:CLIC_MAILBOX.folder_id,removeParents:meta.parent_ids[0]}));
  if(moved?.success!==true||!moved.parent_ids?.includes(CLIC_MAILBOX.folder_id))throw Error("MOVE_UNVERIFIED");
  stage="READBACK";
  const checked=await inspectClicMailboxDocument({provider,file_id,expected_handoff_id:source.handoff_id});
  if(checked.status!=="MESSAGE_ACCESSIBLE")throw Error("DOUBLE_READBACK_"+(checked.reason??"FAILED"));
  const text=unwrap(await drive.get_document_text({document_id:file_id}));
  const saved=JSON.parse(text.paragraphs.map(p=>p.text).join("\n"));
  if(saved.source_blob_sha!==source.source_blob_sha||saved.correlation_key!==source.correlation_key||
   saved.source_path!==source.source_path||saved.source_head!==source.source_head)
    throw Error("PUBLISHED_SOURCE_BINDING_MISMATCH");
  // Recheck source at latest HEAD after external provider operations to prevent stale publication PASS.
  const fresh=await bindVerifiedOutboxToMailbox({github,source_path});
  if(fresh.status!=="MESSAGE_PREPARED"||fresh.source_head!==source.source_head||
     fresh.source_blob_sha!==source.source_blob_sha)throw Error("SOURCE_HEAD_OR_BLOB_CHANGED");
  return {...checked,status:"MESSAGE_ACCESSIBLE",file_id,published:true,approval_proof_id:permission.proofId,
    mailbox_world_writable:permission.worldWrite,receipt_trust:"NOT_NATIVE_RECEIPT",source_blob_sha:source.source_blob_sha,
   correlation_key:source.correlation_key,delivery_verified:false,adoption_verified:false,host_verified:false};
 }catch(e){return stopped("PUBLISH_"+stage+"_FAILED:"+String(e?.message??e),{file_id,stage,recovery:"INSPECT_FILE_BEFORE_RETRY_NO_BLIND_DUPLICATE"})}
}
export async function inspectSeparateClicReply({github,drive,source_path,reply_file_id}={}){
 if(!github||typeof github.fetch!=="function"||typeof github.fetchFile!=="function")return stopped("GITHUB_HANDLES_REQUIRED");
 const p=readAdapter(drive);if(!p)return stopped("DRIVE_READ_HANDLES_REQUIRED");
 const source=await bindVerifiedOutboxToMailbox({github,source_path});
 if(source.status!=="MESSAGE_PREPARED")return stopped("SOURCE_UNVERIFIED");
 return correlateMailboxReplyReadback({provider:p,file_id:reply_file_id,outbound:source});
}
export const CLIC_OWNER_MAILBOX_HOST=Object.freeze({mode:"EXPLICIT_HOST_INJECTION_ONLY",drive_folder_id:CLIC_MAILBOX.folder_id,repo_first:true,foreign_writes:false,receipt_promotion:false,background_dispatch:false});
