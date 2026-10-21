// CLIC-only source binding for the existing owner Drive mailbox. No provider writes or foreign dispatch.
import {createHash} from "node:crypto";
import {CLIC_MAILBOX,prepareClicMailboxEnvelope} from "./starbridge-owner-mailbox-transport.mjs";
const REPO="xfraggelpower666x/666CLICPRO",BRANCH="clic-migration-rev79-staging";
const SHA=/^[0-9a-f]{40}$/i, txt=x=>typeof x==="string"&&x.trim().length>0;
const unwrap=x=>x?.result??x;
const object=x=>{const v=unwrap(x);return typeof v?.content==="string"&&v?.commit===undefined?JSON.parse(v.content):v};
const blob=s=>{const b=Buffer.from(s,"utf8");return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
const digest=s=>createHash("sha256").update(Buffer.from(s,"utf8")).digest("hex");
const hold=reason=>Object.freeze({status:"HOLD",reason,message_published:false,message_accessible:false,message_observed:false,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false});
const safePath=p=>txt(p)&&p.startsWith("666CLIC_NATIVE_RUNTIME/outbox/")&&!p.includes("\\")&&!p.split("/").includes("..");
async function verifiedSource({github,source_path}){
 if(!github||typeof github.fetch!=="function"||typeof github.fetchFile!=="function")throw Error("GITHUB_HANDLES_REQUIRED");
 if(!safePath(source_path))throw Error("UNSAFE_SOURCE_PATH");
 const h=object(await github.fetch({url:"https://api.github.com/repos/"+REPO+"/branches/"+BRANCH}));
 const head=h?.commit?.sha;if(!SHA.test(head??""))throw Error("HEAD_UNVERIFIED");
 const tr=object(await github.fetch({url:"https://api.github.com/repos/"+REPO+"/git/trees/"+head+"?recursive=1"}));
 if(tr?.truncated!==false||!Array.isArray(tr.tree))throw Error("TREE_INCOMPLETE");
 const entry=tr.tree.find(x=>x.path===source_path&&x.type==="blob");
 if(!SHA.test(entry?.sha??""))throw Error("OUTBOX_BLOB_MISSING");
 const f=unwrap(await github.fetchFile({repository_full_name:REPO,path:source_path,ref:head}));
 if(!txt(f?.content)||f.sha!==entry.sha||blob(f.content)!==entry.sha)throw Error("OUTBOX_BLOB_READBACK_FAILED");
 const handoff=JSON.parse(f.content);
 const recipient=source_path.split("/")[2];
 if(handoff?.source_system!=="666CLIC"||handoff.target_system!==recipient||!txt(handoff.handoff_id))throw Error("OUTBOX_HANDOFF_MISMATCH");
 const h2=object(await github.fetch({url:"https://api.github.com/repos/"+REPO+"/branches/"+BRANCH}));
 if(h2?.commit?.sha!==head)throw Error("HEAD_CHANGED");
 return {head,source_path,blob_sha:entry.sha,handoff,content:f.content};
}
export async function bindVerifiedOutboxToMailbox({github,source_path}={}){
 try{
  const x=await verifiedSource({github,source_path});
  const prepared=prepareClicMailboxEnvelope({handoff_id:x.handoff.handoff_id,source_head:x.head,source_path:x.source_path,target_system:x.handoff.target_system,body:x.content});
  if(prepared.status!=="MESSAGE_PREPARED")return hold("ENVELOPE_FAILED");
  return Object.freeze({...prepared,source_blob_sha:x.blob_sha,source_content_sha256:digest(x.content),
    correlation_key:REPO+":"+x.handoff.handoff_id+":"+x.blob_sha,
    transport_boundary:"SOURCE_VERIFIED_PREPARED_NOT_PUBLISHED",
    message_published:false,message_accessible:false,message_observed:false,
    delivery_verified:false,adoption_verified:false,host_verified:false});
 }catch(e){return hold("SOURCE_READBACK_FAILED:"+String(e?.message??e))}
}
// Inspect an independent reply document using the SAME scoped connector metadata/text conventions.
// A well-formed reply is correspondence evidence, never a native receipt.
export async function correlateMailboxReplyReadback({provider,file_id,outbound}={}){
 if(outbound?.status!=="MESSAGE_PREPARED"||!SHA.test(outbound.source_blob_sha??"")||
  !txt(outbound.handoff_id)||!txt(outbound.correlation_key))return hold("VERIFIED_OUTBOUND_REQUIRED");
 if(!provider||typeof provider.getMetadata!=="function"||typeof provider.readText!=="function"||!txt(file_id))return hold("TRUSTED_REPLY_READ_HANDLES_REQUIRED");
 try{
  const m0=unwrap(await provider.getMetadata(file_id));
  if(m0?.id!==file_id||!Array.isArray(m0.parents)||!m0.parents.includes(CLIC_MAILBOX.folder_id)||
     m0.mimeType!=="application/vnd.google-apps.document"||!txt(m0.drive_revision)||!txt(m0.docs_revision))return hold("REPLY_SCOPE_UNVERIFIED");
  const t0=unwrap(await provider.readText(file_id));
  const m1=unwrap(await provider.getMetadata(file_id));
  const t1=unwrap(await provider.readText(file_id));
  const m2=unwrap(await provider.getMetadata(file_id));
  if(JSON.stringify(m0)!==JSON.stringify(m1)||JSON.stringify(m0)!==JSON.stringify(m2))return hold("REPLY_DRIVE_RACE");
  if(!txt(t0?.content)||t0.file_id!==file_id||t0.docs_revision!==m0.docs_revision||
   t0.representation!=="NORMALIZED_DOCS_PARAGRAPHS"||t1?.file_id!==file_id||t1.docs_revision!==m0.docs_revision||
   t1.representation!==t0.representation||t0.content!==t1.content)return hold("REPLY_DOCS_RACE");
  let reply;try{reply=JSON.parse(t0.content)}catch{return hold("REPLY_NOT_JSON")}
  if(reply?.schema!=="CLIC_STARBRIDGE_MAILBOX_REPLY_V1"||
   reply.reply_to_handoff_id!==outbound.handoff_id||reply.reply_to_source_blob_sha!==outbound.source_blob_sha||
   reply.reply_to_correlation_key!==outbound.correlation_key||!txt(reply.sender)||!txt(reply.message_id)||
   reply.message_id===outbound.handoff_id||reply.claimed_native_receipt||reply.claimed_adoption||reply.claimed_host_pass)
    return hold("REPLY_CORRELATION_MISMATCH");
  return Object.freeze({status:"MESSAGE_OBSERVED",message_published:false,message_accessible:true,message_observed:true,
   delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false,
   reply_to_handoff_id:outbound.handoff_id,reply_message_id:reply.message_id,
   evidence:{file_id,drive_revision:m0.drive_revision,docs_revision:m0.docs_revision,normalized_text_sha256:digest(t0.content),
    source_blob_sha:outbound.source_blob_sha},boundary:"READBACK_OBSERVED_UNAUTHENTICATED_SENDER_NOT_NATIVE_RECEIPT"});
 }catch(e){return hold("REPLY_READBACK_FAILED:"+String(e?.message??e))}
}
export const CLIC_OWNER_MAILBOX_GITHUB_BINDING=Object.freeze({repo:REPO,branch:BRANCH,source:"EXISTING_GITHUB_OUTBOX",
 drive_folder_id:CLIC_MAILBOX.folder_id,writes:false,no_new_router:true,no_foreign_host:true});
