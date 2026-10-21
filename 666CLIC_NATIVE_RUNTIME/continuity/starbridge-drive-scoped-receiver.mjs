// CLIC-owned source-only Drive correspondence inspection. Does not issue native receipts or host PASS.
// Reuses the CLS host-adapter normalization principle without changing the CLS receiver.
import {createHash} from "node:crypto";
const isText=x=>typeof x==="string"&&x.trim().length>0;
const unwrap=x=>x?.result??x;
const sha256=b=>createHash("sha256").update(b).digest("hex");
const gitBlob=b=>createHash("sha1").update(Buffer.from("blob "+b.length+"\\0")).update(b).digest("hex");
const hold=reason=>({status:"HOLD",reason,message_observed:false,native_decision_verified:false,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false});
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function normMeta(x,id){const v=unwrap(x);if(v?.id!==id||!Array.isArray(v.parent_ids)||!isText(v.mime_type))throw Error("INVALID_PROVIDER_METADATA");return {id:v.id,parents:[...v.parent_ids].sort(),mimeType:v.mime_type};}
function normDocs(x,id){const v=unwrap(x);if(v?.documentId!==id||!isText(v.revisionId))throw Error("INVALID_DOCS_REVISION");return v.revisionId;}
function normDrive(x,id){const v=unwrap(x);if(v?.fileId!==id||!isText(v.currentRevisionId))throw Error("INVALID_DRIVE_REVISION");return v.currentRevisionId;}
// These functions must be injected by a trusted host, not sourced from message text.
export function createScopedDriveProviderAdapter(handles){
 if(!handles||["driveMetadata","driveRevisions","docsDocument","docsText"].some(k=>typeof handles[k]!=="function"))throw Error("TRUSTED_PROVIDER_HANDLES_REQUIRED");
 const snapshot=async id=>{const [m,r,d]=await Promise.all([handles.driveMetadata({fileId:id}),handles.driveRevisions({fileId:id,pageSize:100}),handles.docsDocument({document_id:id})]);return {...normMeta(m,id),drive_revision:normDrive(r,id),docs_revision:normDocs(d,id)};};
 return Object.freeze({getMetadata:snapshot,readText:async id=>{
  const [a,b]=await Promise.all([handles.docsText({document_id:id}),handles.docsDocument({document_id:id})]);
  const x=unwrap(a);const revision=normDocs(b,id);
  if(x?.documentId!==id||x.revisionId!==revision||!Array.isArray(x.paragraphs)||x.paragraphs.some(p=>typeof p.text!=="string"))throw Error("DOCS_TEXT_REVISION_MISMATCH");
  return {file_id:id,docs_revision:revision,content:x.paragraphs.map(p=>p.text).join("\\n"),representation:"NORMALIZED_DOCS_PARAGRAPHS"};
 }});
}
// Native target contract: independently read bytes twice from trusted host authority provider.
// Self-declared verified_native_contract is deliberately ignored.
async function nativeTarget(target,authority){
 if(!authority||typeof authority.readNativeContract!=="function")return null;
 if(!target||target.scope!=="CORRESPONDENCE_READ_ONLY"||!isText(target.system_id)||!isText(target.folder_id)||!isText(target.authority_ref)||!Array.isArray(target.allowed_senders)||!target.allowed_senders.length||!isText(target.contract_source_blob)||!/^[a-f0-9]{40}$/.test(target.contract_source_blob))return null;
 const a=unwrap(await authority.readNativeContract(target.authority_ref));
 const b=unwrap(await authority.readNativeContract(target.authority_ref));
 if(!a||!b||a.file_id!==target.authority_ref||b.file_id!==a.file_id||!isText(a.revision)||b.revision!==a.revision||!Buffer.isBuffer(a.bytes)||!Buffer.isBuffer(b.bytes)||!a.bytes.equals(b.bytes)||gitBlob(a.bytes)!==target.contract_source_blob)return null;
 const native=JSON.parse(a.bytes.toString("utf8"));
 if(native.system_id!==target.system_id||native.scope!=="CORRESPONDENCE_READ_ONLY"||native.folder_id!==target.folder_id||!equal(native.allowed_senders,target.allowed_senders)||native.authority_ref!==target.authority_ref||native.status!=="CURRENT_VERIFIED")return null;
 return {system_id:native.system_id,folder_id:native.folder_id,allowed_senders:native.allowed_senders,authority_ref:target.authority_ref,contract_blob:gitBlob(a.bytes),authority_revision:a.revision};
}
export async function inspectScopedDriveMessage({target,source,provider,authority,message_file_id}={}){
 let native;try{native=await nativeTarget(target,authority);}catch{return hold("TARGET_NATIVE_AUTHORITY_READBACK_FAILED")}
 if(!native)return hold("TARGET_NATIVE_CONTRACT_NOT_VERIFIED");
 if(!source||!native.allowed_senders.includes(source.sender)||!isText(source.message_id)||source.message_class!=="PERSONAL_CORRESPONDENCE"||source.claimed_receipt===true||source.claimed_approval===true||source.claimed_host_pass===true)return hold("SOURCE_CLASS_OR_SENDER_UNAUTHORIZED");
 if(!isText(message_file_id)||source.file_id!==message_file_id||source.target_system!==native.system_id)return hold("SOURCE_TARGET_BINDING_MISMATCH");
 if(!provider||typeof provider.getMetadata!=="function"||typeof provider.readText!=="function")return hold("TRUSTED_READ_HANDLES_REQUIRED");
 try{
  const m0=unwrap(await provider.getMetadata(message_file_id));
  if(m0.id!==message_file_id||!Array.isArray(m0.parents)||!m0.parents.includes(native.folder_id)||m0.mimeType!=="application/vnd.google-apps.document"||!isText(m0.drive_revision)||!isText(m0.docs_revision))return hold("DRIVE_PROVIDER_SCOPE_OR_REVISION_UNVERIFIED");
  const t0=unwrap(await provider.readText(message_file_id));
  const m1=unwrap(await provider.getMetadata(message_file_id));
  const t1=unwrap(await provider.readText(message_file_id));
  const m2=unwrap(await provider.getMetadata(message_file_id));
  if(!equal(m0,m1)||!equal(m0,m2))return hold("CONCURRENT_PROVIDER_CHANGE");
  if([t0,t1].some(t=>t?.file_id!==message_file_id||t?.docs_revision!==m0.docs_revision||!isText(t?.content)||t?.representation!=="NORMALIZED_DOCS_PARAGRAPHS")||t0.content!==t1.content)return hold("DOCS_CONTENT_OR_REVISION_UNVERIFIED");
  return {status:"MESSAGE_OBSERVED",message_observed:true,native_decision_verified:false,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false,
   source:{sender:source.sender,message_id:source.message_id,message_class:source.message_class},
   target:{system_id:native.system_id,authority_ref:native.authority_ref,contract_blob:native.contract_blob,authority_revision:native.authority_revision},
   evidence:{file_id:message_file_id,drive_revision:m0.drive_revision,docs_revision:m0.docs_revision,normalized_text_sha256:sha256(Buffer.from(t0.content,"utf8")),hash_scope:"NORMALIZED_DOCS_PARAGRAPHS_NOT_ORIGINAL_DOCS_BYTES"},
   boundary:"CORRESPONDENCE_ONLY_NOT_RECEIPT_NOT_CAS_NOT_HOST_PASS"};
 }catch{return hold("DRIVE_READ_FAILED")}
}
export const SCOPED_DRIVE_RECEIVER_SCOPE=Object.freeze({mode:"READ_ONLY_SOURCE_CANDIDATE",receipts:false,writes:false,auto_dispatch:false,cls_existing_receipt_path_unchanged:true,independent_host_authority:"NOT_VERIFIED"});
