import {createHash} from "node:crypto";
import {inspectPfsSb05NativeReceipts} from "../../continuity/starbridge-receipt-readback.mjs";
// Thin host-injected binding for EXISTING GitHub connector, not a new bridge/engine.
// Inject the actual GitHub tool functions from an authorized invoking host.
const OWNER="xfraggelpower666x/666CLICPRO",BRANCH="clic-migration-rev79-staging";
const PEER="xfraggelpower666x/666PFS_CSM",PEER_BRANCH="main";
const SHA=/^[a-f0-9]{40}$/i;
const PDI_FILES=["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json","666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"];
const SB05_SOURCE=["666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-PFS-REPO-MIGRATION-CONTEXT-20261005-01.json","666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-STARBRIDGE-SB05-20261017-01.json"];
const SB05_PEER=["handoff/receipts/CLIC-STARBRIDGE-SB05-20261017-01_PFS_READBACK.json","handoff/receipts/CLIC-STARBRIDGE-SB05-20261017-01_PFS_ADDITIVE_RECEIPT.json"];
const blobSHA=s=>{const b=Buffer.from(s,"utf8");return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
const parse=x=>{const r=x?.result??x;return typeof r?.content==="string"?
 (()=>{try{return JSON.parse(r.content)}catch{return {content:r.content,sha:r.sha}}})():r};
export function bindClicNativeGithubTools({fetch,fetch_file,update_file}={}){
 if(![fetch,fetch_file,update_file].every(x=>typeof x==="function"))throw Error("ACTUAL_GITHUB_CONNECTOR_TOOLS_REQUIRED");
 const scope=({repository,branch,ref}={})=>{
  if(repository!==OWNER||(branch!==undefined&&branch!==BRANCH)||(ref!==undefined&&ref!==BRANCH&& !/^[a-f0-9]{40}$/i.test(ref)))throw Error("CLIC_ONLY_SCOPE");
 };
 const route=(p)=>"https://api.github.com/repos/"+OWNER+p;
 return {
  readBranch:async ({repository,branch})=>{scope({repository,branch});return parse(await fetch({url:route("/branches/"+BRANCH)}))},
  fetchFile:async ({repository,path,ref})=>{scope({repository,ref});if(typeof path!=="string"||!path.startsWith("666CLIC_NATIVE_RUNTIME/"))throw Error("CLIC_RUNTIME_PATH_ONLY");return parseFile(await fetch_file({repository_full_name:OWNER,path,ref:ref??BRANCH}))},
  updateFile:async ({repository,path,branch,sha,content,message})=>{
   scope({repository,branch});if(!["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json","666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"].includes(path))throw Error("CAS_LEDGER_PATH_ALLOWLIST_ONLY");
   if(!/^[a-f0-9]{40}$/i.test(sha??""))throw Error("EXACT_FILE_BLOB_REQUIRED");
   return parse(await update_file({repository_full_name:OWNER,path,branch:BRANCH,sha,content,message}));
  },
  fetchCommit:async ({repository,sha})=>{scope({repository});if(!/^[a-f0-9]{40}$/i.test(sha??""))throw Error("INVALID_COMMIT_SHA");return parse(await fetch({url:route("/git/commits/"+sha)}))},
  fetchTree:async ({repository,ref,recursive})=>{scope({repository,ref});if(recursive!==true)throw Error("COMPLETE_TREE_REQUIRED");return parse(await fetch({url:route("/git/trees/"+ref+"?recursive=1")}))}
 };
}
function parseFile(res){
 const r=res?.result??res;
 if(typeof r?.content!=="string"||typeof r.sha!=="string")throw Error("FILE_READBACK_NOT_AVAILABLE");
 return {content:r.content,sha:r.sha};
}

/** Read-only host preflight; never claims a CAS write or fresh-host acceptance. */
export async function verifyClicPdiHostReadiness({github,repository=OWNER,branch=BRANCH}={}){
 const fail=(reason)=>({status:"READBACK_PENDING",reason,host_persistence_verified:false,host_dispatch_verified:false,writes:0});
 if(repository!==OWNER||branch!==BRANCH||!github||!["readBranch","fetchFile","fetchTree"].every(k=>typeof github[k]==="function"))
  return fail("TRUSTED_CLIC_GITHUB_READER_REQUIRED");
 const paths=["666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json",
              "666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json"];
 try{
  const first=github.readBranch({repository,branch});
  const start=(await first)?.result??await first;
  const head=start?.commit?.sha??start?.sha;
  if(!/^[a-f0-9]{40}$/i.test(head??""))return fail("INVALID_BRANCH_HEAD");
  const [treeResponse,...files]=await Promise.all([
   github.fetchTree({repository,ref:head,recursive:true}),
   ...paths.map(path=>github.fetchFile({repository,path,ref:head}))
  ]);
  const tree=treeResponse?.result??treeResponse;
  if(tree?.truncated!==false||!Array.isArray(tree?.tree))return fail("TRUNCATED_OR_MISSING_TREE");
  for(let i=0;i<paths.length;i++){
   const file=files[i]?.result??files[i];
   const entry=tree.tree.find(x=>x.path===paths[i]);
   if(!entry||!/^[a-f0-9]{40}$/i.test(file?.sha??"")||entry.sha!==file.sha||typeof file.content!=="string"||blobSHA(file.content)!==file.sha)
    return fail("LEDGER_TREE_BLOB_MISMATCH_"+i);
   JSON.parse(file.content);
  }
  const endResponse=await github.readBranch({repository,branch});
  const end=endResponse?.result??endResponse;
  if((end?.commit?.sha??end?.sha)!==head)return fail("CONCURRENT_HEAD_CHANGE");
  return {status:"READ_ONLY_LEDGER_READBACK_VERIFIED",head,ledger_blobs:files.map(x=>(x?.result??x).sha),
   host_persistence_verified:false,host_dispatch_verified:false,writes:0,
   return_anchor:"AUTHENTIC_EVENT_ORIGIN_AND_GOVERNED_CAS_WRITE_STILL_REQUIRED"};
 }catch(e){return fail("READBACK_ERROR_"+String(e?.message??e))}
}

// Source-level binding for the EXISTING two host gates. The host must inject the
// real authorized GitHub fetch/fetch_file functions. No update_file or write API.
export function bindClicReadOnlyHostTools({fetch,fetch_file}={}){
 if(typeof fetch!=="function"||typeof fetch_file!=="function")throw Error("REAL_READONLY_GITHUB_CONNECTOR_REQUIRED");
 const allowedPath=(repo,path)=>repo===OWNER?[...PDI_FILES,...SB05_SOURCE].includes(path):
   repo===PEER?SB05_PEER.includes(path):false;
 const readEndpoint=url=>{
  if(typeof url!=="string")throw Error("HOST_READ_URL_INVALID");
  for(const [repo,branch] of [[OWNER,BRANCH],[PEER,PEER_BRANCH]]){
   const prefix="https://api.github.com/repos/"+repo+"/";
   if(!url.startsWith(prefix))continue;
   const tail=url.slice(prefix.length);
   if(tail==="branches/"+branch)return true;
   const match=/^git\/trees\/([a-f0-9]{40})\?recursive=1$/i.exec(tail);
   if(match)return true;
  }
  throw Error("READ_ONLY_HOST_ENDPOINT_NOT_ALLOWLISTED");
 };
 const boundFetch=async({url})=>{readEndpoint(url);return fetch({url})};
 const boundFile=async({repository_full_name,path,ref})=>{
  if(!allowedPath(repository_full_name,path)||!SHA.test(ref??""))throw Error("READ_ONLY_HOST_FILE_SCOPE_DENIED");
  return fetch_file({repository_full_name,path,ref});
 };
 const github={
  readBranch:async({repository,branch})=>{if(repository!==OWNER||branch!==BRANCH)throw Error("CLIC_SCOPE_ONLY");return parse(await boundFetch({url:"https://api.github.com/repos/"+OWNER+"/branches/"+BRANCH}))},
  fetchTree:async({repository,ref,recursive})=>{if(repository!==OWNER||!SHA.test(ref??"")||recursive!==true)throw Error("CLIC_TREE_SCOPE_ONLY");return parse(await boundFetch({url:"https://api.github.com/repos/"+OWNER+"/git/trees/"+ref+"?recursive=1"}))},
  fetchFile:async({repository,path,ref})=>{if(repository!==OWNER||!PDI_FILES.includes(path))throw Error("CLIC_LEDGER_READ_ONLY_SCOPE_ONLY");return parseFile(await boundFile({repository_full_name:OWNER,path,ref}))}
 };
 return {github,fetch:boundFetch,fetchFile:boundFile,authority:"CLIC_READ_ONLY_HOST_INJECTION",write_capability:false};
}
export async function inspectClicBoundHostReadbacks({fetch,fetch_file}={}){
 const fail=reason=>({status:"READBACK_PENDING",reason,host_module_executed:false,event_cas_verified:false,delivery_verified:false,adoption_verified:false,host_accepted:false,writes:0});
 let bindings;
 try{bindings=bindClicReadOnlyHostTools({fetch,fetch_file})}catch(e){return fail(String(e.message))}
 const pdi=await verifyClicPdiHostReadiness({github:bindings.github});
 // PDI refusal does not make a peer native readback an automatic PASS.
 let envelope;
 try{
  const branch=await bindings.fetch({url:"https://api.github.com/repos/"+OWNER+"/branches/"+BRANCH});
  const head=parse(branch)?.commit?.sha;
  if(!SHA.test(head??""))return fail("CLIC_HEAD_NOT_VERIFIED");
  const read=await bindings.fetchFile({repository_full_name:OWNER,path:SB05_SOURCE[1],ref:head});
  envelope=JSON.parse(parseFile(read).content);
 }catch(e){return {...fail("SB05_ENVELOPE_READ_FAILED"),pdi}}
 const sb05=await inspectPfsSb05NativeReceipts({fetch:bindings.fetch,fetchFile:bindings.fetchFile,envelope});
 return {status:"BOUND_READ_ONLY_GATE_EVALUATED",pdi,sb05,
  real_connector_invocation_required:true,host_module_executed:true,
  event_cas_verified:false,delivery_verified:false,adoption_verified:false,
  host_accepted:false,writes:0,foreign_mutations:false,
  return_anchor:"PDI_EVENT_CAS_AND_SB05_DELIVERY_HOST_STILL_OPEN"};
}
