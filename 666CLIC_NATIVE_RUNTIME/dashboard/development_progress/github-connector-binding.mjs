// Thin host-injected binding for EXISTING GitHub connector, not a new bridge/engine.
// Inject the actual GitHub tool functions from an authorized invoking host.
const OWNER="xfraggelpower666x/666CLICPRO",BRANCH="clic-migration-rev79-staging";
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
   if(!entry||!/^[a-f0-9]{40}$/i.test(file?.sha??"")||entry.sha!==file.sha||typeof file.content!=="string")
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
