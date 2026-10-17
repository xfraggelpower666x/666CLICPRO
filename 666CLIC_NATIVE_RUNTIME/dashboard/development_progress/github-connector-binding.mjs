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
