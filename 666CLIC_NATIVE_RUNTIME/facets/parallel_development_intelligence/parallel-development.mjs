// CLIC-owned pure parallel workstream reducer. No API, timer, background action or pointer writes.
const SHA=/^[a-f0-9]{40}$/i;
const STREAMS=new Set(["CORE_DEVELOPMENT","VISUAL_INTELLIGENCE","STARBRIDGE","CODEFORGE_RECOVERY"]);
const STATES=new Set(["READY","ACTIVE","WAITING","PAUSED","COMPLETED"]);
const ACTIONS=new Set(["ACTIVATE","PAUSE","WAIT","READY","COMPLETE","EVIDENCE"]);
function clone(x){return JSON.parse(JSON.stringify(x));}
function nonempty(x){return typeof x==="string"&&x.trim().length>0;}
export function validatePdiState(state){
 if(!state||state.schema!=="CLIC_PDI_STATE_V1"||state.authority!=="WHOLE_666CLIC"||!Array.isArray(state.streams)||state.streams.length!==4)throw Error("INVALID_NATIVE_PDI_STATE");
 const ids=new Set();
 for(const s of state.streams){if(!STREAMS.has(s.id)||ids.has(s.id)||!STATES.has(s.status)||!nonempty(s.return_anchor)||!Array.isArray(s.evidence_refs)||!Array.isArray(s.obligations)||!Array.isArray(s.interruptions)||!Array.isArray(s.tasks))throw Error("INVALID_STREAM_OR_LOST_CONTINUITY");ids.add(s.id);}
 if(ids.size!==4)throw Error("STREAM_SCOPE_MISSING");
 if(!Array.isArray(state.processed_event_ids))throw Error("EVENT_LEDGER_MISSING");
 return true;
}
export function createPdiState(descriptors){
 if(!Array.isArray(descriptors)||descriptors.length!==4)throw Error("FOUR_SCOPED_STREAMS_REQUIRED");
 const streams=descriptors.map(x=>({id:x.id,status:x.status??"READY",return_anchor:x.return_anchor,evidence_refs:[...(x.evidence_refs??[])],obligations:[...(x.obligations??[])],interruptions:[...(x.interruptions??[])],tasks:[...(x.tasks??[])],last_source_head:x.last_source_head??null}));
 const state={schema:"CLIC_PDI_STATE_V1",authority:"WHOLE_666CLIC",streams,processed_event_ids:[],no_automatic_foreign_mutation:true};
 validatePdiState(state);return state;
}
export function applyPdiEvent(previous,event,proof={}){
 validatePdiState(previous);
 if(!event||!ACTIONS.has(event.action)||!STREAMS.has(event.stream_id)||!nonempty(event.event_id)||!SHA.test(event.source_head??"")||!nonempty(event.evidence_ref)||proof.independent_source_readback!==true)throw Error("EVENT_PROVENANCE_UNVERIFIED");
 if(previous.processed_event_ids.includes(event.event_id))throw Error("DUPLICATE_EVENT_REPLAY");
 if(previous.processed_event_ids.length>=5000)throw Error("EVENT_HISTORY_ROTATION_REQUIRED");
 const next=clone(previous),s=next.streams.find(x=>x.id===event.stream_id);
 if(s.last_source_head&&event.source_head!==s.last_source_head&&proof.valid_newer_evolution!==true&&proof.same_lineage_verified!==true)throw Error("SOURCE_SUPERSESSION_UNVERIFIED");
 if(event.dependencies?.length&&proof.dependency_edges_verified!==true)throw Error("CAUSAL_DEPENDENCY_NOT_VERIFIED");
 if(event.action==="COMPLETE"&&(proof.completion_readback!==true||s.tasks.some(t=>t.status!=="DONE"||t.completion_verified!==true)))throw Error("UNVERIFIED_COMPLETION");
 if(event.action==="ACTIVATE"&&s.status==="COMPLETED"&&proof.explicit_reopen!==true)throw Error("NO_SILENT_REOPEN");
 const statuses={ACTIVATE:"ACTIVE",PAUSE:"PAUSED",WAIT:"WAITING",READY:"READY",COMPLETE:"COMPLETED"};
 if(statuses[event.action])s.status=statuses[event.action];
 if(event.action==="PAUSE")s.interruptions.push({event_id:event.event_id,source_head:event.source_head,evidence_ref:event.evidence_ref});
 if(nonempty(event.return_anchor))s.return_anchor=event.return_anchor;
 if(event.obligation&&nonempty(event.obligation.id)&&nonempty(event.obligation.evidence_ref)&&!s.obligations.some(x=>x.id===event.obligation.id))s.obligations.push(event.obligation);
 if(event.task&&nonempty(event.task.id)&&nonempty(event.task.evidence_ref)){
  const prior=s.tasks.find(x=>x.id===event.task.id);
  if(prior){if(event.task.status==="DONE"&&proof.completion_readback!==true)throw Error("TASK_COMPLETION_UNVERIFIED");Object.assign(prior,event.task);}
  else {if(event.task.status==="DONE"&&proof.completion_readback!==true)throw Error("TASK_COMPLETION_UNVERIFIED");s.tasks.push(event.task);}
 }
 s.evidence_refs.push(event.evidence_ref);s.last_source_head=event.source_head;
 next.processed_event_ids.push(event.event_id);
 return next;
}
export function developmentPosition(state){
 validatePdiState(state);
 return {authority:state.authority,status:"EVIDENCE_SCOPED_SNAPSHOT",streams:state.streams.map(s=>({id:s.id,status:s.status,return_anchor:s.return_anchor,open_obligations:s.obligations.length,interruptions:s.interruptions.length,task_count:s.tasks.length,evidence_count:s.evidence_refs.length})),auto_dispatch:false,may_write_pointer:false};
}
