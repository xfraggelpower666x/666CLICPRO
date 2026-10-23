// CLIC-owned GitHub Contents CAS adapter; injected authenticated GitHub connector only.
// Transport factory never grants authority. No background mutation or root pointer write.
import {CLIC_LEDGER_PATH} from "./development-ledger-store.mjs";
import {createHash} from "node:crypto";
const SHA=/^[a-f0-9]{40}$/i;
const valid=x=>typeof x==="string"&&SHA.test(x);
const failure=(reason)=>({cas_accepted:false,reason});
const pick=x=>x?.result??x;

const OWNER="xfraggelpower666x/666CLICPRO";
const BRANCH="clic-migration-rev79-staging";
const blobSha=text=>{const bytes=Buffer.from(text,"utf8");return createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");};
/** Independent GitHub source reads, never a caller-supplied verified Boolean. */
export async function verifyClicPdiEventOrigin({event,github,repository=OWNER,branch=BRANCH,processed_event_ids=[]}={}){
 const deny=reason=>({status:"SOURCE_UNVERIFIED",reason,verified:false,evidence_ref_verified:false,
  source_revision:event?.source_revision??null,event_write_authorized:false});
 if(repository!==OWNER||branch!==BRANCH||!event||!valid(event.source_revision)||
  typeof event.event_id!=="string"||!event.event_id.trim()||
  typeof event.evidence_ref!=="string"||!event.evidence_ref.startsWith("666CLIC_NATIVE_RUNTIME/")||
  event.evidence_ref.includes("..")||!Array.isArray(processed_event_ids))
  return deny("EVENT_SCOPE_OR_IDENTITY_INVALID");
 if(processed_event_ids.includes(event.event_id))return deny("EVENT_REPLAY");
 if(!github||!["fetchCommit","fetchTree","fetchFile"].every(n=>typeof github[n]==="function"))
  return deny("INDEPENDENT_GITHUB_READERS_REQUIRED");
 try{
  const [rawCommit,rawTree,rawFile]=await Promise.all([
   github.fetchCommit({repository,sha:event.source_revision}),
   github.fetchTree({repository,ref:event.source_revision,recursive:true}),
   github.fetchFile({repository,path:event.evidence_ref,ref:event.source_revision})
  ]);
  const commit=pick(rawCommit),tree=pick(rawTree),file=pick(rawFile);
  const commitSha=commit?.sha??commit?.commit?.sha;
  // Some commit clients omit the SHA from their response. Ref identity alone cannot prove it.
  if(commitSha!==event.source_revision)return deny("COMMIT_IDENTITY_NOT_INDEPENDENTLY_BOUND");
  if(tree?.truncated!==false||!Array.isArray(tree.tree))return deny("COMPLETE_PINNED_TREE_REQUIRED");
  const entry=tree.tree.find(x=>x.path===event.evidence_ref&&x.type==="blob");
  if(!entry||!valid(entry.sha)||entry.sha!==file?.sha||
     typeof file?.content!=="string"||blobSha(file.content)!==entry.sha)
    return deny("COMMIT_TREE_BLOB_CONTENT_MISMATCH");
  return {status:"SOURCE_READBACK_VERIFIED_NOT_WRITE_AUTHORIZED",verified:true,
   source_revision:event.source_revision,event_id:event.event_id,
   evidence_ref_verified:true,evidence_ref:event.evidence_ref,evidence_blob_sha:entry.sha,
   event_write_authorized:false,host_authorized:false};
 }catch(e){return deny("INDEPENDENT_SOURCE_READ_FAILED");}
}

export function createClicGithubCasTransport({repository,branch,github,verifyEventSource,allowedPaths=[CLIC_LEDGER_PATH]}={}){
 if(repository!=="xfraggelpower666x/666CLICPRO"||branch!=="clic-migration-rev79-staging"||
 !github||!["readBranch","fetchFile","updateFile","fetchTree","fetchCommit"].every(k=>typeof github[k]==="function")||
 typeof verifyEventSource!=="function"||!Array.isArray(allowedPaths))
 throw Error("CLIC_NATIVE_GITHUB_CONNECTOR_REQUIRED");
 const allow=new Set(allowedPaths);
 if(!allow.has(CLIC_LEDGER_PATH))throw Error("LEDGER_NOT_ALLOWLISTED");
 let expectedHead=null,writeRecord=null;
 const getHead=async()=>{
  const x=pick(await github.readBranch({repository,branch}));
  const sha=x?.commit?.sha??x?.head_sha??x?.sha;
  if(!valid(sha))throw Error("GITHUB_BRANCH_HEAD_UNVERIFIED");
  return sha;
 };
 const read=async path=>{
  if(!allow.has(path))throw Error("TARGET_PATH_NOT_ALLOWLISTED");
  const x=pick(await github.fetchFile({repository,path,ref:branch}));
  if(!valid(x?.sha)||typeof x?.content!=="string")throw Error("GITHUB_FILE_READBACK_UNVERIFIED");
  let ledger;try{ledger=JSON.parse(x.content)}catch{throw Error("LEDGER_JSON_INVALID")}
  return {blob_sha:x.sha,ledger,version_locked:true};
 };
 const compare=async(path,expectedBlob,ledger)=>{
  if(!allow.has(path)||!valid(expectedBlob)||!ledger)return failure("UNAUTHORIZED_OR_UNVERSIONED_TARGET");
  // A GitHub Contents file-SHA precondition is NOT an atomic branch-head CAS.
  // The current connector has no independently attested branch-CAS transaction.
  // Do not call updateFile merely because a caller claims that the CAS is available.
  return failure("ATOMIC_BRANCH_CAS_HOST_AUTHORITY_NOT_VERIFIED");
  const now=await getHead();
  if(!valid(expectedHead)||now!==expectedHead)return failure("CONCURRENT_BRANCH_HEAD_CHANGED");
  const before=await read(path);
  if(before.blob_sha!==expectedBlob)return failure("STALE_EXPECTED_FILE_BLOB");
  // GitHub Contents API must reject stale blob SHA; no force, no retry/rebase.
  const x=pick(await github.updateFile({repository,path,branch,sha:expectedBlob,
   content:JSON.stringify(ledger,null,2)+"\n",message:"chore(clic): authenticated development event CAS ledger"}));
  const newCommit=x?.commit_sha??x?.commit?.sha,blob=x?.content_sha??x?.content?.sha;
  if(!valid(newCommit)||!valid(blob))return failure("CONNECTOR_WRITE_RECEIPT_MISSING");
  writeRecord={from:now,to:newCommit,path,blob};
  return {cas_accepted:true,new_blob_sha:blob,commit_sha:newCommit};
 };
 const readBack=async path=>{
  const got=await read(path);
  if(!writeRecord||writeRecord.path!==path||got.blob_sha!==writeRecord.blob)throw Error("POSTWRITE_BLOB_MISMATCH");
  const live=await getHead();
  if(live!==writeRecord.to)throw Error("POSTWRITE_HEAD_CONFLICT");
  const c=pick(await github.fetchCommit({repository,sha:live}));
  const parents=c?.parents??c?.commit?.parents??[];
  if(!Array.isArray(parents)||!parents.some(p=>(p?.sha??p)===writeRecord.from))throw Error("CAS_PARENT_LINEAGE_MISMATCH");
  const t=pick(await github.fetchTree({repository,ref:live,recursive:true}));
  if(t?.truncated===true||!Array.isArray(t?.tree)||!t.tree.some(z=>z.path===path&&z.sha===writeRecord.blob))throw Error("COMMIT_TREE_BLOB_READBACK_MISMATCH");
  return got;
 };
 return {
  readHead:async()=>{const h=await getHead();if(!expectedHead)expectedHead=h;return h;},
  readCurrent:read,
  compareAndSwap:compare,
  readBack,
  verifyEventSource:async event=>{
   // Cross-check independent repository reads; external source verifiers may only narrow acceptance.
   const independent=await verifyClicPdiEventOrigin({event,github,repository,branch});
   if(independent.verified!==true)return independent;
   const x=await verifyEventSource(event);
   return x?.verified===true&&x?.source_revision===event?.source_revision&&x?.evidence_ref_verified===true?
     independent:{...independent,verified:false,evidence_ref_verified:false,status:"SOURCE_UNVERIFIED",reason:"SCOPED_ORIGIN_POLICY_DENIED"};
  },
  verifyLatestCasLineage:async ({base_head,head,blob_sha})=>
   writeRecord?.from===base_head&&writeRecord?.to===head&&writeRecord?.blob===blob_sha
 };
}
