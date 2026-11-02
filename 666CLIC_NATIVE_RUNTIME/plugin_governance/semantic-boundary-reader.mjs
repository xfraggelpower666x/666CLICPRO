// CLIC-native bounded semantic boundary receipt reader.
// Pure planner: callers fetch independent GitHub commit details and persist returned checkpoint records.
// Does not fetch, write, approve, publish, or act as a daemon.
import { classifyClicPath } from './semantic-body-boundary.mjs';
const SHA=/^[a-f0-9]{40}$/i;
const validSha=x=>typeof x==='string'&&SHA.test(x);
const fail=(reason,checkpoint)=>({status:'HOLD',reason,checkpoint,processed:0,write_authority:false,approval_granted:false});
export function prepareSemanticBoundaryBatch({base,head,orderedShas,checkpoint=null,details=[],limit=12}={}){
 if(!validSha(base)||!validSha(head))return fail('INVALID_BOUNDARY',checkpoint);
 if(!Array.isArray(orderedShas)||!orderedShas.length||!orderedShas.every(validSha)||new Set(orderedShas).size!==orderedShas.length||orderedShas.at(-1)!==head)return fail('INCOMPLETE_OR_INVALID_ORDERED_SHAS',checkpoint);
 if(!Number.isInteger(limit)||limit<1||limit>20)return fail('INVALID_BATCH_LIMIT',checkpoint);
 const prior=checkpoint?.entries??[];
 if(!Array.isArray(prior)||prior.length>orderedShas.length)return fail('INVALID_CHECKPOINT',checkpoint);
 let previous=base;
 for(let i=0;i<prior.length;i++){
  const entry=prior[i];
  if(entry?.sha!==orderedShas[i]||entry.parent!==previous||!Array.isArray(entry.paths)||!entry.paths.length||
     entry.paths.some(p=>classifyClicPath(p)==='UNKNOWN')||
     !Array.isArray(entry.classes)||entry.classes.length!==entry.paths.length||
     entry.classes.some((cl,j)=>cl!==classifyClicPath(entry.paths[j])))
   return fail('CHECKPOINT_CONFLICT_AT_'+i,checkpoint);
  previous=entry.sha;
 }
 if(checkpoint&&(checkpoint.base!==base||checkpoint.head!==head||checkpoint.total!==orderedShas.length||
   checkpoint.last_sha!==previous||checkpoint.count!==prior.length))return fail('CHECKPOINT_BINDING_MISMATCH',checkpoint);
 const start=prior.length;
 if(start===orderedShas.length)return {status:'CHAIN_COVERED_NOT_APPROVAL',checkpoint,processed:0,remaining:0,write_authority:false,approval_granted:false};
 const target=orderedShas.slice(start,start+limit);
 if(!Array.isArray(details)||details.length!==target.length)return fail('MISSING_EXACT_BATCH_DETAILS',checkpoint);
 const additions=[];
 for(let j=0;j<target.length;j++){
  const c=details[j],i=start+j,expected=target[j];
  if(!c||c.sha!==expected||!Array.isArray(c.parents)||c.parents.length!==1||
    c.parents[0]!==previous)return fail('PARENT_OR_SHA_MISMATCH_AT_'+i,checkpoint);
  if(c.files_truncated===true||!Array.isArray(c.paths))return fail('MISSING_OR_TRUNCATED_PATHS_AT_'+i,checkpoint);
  if(c.paths.length===0)return fail('NOOP_REQUIRES_TREE_EVIDENCE_AT_'+i,checkpoint);
  if(c.paths.some(p=>typeof p!=='string'||p.length===0))return fail('INVALID_PATH_AT_'+i,checkpoint);
  const classes=c.paths.map(classifyClicPath);
  if(classes.includes('UNKNOWN'))return fail('UNKNOWN_PATH_AT_'+i,checkpoint);
  additions.push({sha:c.sha,parent:previous,paths:[...c.paths],classes});
  previous=c.sha;
 }
 const entries=[...prior,...additions],count=entries.length;
 const next={schema:'CLIC_SEMANTIC_BRIDGE_CHECKPOINT_V1',base,head,total:orderedShas.length,count,last_sha:previous,entries};
 return {status:count===orderedShas.length?'CHAIN_COVERED_NOT_APPROVAL':'PARTIAL_CHECKPOINT',
 checkpoint:next,processed:additions.length,remaining:orderedShas.length-count,
 next_sha:orderedShas[count]??null,write_authority:false,approval_granted:false};
}
