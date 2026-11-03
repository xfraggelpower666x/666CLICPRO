// Pure verified CLIC task-ledger presenter. Does not detect background activity.
const STATUSES=new Set(["OPEN","IN_PROGRESS","DONE","BLOCKED"]);
export function renderProgress(candidate={}) {
  if(candidate.status!=="ACTIVE"||candidate.authority!=="666CLIC_REPO_CURRENT"||!candidate.source_revision||!Array.isArray(candidate.tasks)) return {visible:false,reason:"NO_VERIFIED_ACTIVE_CLIC_WORK"};
  const ids=new Set();let done=0;
  for(const task of candidate.tasks){
    if(!task||typeof task.id!=="string"||!task.id||ids.has(task.id)||!STATUSES.has(task.status)) return {visible:false,reason:"INVALID_TASK_LEDGER"};
    ids.add(task.id);
    if(task.status==="DONE"){if(!Array.isArray(task.evidence)||task.evidence.length===0||task.evidence.some(x=>typeof x!=="string"||!x.trim()))return{visible:false,reason:"DONE_WITHOUT_EVIDENCE"};done++;}
  }
  if(!ids.size)return {visible:false,reason:"NO_VERIFIED_TASK_IDS"};
  return {visible:true,total:ids.size,done,percent:Math.round(done/ids.size*100),source_revision:candidate.source_revision};
}
