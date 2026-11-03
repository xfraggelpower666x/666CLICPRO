// CLIC native isolated host invocation: GitHub Actions-only, no product writes.
// Existing read adapter + existing append-only checkpoint CAS module, injected GitHub I/O.
import {execFileSync} from 'node:child_process';
import {runBoundedSemanticGithubStep} from './semantic-boundary-host-adapter.mjs';
import {appendIsolatedSemanticCheckpoint} from './semantic-checkpoint-git-cas.mjs';
const branch='clic-reader-r01-20261102',repo='xfraggelpower666x/666CLICPRO';
const dir='666CLIC_NATIVE_RUNTIME/plugin_governance/semantic_reader_checkpoints/';
const base='9a9d904e7a67bedf55896bb9fd907031102c945a';
const end='b4ca517971f927c868bbc1c86b5b31a59dae1734';
const prev=dir+'153bridge_0043_2026-11-03.json',next=dir+'153bridge_0051_2026-11-03.json';
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
const initialHead=await git.readHead();
if(initialHead!==process.env.GITHUB_SHA)throw Error('CONCURRENT_BRANCH_CHANGE_BEFORE_RUN');
const checkpointPath=n=>dir+'153bridge_'+String(n).padStart(4,'0')+'_2026-11-03.json';
let path=checkpointPath(51);
let pinnedHead=initialHead;
let prior=await git.readFile({ref:pinnedHead,path});
if(!prior)throw Error('VERIFIED_51_CHECKPOINT_MISSING');
let checkpoint=JSON.parse(prior.content);
if(checkpoint.schema!=='CLIC_SEMANTIC_BRIDGE_CHECKPOINT_V1'||
 checkpoint.base!==base||checkpoint.head!==end||checkpoint.count!==51||
 checkpoint.entries?.length!==51||checkpoint.total!==153||
 checkpoint.entries.at(-1)?.sha!==checkpoint.last_sha)
 throw Error('UNEXPECTED_START_CHECKPOINT');
let batches=0,writeCount=0,recoveredCount=0;
while(checkpoint.count<153){
 if(batches>=13)throw Error('BOUNDED_BATCH_BUDGET_EXCEEDED');
 const previous=checkpoint.count;
 const target=Math.min(153,previous+8);
 const dest=checkpointPath(target);
 const currentHead=await git.readHead();
 if(currentHead!==pinnedHead)throw Error('UNEXPECTED_BRANCH_HEAD_BEFORE_BATCH_'+previous);
 const existing=await git.readFile({ref:currentHead,path:dest});
 if(existing){
  const saved=JSON.parse(existing.content);
  if(saved.schema!=='CLIC_SEMANTIC_BRIDGE_CHECKPOINT_V1'||saved.base!==base||
   saved.head!==end||saved.total!==153||saved.count!==target||
   saved.entries?.length!==target||
   JSON.stringify(saved.entries.slice(0,previous))!==JSON.stringify(checkpoint.entries)||
   saved.entries[previous]?.parent!==checkpoint.last_sha||
   saved.entries.at(-1)?.sha!==saved.last_sha)
   throw Error('EXISTING_CHECKPOINT_CONFLICT_AT_'+target);
  const confirm=await git.readHead();
  if(confirm!==currentHead)throw Error('EXISTING_CHECKPOINT_HEAD_CHANGED');
  checkpoint=saved;path=dest;prior=existing;pinnedHead=confirm;recoveredCount++;
  console.log('CLIC_SEMANTIC_BATCH_RECOVERED',JSON.stringify({count:target,head:confirm,write_attempted:false}));
  batches++;continue;
 }
 const step=await runBoundedSemanticGithubStep({
  fetch:async({url})=>{
   if(!url.startsWith(api+'/'))throw Error('FOREIGN_URL_DENIED');
   return {result:{content:JSON.stringify(await req(url.slice(api.length)))}};
  },
  base,head:end,checkpoint,limit:target-previous
 });
 if(step.status!=='READBACK_PENDING'||step.checkpoint?.count!==target||
    step.processed!==target-previous)
  throw Error('SEMANTIC_BATCH_FAIL_CLOSED_'+previous+'_'+step.status+'_'+step.reason);
 const outcome=await appendIsolatedSemanticCheckpoint({
  github:git,branch,path:dest,previousPath:path,previousBlob:prior.sha,record:step.checkpoint
 });
 if(outcome.status!=='ISOLATED_CHECKPOINT_READBACK_VERIFIED'){
  // A successful push can precede a delayed readback. Recover only exact immutable bytes.
  const revised=await git.readHead();
  const already=await git.readFile({ref:revised,path:dest});
  if(!already||JSON.stringify(JSON.parse(already.content))!==JSON.stringify(step.checkpoint)||
     revised!==outcome.commit)throw Error('CHECKPOINT_CAS_OR_READBACK_UNRESOLVED_'+previous+'_'+outcome.status+'_'+outcome.reason);
  console.log('CLIC_SEMANTIC_BATCH_LATE_READBACK',JSON.stringify({count:target,head:revised}));
 }else{writeCount++;}
 const nextHead=await git.readHead();
 const nextFile=await git.readFile({ref:nextHead,path:dest});
 if(!nextFile||JSON.stringify(JSON.parse(nextFile.content))!==JSON.stringify(step.checkpoint))
  throw Error('INDEPENDENT_CHECKPOINT_READBACK_MISMATCH_'+target);
 if(nextHead!==outcome.commit)throw Error('COMMIT_LINEAGE_HEAD_MISMATCH_'+target);
 checkpoint=JSON.parse(nextFile.content);prior=nextFile;path=dest;pinnedHead=nextHead;
 batches++;
 console.log('CLIC_SEMANTIC_BATCH_RECEIPT',JSON.stringify({count:target,batch:target-previous,head:nextHead,checkpoint_blob:nextFile.sha,approval_granted:false}));
}
if(checkpoint.count!==153||checkpoint.entries?.length!==153||checkpoint.last_sha!==end)
 throw Error('INCOMPLETE_FINAL_BOUNDARY');
const last=await git.readHead();
if(last!==pinnedHead)throw Error('FINAL_BRANCH_HEAD_CHANGED');
console.log('CLIC_SEMANTIC_NATIVE_HOST_RECEIPT',JSON.stringify({
 status:'ISOLATED_153_CHAIN_CHECKPOINT_READBACK_VERIFIED',
 commit:last,count:153,initial:51,new_items:102,
 batches,write_count:writeCount,recovered_batches:recoveredCount,
 source_semantic_classification_only:true,
 canonical_fingerprint_approved:false,provider_binary_verified:false,
 production_published:false,plugin_promotion:false,foreign_writes:false
}));
