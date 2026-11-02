// CLIC native bounded GitHub read adapter: injected existing connector only.
import {createHash} from 'node:crypto';
import {prepareSemanticBoundaryBatch} from './semantic-boundary-reader.mjs';
const ROOT='https://api.github.com/repos/xfraggelpower666x/666CLICPRO';
const SHA=/^[a-f0-9]{40}$/i;
const parse=x=>{const v=x?.result??x;return typeof v?.content==='string'?JSON.parse(v.content):v};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hold=(reason,checkpoint=null)=>({status:'HOLD',reason,checkpoint,approval_granted:false,writes:0});
export async function runBoundedSemanticGithubStep({fetch,base,head,checkpoint=null,limit=8,appendCheckpoint,readCheckpoint}={}){
 if(typeof fetch!=='function'||!SHA.test(base??'')||!SHA.test(head??'')||!Number.isInteger(limit)||limit<1||limit>12)return hold('INVALID_GITHUB_READ_SCOPE',checkpoint);
 try{
  const pages=[];
  for(let page=1;page<=4;page++){
   const body=parse(await fetch({url:ROOT+'/compare/'+base+'...'+head+'?per_page=100&page='+page}));
   if(body.status!=='ahead'||!Number.isInteger(body.total_commits)||body.total_commits<1||body.total_commits>400||!Array.isArray(body.commits))return hold('INVALID_COMPARE_PAGE',checkpoint);
   if(pages.length&&pages[0].total_commits!==body.total_commits)return hold('COMPARE_CHANGED_DURING_PAGINATION',checkpoint);
   pages.push(body);
   if(pages.reduce((n,p)=>n+p.commits.length,0)>=body.total_commits)break;
  }
  const commits=pages.flatMap(p=>p.commits),total=pages[0].total_commits;
  if(commits.length!==total||commits.at(-1)?.sha!==head||commits.some(c=>!SHA.test(c?.sha??''))||new Set(commits.map(c=>c.sha)).size!==total)return hold('INCOMPLETE_COMPARE_CHAIN',checkpoint);
  const index=checkpoint?.count??0;
  if(!Number.isInteger(index)||index<0||index>total)return hold('INVALID_RESUME_OFFSET',checkpoint);
  const batch=commits.slice(index,index+limit),details=[];
  for(const c of batch){
   const obj=parse(await fetch({url:ROOT+'/commits/'+c.sha}));
   if(obj.sha!==c.sha||!Array.isArray(obj.parents)||!Array.isArray(obj.files)||obj.files.length>=300)return hold('COMMIT_DETAIL_MISSING_OR_TRUNCATED',checkpoint);
   details.push({sha:obj.sha,parents:obj.parents.map(p=>p.sha),paths:obj.files.map(f=>f.filename),files_truncated:false});
  }
  const result=prepareSemanticBoundaryBatch({base,head,orderedShas:commits.map(c=>c.sha),checkpoint,details,limit});
  if(result.status==='HOLD')return {...result,writes:0};
  if(result.processed===0)return {...result,persisted:checkpoint!==null,writes:0};
  if(typeof appendCheckpoint!=='function'||typeof readCheckpoint!=='function')return {...result,status:'READBACK_PENDING',persisted:false,writes:0};
  const expected=hash(result.checkpoint);
  const write=await appendCheckpoint({expected_previous_digest:checkpoint?hash(checkpoint):null,record:result.checkpoint});
  if(write?.cas_accepted!==true)return hold('CHECKPOINT_CAS_NOT_ACCEPTED',checkpoint);
  const after=await readCheckpoint();
  if(!after||hash(after)!==expected)return hold('CHECKPOINT_READBACK_MISMATCH',checkpoint);
  return {...result,status:result.remaining===0?'CHAIN_COVERED_NOT_APPROVAL':'CHECKPOINT_READBACK_VERIFIED',persisted:true,checkpoint_digest:expected,writes:1};
 }catch(e){return hold('HOST_CONNECTOR_ERROR_'+String(e?.message??e),checkpoint)}
}
