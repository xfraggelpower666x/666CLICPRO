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
  if(clicHead!==envelope.source_head)return denied("STALE_SOURCE_HEAD");
  const [sourceFiles,recipientFiles]=await Promise.all([
   readCommitted(fetch,fetchFile,CLIC_REPO,clicHead,[envelope.source_path]),
   readCommitted(fetch,fetchFile,target.repo,recipientHead,[receipt_path])
  ]);
  const source=sourceFiles[envelope.source_path],receiptFile=recipientFiles[receipt_path];
  // Receipt is data, not instructions or native approval.
  const receipt=JSON.parse(receiptFile.content);
  if(receipt.recipient_head!==recipientHead)return denied("RECIPIENT_HEAD_MISMATCH");
  const [latestSource,latestRecipient]=await Promise.all([readHead(fetch,CLIC_REPO,CLIC_BRANCH),readHead(fetch,target.repo,target.branch)]);
  if(latestSource!==clicHead||latestRecipient!==recipientHead)return denied("CONCURRENT_HEAD_CHANGE");
  const result=classifyStarbridgeReceipt(envelope,receipt,{
   recipient_repository_verified:true,receipt_blob_verified:true,source_blob_verified:true
  });
  if(result.status!=="DELIVERED_EVIDENCED")return denied(result.reason??"PROVENANCE_MISMATCH");
  return {status:"DELIVERED_EVIDENCED",delivery_verified:true,adoption_verified:false,host_verified:false,may_mutate_foreign:false,
   handoff_id:envelope.handoff_id,receipt_id:receipt.receipt_id,source_head:clicHead,recipient_head:recipientHead,
   proof_origin:"INJECTED_GITHUB_CONNECTOR_COMMIT_TREE_AND_RECALCULATED_CONTENT_BLOBS",
   source:{repo:CLIC_REPO,path:envelope.source_path,blob_sha:source.sha},
   recipient:{repo:target.repo,path:receipt_path,blob_sha:receiptFile.sha},
   transport_authentication:"HOST_CONNECTOR_AUTHORIZATION_REQUIRED"};
 }catch(e){return denied("READBACK_FAILED:"+String(e?.message??e))}
}
export const STARBRIDGE_NATIVE_TARGETS=targets;
