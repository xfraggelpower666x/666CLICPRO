// CLIC native isolated host invocation: GitHub Actions-only, no product writes.
// Existing read adapter + existing append-only checkpoint CAS module, injected GitHub I/O.
import {execFileSync} from 'node:child_process';
import {runBoundedSemanticGithubStep} from './semantic-boundary-host-adapter.mjs';
import {appendIsolatedSemanticCheckpoint} from './semantic-checkpoint-git-cas.mjs';
const branch='clic-reader-r01-20261102',repo='xfraggelpower666x/666CLICPRO';
const dir='666CLIC_NATIVE_RUNTIME/plugin_governance/semantic_reader_checkpoints/';
const base='9a9d904e7a67bedf55896bb9fd907031102c945a';
const end='b4ca517971f927c868bbc1c86b5b31a59dae1734';
const prev=dir+'153bridge_0035_2026-11-02.json',next=dir+'153bridge_0043_2026-11-03.json';
const token=process.env.GITHUB_TOKEN;
if(process.env.GITHUB_REF_NAME!==branch||!token||process.env.GITHUB_REPOSITORY!==repo)throw Error('AUTHORIZED_ISOLATED_GITHUB_ACTION_CONTEXT_REQUIRED');
const api='https://api.github.com/repos/'+repo;
async function req(path,method='GET',payload){
 const response=await fetch(api+path,{method,headers:{'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(payload?{'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});
 if(response.status===404)return null;
 const value=await response.json();
 if(!response.ok)throw Error('GITHUB_'+method+'_HTTP_'+response.status);
 return value;
}
const git={
 readHead:async()=>{const v=await req('/git/ref/heads/'+branch);return v?.object?.sha},
 readFile:async({ref,path})=>{const v=await req('/contents/'+path+'?ref='+encodeURIComponent(ref));return v?{sha:v.sha,content:Buffer.from(v.content.replace(/\s/g,''),'base64').toString('utf8')}:null},
 readTreeSha:async({commit})=>(await req('/git/commits/'+commit))?.tree?.sha,
 createTree:async({base_tree_sha,entries})=>req('/git/trees','POST',{base_tree:base_tree_sha,tree:entries}),
 createCommit:async({parent_sha,tree_sha,message})=>req('/git/commits','POST',{message,tree:tree_sha,parents:[parent_sha]}),
 updateRef:async({expected_sha,sha,force})=>{
  if(force!==false)throw Error('FORCE_REF_DENIED');
  if(await git.readHead()!==expected_sha)return {success:false};
  // The remote git ref lock enforces exact expected SHA on the server.
  execFileSync('git',['fetch','--no-tags','origin',sha],{stdio:'pipe'});
  execFileSync('git',['push','--force-with-lease=refs/heads/'+branch+':'+expected_sha,'origin',sha+':refs/heads/'+branch],{stdio:'pipe'});
  return {success:true};
 }
};
const head=await git.readHead();
if(head!==process.env.GITHUB_SHA)throw Error('CONCURRENT_BRANCH_CHANGE_BEFORE_RUN');
const prior=await git.readFile({ref:head,path:prev});
if(!prior)throw Error('PRIOR_CHECKPOINT_MISSING');
const checkpoint=JSON.parse(prior.content);
if(checkpoint.count!==35)throw Error('RESUME_POSITION_NOT_35');
// Recover a committed checkpoint after a transient final host readback failure.
// No replay, no new Git object and no ref write when the target is already present.
const existing=await git.readFile({ref:head,path:next});
if(existing){
 const saved=JSON.parse(existing.content);
 const expectedPrefix=JSON.stringify(checkpoint.entries);
 if(saved?.schema!=='CLIC_SEMANTIC_BRIDGE_CHECKPOINT_V1'||saved.base!==base||saved.head!==end||
    saved.total!==153||saved.count!==43||saved.entries?.length!==43||
    JSON.stringify(saved.entries.slice(0,35))!==expectedPrefix||
    saved.entries[35]?.parent!==checkpoint.last_sha||saved.entries.at(-1)?.sha!==saved.last_sha)
   throw Error('RECOVERED_CHECKPOINT_CONFLICT');
 const checkedHead=await git.readHead();
 if(checkedHead!==head)throw Error('RECOVERED_CHECKPOINT_HEAD_CHANGED');
 console.log('CLIC_SEMANTIC_NATIVE_HOST_RECEIPT',JSON.stringify({
  status:'ISOLATED_CHECKPOINT_RECOVERED_READBACK_VERIFIED',commit:head,
  count:43,previous:35,new_items:8,write_attempted:false,
  production_published:false,plugin_promotion:false}));
 process.exit(0);
}
const step=await runBoundedSemanticGithubStep({
 fetch:async({url})=>{if(!url.startsWith(api+'/'))throw Error('FOREIGN_URL_DENIED');return {result:{content:JSON.stringify(await req(url.slice(api.length)))}}},
 base,head:end,checkpoint,limit:8
});
if(step.status!=='READBACK_PENDING'||step.checkpoint?.count!==43)throw Error('READ_PHASE_HOLD_'+step.reason+'_'+step.status);
const outcome=await appendIsolatedSemanticCheckpoint({github:git,branch,path:next,previousPath:prev,previousBlob:prior.sha,record:step.checkpoint});
if(outcome.status!=='ISOLATED_CHECKPOINT_READBACK_VERIFIED')throw Error('CAS_READBACK_GATE_'+outcome.reason+'_'+outcome.status);
console.log('CLIC_SEMANTIC_NATIVE_HOST_RECEIPT',JSON.stringify({status:outcome.status,commit:outcome.commit,count:outcome.count,previous:35,new_items:8,production_published:false,plugin_promotion:false}));
