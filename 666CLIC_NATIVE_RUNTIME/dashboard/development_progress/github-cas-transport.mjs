// CLIC-owned GitHub Contents CAS adapter; injected authenticated GitHub connector only.
// Transport factory never grants authority. No background mutation or root pointer write.
import {CLIC_LEDGER_PATH} from "./development-ledger-store.mjs";
const SHA=/^[a-f0-9]{40}$/i;
const valid=x=>typeof x==="string"&&SHA.test(x);
const failure=(reason)=>({cas_accepted:false,reason});
const pick=x=>x?.result??x;
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
   const x=await verifyEventSource(event);
   return x?.verified===true&&x?.source_revision===event?.source_revision&&x?.evidence_ref_verified===true?
    x:{verified:false,source_revision:event?.source_revision,evidence_ref_verified:false};
  },
  verifyLatestCasLineage:async ({base_head,head,blob_sha})=>
   writeRecord?.from===base_head&&writeRecord?.to===head&&writeRecord?.blob===blob_sha
 };
}
