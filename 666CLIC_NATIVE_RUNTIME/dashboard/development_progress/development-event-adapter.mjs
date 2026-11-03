// Whole-CLIC verified development event adapter. Pure: caller authenticates evidence and persists via native governance.
const SHA=/^[a-f0-9]{40}$/i;
const TYPES=new Set(["START","TASK_STATUS","PAUSE","RESUME","COMPLETE","INACTIVE"]);
const TASK_STATES=new Set(["OPEN","IN_PROGRESS","DONE","BLOCKED"]);
function validTask(t){
 return t&&typeof t.id==="string"&&t.id.trim()&&TASK_STATES.has(t.status)&&
 Array.isArray(t.evidence)&&t.evidence.length>0&&t.evidence.every(e=>typeof e==="string"&&e.trim())&&
 (t.status!=="DONE"||t.completion_verified===true);
}
function validateTasks(tasks){
 if(!Array.isArray(tasks)||!tasks.length||tasks.length>1000)throw Error("VERIFIED_TASK_UNIVERSE_REQUIRED");
 const ids=new Set();
 for(const t of tasks){
  if(!validTask(t)||ids.has(t.id))throw Error("INVALID_OR_UNVERIFIED_TASK");
  ids.add(t.id);
 }
 return tasks.map(t=>({id:t.id,status:t.status,evidence:[...t.evidence],completion_verified:t.status==="DONE"}));
}
export function applyClicDevelopmentEvent(previous,event,context={}){
 if(!event||!TYPES.has(event.type)||!SHA.test(event.source_revision??"")||
 typeof event.event_id!=="string"||!event.event_id.trim()||
 typeof event.evidence_ref!=="string"||!event.evidence_ref.trim())throw Error("VERIFIED_EVENT_PROVENANCE_REQUIRED");
 if(!(context.seen_event_ids instanceof Set)||context.seen_event_ids.has(event.event_id)||
 (Array.isArray(previous?.processed_event_ids)&&previous.processed_event_ids.includes(event.event_id))||
 context.source_readback_verified!==true)throw Error("EVENT_REPLAY_OR_SOURCE_UNVERIFIED");
 const before=previous??{schema:"666CLIC_DEVELOPMENT_PROGRESS_V1",status:"INACTIVE",authority:"666CLIC_REPO_CURRENT",current_work:null};
 if(before.schema!=="666CLIC_DEVELOPMENT_PROGRESS_V1"||before.authority!=="666CLIC_REPO_CURRENT")throw Error("WRONG_NATIVE_AUTHORITY");
 const history=Array.isArray(before.processed_event_ids)?before.processed_event_ids:[];
 if(history.length>=5000)throw Error("EVENT_HISTORY_ROTATION_REQUIRED");
 const finish=(state)=>({...state,processed_event_ids:[...history,event.event_id]});
 if(event.type==="INACTIVE")return finish( {schema:before.schema,status:"INACTIVE",authority:before.authority,current_work:null,source_revision:event.source_revision,tasks:[],last_event_id:event.event_id});
 if(event.type==="START"){
  if(before.status!=="INACTIVE"&&before.status!=="COMPLETED")throw Error("WORK_ALREADY_PRESENT");
  if(typeof event.title!=="string"||!event.title.trim())throw Error("TITLE_REQUIRED");
  const tasks=validateTasks(event.tasks);
  return finish({schema:before.schema,status:"ACTIVE",authority:before.authority,current_work:event.title,source_revision:event.source_revision,tasks,last_event_id:event.event_id});
 }
 if(!["ACTIVE","PAUSED"].includes(before.status))throw Error("NO_ACTIVE_WORK");
 if(!Array.isArray(before.tasks)||!before.tasks.length)throw Error("MISSING_PRIOR_TASKS");
 // Every carried task must remain evidence-backed; no guessed completion.
 const tasks=validateTasks(before.tasks);
 if(event.type==="TASK_STATUS"){
  if(before.status!=="ACTIVE"||!TASK_STATES.has(event.task_status))throw Error("INVALID_TASK_TRANSITION");
  if(!tasks.some(t=>t.id===event.task_id))throw Error("UNKNOWN_TASK");
  const next=tasks.map(t=>t.id===event.task_id?{...t,status:event.task_status,evidence:[event.evidence_ref],completion_verified:event.task_status==="DONE"&&event.completion_verified===true}:t);
  return finish({...before,tasks:validateTasks(next),source_revision:event.source_revision,last_event_id:event.event_id});
 }
 if(event.type==="PAUSE"&&before.status!=="ACTIVE"||event.type==="RESUME"&&before.status!=="PAUSED"||event.type==="COMPLETE"&&before.status!=="ACTIVE")throw Error("INVALID_LIFECYCLE_TRANSITION");
 if(event.type==="COMPLETE"&&tasks.some(t=>t.status!=="DONE"))throw Error("UNFINISHED_TASKS");
 const status={PAUSE:"PAUSED",RESUME:"ACTIVE",COMPLETE:"COMPLETED"}[event.type];
 return finish({...before,status,source_revision:event.source_revision,last_event_id:event.event_id,tasks});
}
export function preparePresenterDevelopment(ledger={}){
 if(ledger.schema!=="666CLIC_DEVELOPMENT_PROGRESS_V1"||ledger.authority!=="666CLIC_REPO_CURRENT")return {status:"INACTIVE",authority:"666CLIC_REPO_CURRENT"};
 return ledger.status==="ACTIVE"?{status:"ACTIVE",authority:ledger.authority,source_revision:ledger.source_revision,tasks:ledger.tasks,current_work:ledger.current_work}: {status:ledger.status,authority:ledger.authority,source_revision:ledger.source_revision??null};
}
