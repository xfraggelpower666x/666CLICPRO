// Existing CLIC GitHub Git-objects + ref-CAS transport, isolated scope only.
// No new bridge; no promotion, release, foreign writes, or root-pointer mutation.
import {createHash} from 'node:crypto';
const SHA=/^[a-f0-9]{40}$/i;
const ROOT='666CLIC_NATIVE_RUNTIME/plugin_governance/semantic_reader_checkpoints/';
const BRANCH='clic-reader-r01-20261102';
const REPO='xfraggelpower666x/666CLICPRO';
const blob=s=>{const b=Buffer.from(s);return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');};
const deny=(reason)=>({status:'WRITE_BLOCKED',reason,persisted:false});
export async function appendIsolatedSemanticCheckpoint({github,branch=BRANCH,path,previousPath,previousBlob,record}={}){
 if(branch!==BRANCH||typeof path!=='string'||!path.startsWith(ROOT)||!/^153bridge_[0-9]{4}_[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$/.test(path.slice(ROOT.length))
 ||!previousPath?.startsWith(ROOT)||!SHA.test(previousBlob??'')||!record||
 !Number.isInteger(record.count)||record.count<1||record.total!==153||record.entries?.length!==record.count||
 !Array.isArray(record.entries)||record.entries.at(-1)?.sha!==record.last_sha)return deny('INVALID_ISOLATED_CHECKPOINT_SCOPE');
 if(!github||['readHead','readFile','readTreeSha','createTree','createCommit','updateRef'].some(k=>typeof github[k]!=='function'))return deny('GITHUB_GIT_CAS_TOOLS_REQUIRED');
 try {
  const head=await github.readHead({repository:REPO,branch});
  if(!SHA.test(head??''))return deny('UNVERIFIED_HEAD');
  const prior=await github.readFile({repository:REPO,ref:head,path:previousPath});
  if(prior?.sha!==previousBlob||typeof prior.content!=='string')return deny('PREVIOUS_CHECKPOINT_BLOB_MISMATCH');
  const history=JSON.parse(prior.content);
  if(record.base!==history.base||record.head!==history.head||record.total!==history.total||
   record.count<=history.count||JSON.stringify(record.entries.slice(0,history.count))!==JSON.stringify(history.entries)||
   record.entries[history.count]?.parent!==history.last_sha)return deny('CHECKPOINT_NOT_APPEND_ONLY');
  const existing=await github.readFile({repository:REPO,ref:head,path}).catch(()=>null);
  if(existing!==null)return deny('IMMUTABLE_TARGET_EXISTS');
  const baseTree=await github.readTreeSha({repository:REPO,commit:head});
  if(!SHA.test(baseTree??''))return deny('UNVERIFIED_BASE_TREE');
  const content=JSON.stringify(record,null,2)+'\n',expected=blob(content);
  const tree=await github.createTree({repository:REPO,base_tree_sha:baseTree,entries:[{path,mode:'100644',type:'blob',content}]});
  if(!SHA.test(tree?.sha??''))return deny('TREE_CREATION_FAILED');
  const commit=await github.createCommit({repository:REPO,parent_sha:head,tree_sha:tree.sha,message:'evidence(clic): append isolated semantic bridge checkpoint'});
  if(!SHA.test(commit?.sha??''))return deny('COMMIT_CREATION_FAILED');
  const moved=await github.updateRef({repository:REPO,branch,expected_sha:head,sha:commit.sha,force:false});
  if(moved?.success!==true)return deny('BRANCH_CAS_CONFLICT');
  let lastReadback='UNAVAILABLE';
  for(let attempt=1;attempt<=3;attempt++){
   const finalHead=await github.readHead({repository:REPO,branch});
   if(finalHead!==commit.sha){lastReadback='POSTWRITE_HEAD_NOT_VISIBLE';continue;}
   const finalFile=await github.readFile({repository:REPO,ref:commit.sha,path});
   if(finalFile?.sha!==expected){lastReadback='POSTWRITE_BLOB_NOT_MATCHED';continue;}
   if(finalFile.content!==content){lastReadback='POSTWRITE_CONTENT_NOT_MATCHED';continue;}
   return {status:'ISOLATED_CHECKPOINT_READBACK_VERIFIED',persisted:true,commit:commit.sha,blob:expected,count:record.count,production_published:false};
  }
  return {status:'READBACK_PENDING',reason:lastReadback,persisted:false,commit:commit.sha};
 }catch(e){return deny('GITHUB_CAS_READBACK_FAILED_'+String(e?.message??e))}
}
