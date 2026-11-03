// CLIC-owned transport-only mailbox binding: GitHub remains the only CLIC Current authority.
// This never issues StarBridge native receipts or adopts target-system changes.
import {createHash} from "node:crypto";
export const CLIC_MAILBOX=Object.freeze({
 schema:"CLIC_STARBRIDGE_OWNER_MAILBOX_TRANSPORT_V1",
 folder_id:"1vMFbTGGKwJXQERgFteCP_ofJmgssSXKs",
 owner:"666CLIC",transport:"GOOGLE_DRIVE_TECHNICAL_ONLY",
 repo_authority:"GITHUB_REPO_CURRENT",family_mailbox:"FORBIDDEN",
 transport_statuses:["MESSAGE_PREPARED","MESSAGE_PUBLISHED","MESSAGE_ACCESSIBLE","MESSAGE_OBSERVED"],
 native_receipt_from_transport:false,adoption_from_transport:false,host_pass_from_transport:false,
 security_note:"LINK_WRITER_ACCESS_PRESENT_USER_ACCEPTED_NOT_PRIVATE_ACL"
});
const sha=/^[a-f0-9]{40}$/i,valid=x=>typeof x==="string"&&x.trim().length>0;
const unwrap=x=>x?.result??x;
const digest=x=>createHash("sha256").update(x).digest("hex");
const hold=reason=>Object.freeze({status:"HOLD",reason,message_accessible:false,message_observed:false,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false});
export function prepareClicMailboxEnvelope({handoff_id,source_head,source_path,target_system,body}={}){
 if(!valid(handoff_id)||!/^[A-Za-z0-9._-]{6,128}$/.test(handoff_id)||!sha.test(source_head??"")||
 !valid(source_path)||!source_path.startsWith("666CLIC_NATIVE_RUNTIME/outbox/")||source_path.includes("..")||
 !valid(target_system)||!valid(body))return hold("INVALID_CLIC_SOURCE_OR_TARGET");
 return Object.freeze({schema:CLIC_MAILBOX.schema,status:"MESSAGE_PREPARED",sender:"666CLIC",target_system,
  handoff_id,source_repo:"xfraggelpower666x/666CLICPRO",source_head,source_path,
  mailbox_folder_id:CLIC_MAILBOX.folder_id,body,content_sha256:digest(Buffer.from(body,"utf8")),
  delivery_verified:false,adoption_verified:false,host_verified:false});
}
export async function inspectClicMailboxDocument({provider,file_id,expected_handoff_id}={}){
 if(!provider||typeof provider.getMetadata!=="function"||typeof provider.readText!=="function")return hold("TRUSTED_PROVIDER_REQUIRED");
 if(!valid(file_id)||!valid(expected_handoff_id))return hold("DOCUMENT_BINDING_REQUIRED");
 try{
  const m0=unwrap(await provider.getMetadata(file_id));
  if(m0?.id!==file_id||!Array.isArray(m0.parents)||!m0.parents.includes(CLIC_MAILBOX.folder_id)||
   m0.mimeType!=="application/vnd.google-apps.document"||!valid(m0.drive_revision)||!valid(m0.docs_revision))return hold("SCOPE_OR_REVISION_UNVERIFIED");
  const t0=unwrap(await provider.readText(file_id));
  const m1=unwrap(await provider.getMetadata(file_id));
  const t1=unwrap(await provider.readText(file_id));
  const m2=unwrap(await provider.getMetadata(file_id));
  const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
  if(!same(m0,m1)||!same(m0,m2))return hold("DRIVE_RACE_OR_MOVE");
  if(!valid(t0?.content)||t0.file_id!==file_id||t0.docs_revision!==m0.docs_revision||
   t1?.file_id!==file_id||t1.docs_revision!==m0.docs_revision||t1.content!==t0.content||
   t0.representation!=="NORMALIZED_DOCS_PARAGRAPHS"||t1.representation!==t0.representation)return hold("DOCS_RACE_OR_CONTENT_CHANGED");
  let msg;try{msg=JSON.parse(t0.content)}catch{return hold("NOT_STRUCTURED_TECHNICAL_MESSAGE")}
  if(msg?.schema!==CLIC_MAILBOX.schema||msg.mailbox_folder_id!==CLIC_MAILBOX.folder_id||
   msg.handoff_id!==expected_handoff_id||msg.sender!=="666CLIC"||
   !sha.test(msg.source_head??"")||!valid(msg.source_path)||!msg.source_path.startsWith("666CLIC_NATIVE_RUNTIME/outbox/")||
   !valid(msg.body)||msg.content_sha256!==digest(Buffer.from(msg.body,"utf8")))return hold("TECHNICAL_MESSAGE_BINDING_MISMATCH");
  if(msg.claimed_native_receipt||msg.claimed_approval||msg.claimed_host_pass)return hold("NATIVE_CLAIM_NOT_TRANSPORT_EVIDENCE");
  return Object.freeze({status:"MESSAGE_ACCESSIBLE",message_accessible:true,message_observed:false,
   delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false,
   evidence:{file_id,folder_id:CLIC_MAILBOX.folder_id,drive_revision:m0.drive_revision,docs_revision:m0.docs_revision,
    normalized_text_sha256:digest(Buffer.from(t0.content,"utf8")),handoff_id:msg.handoff_id},
   boundary:"ACCESSIBLE_NOT_NATIVE_RECEIPT_AND_NOT_FOREIGN_HOST"});
 }catch{return hold("PROVIDER_READBACK_FAILED")}
}
export function interpretMailboxReply({reply,expected_handoff_id}={}){
 if(!reply||reply.reply_to_handoff_id!==expected_handoff_id||!valid(reply.sender)||!valid(reply.message_id)||
 reply.claimed_native_receipt===true||reply.claimed_adoption===true||reply.claimed_host_pass===true)
 return hold("INVALID_REPLY_OR_AUTHORITY_CLAIM");
 return Object.freeze({status:"MESSAGE_OBSERVED",message_observed:true,reply_to_handoff_id:expected_handoff_id,
  message_id:reply.message_id,delivery_verified:false,adoption_verified:false,host_verified:false,
  foreign_mutation:false,boundary:"REPLY_CONTENT_UNAUTHENTICATED_UNTIL_PROVIDER_READBACK"});
}
