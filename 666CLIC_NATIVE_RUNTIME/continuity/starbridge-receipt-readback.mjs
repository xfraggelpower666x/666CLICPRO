// CLIC-owned StarBridge SB04/SB05 read-only receipt binding.
// Reuses the existing StarBridge classifier and the IVI08 git-content hash discipline.
// The host MUST inject authorized fetch/fetchFile connector functions. No network, writes or foreign decisions.
import {createHash} from "node:crypto";
import {classifyStarbridgeReceipt,validateStarbridgeEnvelope} from "./starbridge-evidence.mjs";
const CLIC_REPO="xfraggelpower666x/666CLICPRO",CLIC_BRANCH="clic-migration-rev79-staging";
const SHA=/^[a-f0-9]{40}$/i, REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const targets=Object.freeze({
 LYVRA:Object.freeze({repo:"xfraggelpower666x/LYVRA-Living-Yielding-Vibration-and-Resonance-Architecture",branch:"lyvra"}),
 "666PFS":Object.freeze({repo:"xfraggelpower666x/666PFS_CSM",branch:"main"})
});
const safe=p=>typeof p==="string"&&p.length>0&&!p.startsWith("/")&&!p.includes("\\")&&!p.includes("\0")&&!p.split("/").includes("..");
const unwrap=x=>x?.result??x;
const parse=x=>typeof x==="string"?JSON.parse(x):x;
const fetchBody=x=>{const z=unwrap(x);return parse(z.content??z)};
const fileBody=x=>{const z=unwrap(x);if(typeof z.content!=="string"||!SHA.test(z.sha??""))throw Error("MALFORMED_FILE_READBACK");return z};
const gitBlob=s=>{const b=Buffer.from(s,"utf8");return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
const denied=(reason)=>({status:"AWAIT_RECEIPT",reason,delivery_verified:false,adoption_verified:false,host_verified:false,may_mutate_foreign:false});
async function readHead(fetch,repo,branch){
 const x=fetchBody(await fetch({url:"https://api.github.com/repos/"+repo+"/branches/"+branch}));
 if(!SHA.test(x?.commit?.sha??""))throw Error("INVALID_HEAD");
 return x.commit.sha;
}
async function readCommitted(fetch,fetchFile,repo,head,paths){
 const response=fetchBody(await fetch({url:"https://api.github.com/repos/"+repo+"/git/trees/"+head+"?recursive=1"}));
 if(response?.truncated!==false||!Array.isArray(response.tree))throw Error("INCOMPLETE_TREE");
 const index=new Map(response.tree.filter(x=>x.type==="blob").map(x=>[x.path,x.sha]));
 const results={};
 for(const path of paths){
  if(!safe(path)||!SHA.test(index.get(path)??""))throw Error("MISSING_COMMITTED_BLOB");
  const file=fileBody(await fetchFile({repository_full_name:repo,path,ref:head}));
  if(file.sha!==index.get(path)||gitBlob(file.content)!==index.get(path))throw Error("BLOB_CONTENT_MISMATCH");
  results[path]={content:file.content,sha:file.sha,repository:repo,head};
 }
 return results;
}
export async function bindStarbridgeReceipt({fetch,fetchFile,envelope,receipt_path}={}){
 if(typeof fetch!=="function"||typeof fetchFile!=="function")return denied("TRUSTED_CONNECTOR_REQUIRED");
 if(!validateStarbridgeEnvelope(envelope).valid||envelope.status!=="PREPARED")return denied("INVALID_PREPARED_ENVELOPE");
 const target=targets[envelope.target_system];
 if(!target||envelope.source_system!=="666CLIC"||envelope.source_repository!==CLIC_REPO||
 !envelope.source_path.startsWith("666CLIC_NATIVE_RUNTIME/outbox/"+envelope.target_system+"/")||
 !safe(receipt_path))return denied("INVALID_NATIVE_CHANNEL");
 try{
  const [clicHead,recipientHead]=await Promise.all([readHead(fetch,CLIC_REPO,CLIC_BRANCH),readHead(fetch,target.repo,target.branch)]);
  // An envelope pins a historical immutable source commit. A later pointer/body commit
  // must not invalidate an unchanged source blob; verify both anchored and live trees.
  const [sourceFiles,liveSourceFiles,recipientFiles]=await Promise.all([
   readCommitted(fetch,fetchFile,CLIC_REPO,envelope.source_head,[envelope.source_path]),
   readCommitted(fetch,fetchFile,CLIC_REPO,clicHead,[envelope.source_path]),
   readCommitted(fetch,fetchFile,target.repo,recipientHead,[receipt_path])
  ]);
  const source=sourceFiles[envelope.source_path],liveSource=liveSourceFiles[envelope.source_path],receiptFile=recipientFiles[receipt_path];
  if(source.sha!==liveSource.sha)return denied("STALE_SOURCE_BLOB");
  // Receipt is data, not instructions or native approval.
  const receipt=JSON.parse(receiptFile.content);
  // A receipt cannot safely embed the commit hash of the commit containing itself.\n  // Validate its declared recipient head as SHA; separately report the observed repository HEAD.\n  if(!SHA.test(receipt.recipient_head??""))return denied("INVALID_DECLARED_RECIPIENT_HEAD");
  const [latestSource,latestRecipient]=await Promise.all([readHead(fetch,CLIC_REPO,CLIC_BRANCH),readHead(fetch,target.repo,target.branch)]);
  if(latestSource!==clicHead||latestRecipient!==recipientHead)return denied("CONCURRENT_HEAD_CHANGE");
  const result=classifyStarbridgeReceipt(envelope,receipt,{
   recipient_repository_verified:true,receipt_blob_verified:true,source_blob_verified:true
  });
  if(result.status!=="DELIVERED_EVIDENCED")return denied(result.reason??"PROVENANCE_MISMATCH");
  return {status:"DELIVERED_EVIDENCED",delivery_verified:true,adoption_verified:false,host_verified:false,may_mutate_foreign:false,
   handoff_id:envelope.handoff_id,receipt_id:receipt.receipt_id,source_head:envelope.source_head,observed_source_head:clicHead,recipient_head:recipientHead,receipt_declared_recipient_head:receipt.recipient_head,
   proof_origin:"INJECTED_GITHUB_CONNECTOR_COMMIT_TREE_AND_RECALCULATED_CONTENT_BLOBS",
   source:{repo:CLIC_REPO,path:envelope.source_path,blob_sha:source.sha},
   recipient:{repo:target.repo,path:receipt_path,blob_sha:receiptFile.sha},
   transport_authentication:"HOST_CONNECTOR_AUTHORIZATION_REQUIRED"};
 }catch(e){return denied("READBACK_FAILED:"+String(e?.message??e))}
}
export const STARBRIDGE_NATIVE_TARGETS=targets;


// PFS SB05 uses two native receipts with different schemas from the LYVRA delivery receipt.
// Their existence and integrity are evidence of native READBACK, not a delivery/adoption grant.
export async function inspectPfsSb05NativeReceipts({fetch,fetchFile,envelope}={}){
 const refused=reason=>({...denied(reason),native_receipts_verified:false,readback_verified:false});
 const pfs=targets["666PFS"];
 const readbackPath="handoff/receipts/CLIC-STARBRIDGE-SB05-20261017-01_PFS_READBACK.json";
 const additivePath="handoff/receipts/CLIC-STARBRIDGE-SB05-20261017-01_PFS_ADDITIVE_RECEIPT.json";
 const envelopePath="666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-STARBRIDGE-SB05-20261017-01.json";
 if(typeof fetch!=="function"||typeof fetchFile!=="function")return refused("TRUSTED_CONNECTOR_REQUIRED");
 if(!validateStarbridgeEnvelope(envelope).valid||envelope.status!=="PREPARED"||
    envelope.target_system!=="666PFS"||envelope.source_system!=="666CLIC"||
    envelope.source_repository!==CLIC_REPO||
    envelope.handoff_id!=="CLIC-STARBRIDGE-SB05-20261017-01"||
    envelope.source_path!=="666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-PFS-REPO-MIGRATION-CONTEXT-20261005-01.json")
    return refused("INVALID_SB05_NATIVE_ENVELOPE");
 try{
  const [sourceHead,pfsHead]=await Promise.all([
   readHead(fetch,CLIC_REPO,CLIC_BRANCH),readHead(fetch,pfs.repo,pfs.branch)
  ]);
  const [pinned,live,peer]=await Promise.all([
   readCommitted(fetch,fetchFile,CLIC_REPO,envelope.source_head,[envelope.source_path]),
   readCommitted(fetch,fetchFile,CLIC_REPO,sourceHead,[envelope.source_path,envelopePath]),
   readCommitted(fetch,fetchFile,pfs.repo,pfsHead,[readbackPath,additivePath])
  ]);
  const context=pinned[envelope.source_path],liveContext=live[envelope.source_path];
  const env=live[envelopePath],readback=peer[readbackPath],additive=peer[additivePath];
  if(context.sha!==liveContext.sha)return refused("SOURCE_CONTEXT_SUPERSEDED");
  const committedEnvelope=JSON.parse(env.content);
  if(JSON.stringify(committedEnvelope)!==JSON.stringify(envelope))return refused("ENVELOPE_NE_COMMITTED_SOURCE");
  const rb=JSON.parse(readback.content),ad=JSON.parse(additive.content);
  if(rb.schema!=="PFS_NATIVE_STARBRIDGE_READBACK_RECEIPT_V1"||
     ad.schema!=="PFS_NATIVE_STARBRIDGE_ADDITIVE_RECEIPT_V1"||
     rb.handoff_id!==envelope.handoff_id||ad.handoff_id!==envelope.handoff_id||
     rb.source_system!=="666CLIC"||ad.source_system!=="666CLIC"||
     rb.receiver_system!=="666PFS-CORE-001"||ad.target_system!=="666PFS-CORE-001"||
     rb.source_repository!==CLIC_REPO||
     rb.source_origin_commit!==envelope.source_head||ad.source_head!==envelope.source_head||
     rb.source_context_path!==envelope.source_path||ad.source_path!==envelope.source_path||
     rb.source_context_blob!==context.sha||ad.source_blob!==context.sha||
     rb.source_envelope_path!==envelopePath||ad.envelope_path!==envelopePath||
     rb.source_envelope_blob!==env.sha||ad.envelope_blob!==env.sha||
     ad.previous_receipt_path!==readbackPath||ad.previous_receipt_blob!==readback.sha||
     !SHA.test(rb.source_current_head??"")||!SHA.test(ad.recipient_head??""))
    return refused("SB05_NATIVE_RECEIPT_PROVENANCE_MISMATCH");
  const [afterSource,afterPfs]=await Promise.all([
   readHead(fetch,CLIC_REPO,CLIC_BRANCH),readHead(fetch,pfs.repo,pfs.branch)
  ]);
  if(afterSource!==sourceHead||afterPfs!==pfsHead)return refused("CONCURRENT_HEAD_CHANGE");
  if(rb.delivery_verified!==false||ad.delivery_verified!==false||
     rb.adoption_verified!==false||ad.adoption_verified!==false||
     rb.host_verified!==false||ad.host_verified!==false)
    return refused("UNSUPPORTED_NATIVE_PROMOTION_CLAIM");
  return {status:"NATIVE_SB05_READBACK_EVIDENCED_DELIVERY_PENDING",
   native_receipts_verified:true,readback_verified:true,delivery_verified:false,
   adoption_verified:false,host_verified:false,may_mutate_foreign:false,
   handoff_id:envelope.handoff_id,source_head:sourceHead,recipient_head:pfsHead,
   source_context_blob:context.sha,envelope_blob:env.sha,
   readback_blob:readback.sha,additive_blob:additive.sha,
   reason:"PFS_NATIVE_READBACK_RECEIPTS_ARE_NOT_DELIVERY_OR_ADOPTION_PROOF"};
 }catch(e){return refused("READBACK_FAILED:"+String(e?.message??e))}
}
