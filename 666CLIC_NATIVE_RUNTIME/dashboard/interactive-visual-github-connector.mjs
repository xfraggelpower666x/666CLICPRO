// IVI08-A: provider-call boundary for native GitHub API, no arbitrary "verified" inputs.
// Inject trusted connector functions from the host; this module has no credentials or network.
// A successful local mock is not authenticated transport or host acceptance.
import {createHash} from "node:crypto";
import {verifyInteractiveSnapshotEvidence} from "./interactive-visual-evidence-gate.mjs";
const REPO="xfraggelpower666x/666CLICPRO", BRANCH="clic-migration-rev79-staging";
const ROOT="666CLIC_NATIVE_RUNTIME/";
const POINTER=ROOT+"CURRENT_POINTER.json", MANIFEST=ROOT+"REHYDRATION_MANIFEST.json";
const SHA=/^[a-f0-9]{40}$/i;
const safe=p=>typeof p==="string"&&p.startsWith(ROOT)&&!p.split("/").includes("..")&&!p.includes("\\")&&!p.includes("\0");
const gitHash=s=>{const b=Buffer.from(s,"utf8");return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
const unwrap=x=>x?.result??x;
const textJson=x=>typeof x==="string"?JSON.parse(x):x;
function fromFetch(x){const z=unwrap(x);return textJson(z.content??z)}
function fromFile(x){const z=unwrap(x);if(typeof z.content!=="string"||!SHA.test(z.sha??""))throw Error("MALFORMED_CONNECTOR_FILE_RESPONSE");return z}
export async function obtainTrustedClicSnapshot({fetch,fetchFile},snapshot={}){
 if(typeof fetch!=="function"||typeof fetchFile!=="function")return {status:"CONNECTOR_UNAVAILABLE",verified:false};
 const paths=snapshot.source_paths;
 if(!Array.isArray(paths)||paths.length===0||paths.some(p=>!safe(p))||new Set(paths).size!==paths.length)return {status:"INVALID_SNAPSHOT_PATHS",verified:false};
 try{
  const branch=fromFetch(await fetch({url:"https://api.github.com/repos/"+REPO+"/branches/"+BRANCH}));
  const head=branch?.commit?.sha;
  if(!SHA.test(head??"")||head!==snapshot.source_commit)return {status:"STALE_OR_DIFFERENT_HEAD",verified:false,observed_head:head??null};
  const tree=fromFetch(await fetch({url:"https://api.github.com/repos/"+REPO+"/git/trees/"+head+"?recursive=1"}));
  if(tree?.truncated!==false||!Array.isArray(tree.tree))return {status:"TREE_READBACK_INCOMPLETE",verified:false};
  const index=new Map(tree.tree.filter(e=>e.type==="blob").map(e=>[e.path,e.sha]));
  const needed=[...new Set([POINTER,MANIFEST,...paths])];
  if(needed.some(p=>!safe(p)||!SHA.test(index.get(p)??"")))return {status:"MISSING_COMMITTED_BLOBS",verified:false};
  const files=await Promise.all(needed.map(path=>fetchFile({repository_full_name:REPO,path,ref:head})));
  const verified=[];
  for(let i=0;i<needed.length;i++){
   const f=fromFile(files[i]),path=needed[i],actual=gitHash(f.content);
   if(f.sha!==index.get(path)||actual!==index.get(path))return {status:"CONTENT_TREE_BLOB_MISMATCH",verified:false,path};
   verified.push({path,blob_sha:f.sha,tree_commit:head,readback_verified:true,blob_matches_commit_tree:true});
  }
  const pointer=JSON.parse(fromFile(files[needed.indexOf(POINTER)]).content);
  const manifest=JSON.parse(fromFile(files[needed.indexOf(MANIFEST)]).content);
  if(!pointer||manifest.system!=="666CLIC"||manifest.authority!=="GITHUB_REPO_CURRENT"||!Array.isArray(manifest.required_order)||manifest.required_order.length===0)return {status:"POINTER_MANIFEST_INVALID",verified:false};
  // Compare the HEAD a second time to fail closed on mid-read concurrent movement.
  const finalBranch=fromFetch(await fetch({url:"https://api.github.com/repos/"+REPO+"/branches/"+BRANCH}));
  if(finalBranch?.commit?.sha!==head)return {status:"CONCURRENT_HEAD_CHANGE",verified:false};
  const readback={provenance:{repository:REPO,branch:BRANCH,head},independently_fetched:true,authenticated_connector_readback:true,pointer_verified:true,manifest_verified:true,head_verified:true,proof_origin:"GITHUB_CONNECTOR_CALL_RESULTS_CONTENT_HASH_VERIFIED",blobs:verified};
  const gate=verifyInteractiveSnapshotEvidence(snapshot,readback);
  if(!gate.valid)return {status:"SNAPSHOT_GATE_REJECTED",verified:false,errors:gate.errors};
  return {status:"CONTENT_AND_CURRENT_READBACK_VERIFIED",verified:true,head,readback,source_evidence:verified,host_verified:false,transport_authentication:"TRUSTED_HOST_CONNECTOR_REQUIRED",delivery_verified:false};
 }catch(e){return {status:"CONNECTOR_READBACK_ERROR",verified:false,reason:String(e.message??e)}}
}
