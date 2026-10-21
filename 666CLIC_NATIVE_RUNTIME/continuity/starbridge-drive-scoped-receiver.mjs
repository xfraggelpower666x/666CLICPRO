// 666CLIC source-only, read-only scoped Drive message evidence; no foreign authority or delivery promotion.
// CLS native receipt binding remains authoritative and unchanged. This is NOT a generic receipt issuer.
import {createHash} from "node:crypto";
const SHA=/^[a-f0-9]{40}$/i;
const stable=x=>typeof x==="string"&&x.trim().length>0;
const block=reason=>Object.freeze({status:"HOLD",reason,message_observed:false,native_decision_verified:false,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false});
const unwrap=x=>x?.result??x;
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
// Target contract MUST originate from a separately trusted, target-native readback, never a sender message.
export async function inspectScopedDriveMessage({target,source,provider,message_file_id}={}){
 if(!target||target.verified_native_contract!==true||target.scope!=="CORRESPONDENCE_READ_ONLY"||
   !stable(target.system_id)||!stable(target.folder_id)||!stable(target.authority_ref)||
   !Array.isArray(target.allowed_senders)||target.allowed_senders.length===0||
   !stable(target.contract_provenance)||!SHA.test(target.contract_source_blob??""))return block("TARGET_NATIVE_CONTRACT_NOT_VERIFIED");
 if(!source||!stable(source.sender)||!target.allowed_senders.includes(source.sender)||
   !stable(source.message_id)||!stable(source.message_class)||source.message_class!=="PERSONAL_CORRESPONDENCE"||
   source.claimed_receipt===true||source.claimed_approval===true||source.claimed_host_pass===true)return block("SOURCE_CLASS_OR_SENDER_UNAUTHORIZED");
 if(!stable(message_file_id)||!provider||typeof provider.getMetadata!=="function"||typeof provider.readText!=="function")return block("TRUSTED_READ_HANDLES_REQUIRED");
 if(source.file_id!==message_file_id||source.target_system!==target.system_id)return block("SOURCE_TARGET_BINDING_MISMATCH");
 try{
  const first=unwrap(await provider.getMetadata(message_file_id));
  if(first.id!==message_file_id||!Array.isArray(first.parents)||!first.parents.includes(target.folder_id)||
    !["application/vnd.google-apps.document","text/plain"].includes(first.mimeType)||
    !stable(first.revision))return block("DRIVE_PROVIDER_SCOPE_OR_REVISION_UNVERIFIED");
  const body=unwrap(await provider.readText(message_file_id));
  if(body.file_id!==message_file_id||body.revision!==first.revision||!stable(body.content))return block("DRIVE_CONTENT_REVISION_UNVERIFIED");
  const second=unwrap(await provider.getMetadata(message_file_id));
  if(second.id!==first.id||second.revision!==first.revision||second.mimeType!==first.mimeType||
    !Array.isArray(second.parents)||!second.parents.includes(target.folder_id))return block("CONCURRENT_PROVIDER_CHANGE");
  return Object.freeze({status:"MESSAGE_OBSERVED",message_observed:true,native_decision_verified:false,
    delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false,
    source:{sender:source.sender,message_id:source.message_id,message_class:source.message_class},
    target:{system_id:target.system_id,authority_ref:target.authority_ref},
    evidence:{file_id:message_file_id,revision:first.revision,content_sha256:hash(Buffer.from(body.content,"utf8"))},
    boundary:"CORRESPONDENCE_NOT_NATIVE_RECEIPT_OR_HOST_EVIDENCE"});
 }catch{return block("DRIVE_READ_FAILED")}
}
export const SCOPED_DRIVE_RECEIVER_SCOPE=Object.freeze({mode:"READ_ONLY_SOURCE_CANDIDATE",receipts:false,writes:false,auto_dispatch:false,cls_existing_receipt_path_unchanged:true});
