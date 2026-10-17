// CLIC-native Core Ledger -> PDI candidate, no second event engine or pointer writer.
// The CAS store alone owns Ledger mutation; PDI stays a read-only derived candidate.
import {persistClicDevelopmentEvent} from "../../dashboard/development_progress/development-ledger-store.mjs";
import {preparePresenterDevelopment} from "../../dashboard/development_progress/development-event-adapter.mjs";
import {renderProgress} from "../../dashboard/development_progress/progress-evidence.mjs";
import {applyPdiEvent,developmentPosition,validatePdiState} from "./parallel-development.mjs";
const SHA=/^[a-f0-9]{40}$/i, path="666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json";
const fail=(reason,status="WRITE_BLOCKED")=>({status,reason,pdi_committed:false,pointer_published:false,host_verified:false});
export async function bindVerifiedCoreLedger({event,pdi_state,transport,proof}={}){
 try{validatePdiState(pdi_state);}catch{return fail("INVALID_PDI_STATE");}
 if(!event||!SHA.test(event.source_revision??"")||!event.event_id||!event.evidence_ref||!transport||
 !["readCurrent","compareAndSwap","readBack","verifyEventSource","readHead"].every(k=>typeof transport[k]==="function"))
  return fail("AUTHENTICATED_LEDGER_AND_HEAD_TRANSPORT_REQUIRED");
 if(proof?.source_commit_verified!==true||proof?.source_evidence_verified!==true||
 !SHA.test(proof?.base_head??"")||!SHA.test(proof?.expected_ledger_blob??""))
  return fail("INDEPENDENT_SOURCE_AND_BASE_PROOF_REQUIRED");
 const base=await transport.readHead();
 if(base!==proof.base_head)return fail("CONCURRENT_HEAD_CHANGE","CONFLICT_QUARANTINE");
 const current=await transport.readCurrent(path);
 if(current?.blob_sha!==proof.expected_ledger_blob||current?.version_locked!==true)
  return fail("STALE_LEDGER_BLOB","CONFLICT_QUARANTINE");
 if(pdi_state.processed_event_ids.includes(event.event_id))return fail("PDI_EVENT_REPLAY");
 // Existing CAS store performs source verifier, event reducer, atomic compare-and-swap and exact readback.
 const persisted=await persistClicDevelopmentEvent(event,transport);
 if(persisted.status!=="LEDGER_READBACK_VERIFIED"||persisted.persisted!==true)
  return fail(persisted.reason??"LEDGER_NOT_PERSISTED",persisted.status);
 if(persisted.event_id!==event.event_id||!SHA.test(persisted.blob_sha??"")||
 !Array.isArray(persisted.ledger?.processed_event_ids)||
 !persisted.ledger.processed_event_ids.includes(event.event_id)||
 persisted.ledger.last_event_id!==event.event_id||
 persisted.ledger.source_revision!==event.source_revision)
  return fail("PERSISTED_EVENT_IDENTITY_MISMATCH","READBACK_PENDING");
 const commit=await transport.readHead();
 // Expected change of HEAD is solely the authenticated CAS write. Caller must prove exact commit lineage.
 if(!SHA.test(commit??"")||proof.verifyCasCommit===undefined||typeof proof.verifyCasCommit!=="function"||
 await proof.verifyCasCommit({base_head:base,head:commit,blob_sha:persisted.blob_sha,event_id:event.event_id})!==true)
  return fail("CAS_COMMIT_LINEAGE_NOT_VERIFIED","READBACK_PENDING");
 const action={START:"ACTIVATE",PAUSE:"PAUSE",RESUME:"ACTIVATE",COMPLETE:"COMPLETE",
  TASK_STATUS:"EVIDENCE",INACTIVE:"WAIT"}[event.type];
 if(!action)return fail("UNSUPPORTED_EVENT");
 const core=pdi_state.streams.find(s=>s.id==="CORE_DEVELOPMENT");
 if(!core)return fail("CORE_WORKSTREAM_MISSING");
 // Preserve obligations, interruptions and return anchors; only evidence-scoped Core changes.
 const pdiEvent={event_id:event.event_id,stream_id:"CORE_DEVELOPMENT",action,
   source_head:event.source_revision,evidence_ref:event.evidence_ref,
   return_anchor:event.return_anchor??core.return_anchor};
 const completion=action==="COMPLETE"&&persisted.ledger.status==="COMPLETED";
 const candidate=applyPdiEvent(pdi_state,pdiEvent,{
   independent_source_readback:true,
   same_lineage_verified:proof.same_lineage_verified===true,
   valid_newer_evolution:proof.valid_newer_evolution===true,
   completion_readback:completion&&proof.completion_readback===true});
 // Canonical ledger tasks are readback verified by the existing CAS reducer.
 // Preserve unrelated PDI work: if a previously tracked core task disappears, fail closed.
 const canonicalTasks=persisted.ledger.tasks??[];
 if(!Array.isArray(canonicalTasks)||canonicalTasks.some(t=>!t||!t.id||!Array.isArray(t.evidence)||!t.evidence.length||
   (t.status==="DONE"&&t.completion_verified!==true)))return fail("LEDGER_TASK_PROVENANCE_UNVERIFIED","READBACK_PENDING");
 const ids=new Set(canonicalTasks.map(t=>t.id));
 if(core.tasks.some(t=>!ids.has(t.id)))return fail("CORE_TASK_SUPERSESSION_UNVERIFIED","CONFLICT_QUARANTINE");
 candidate.streams.find(s=>s.id==="CORE_DEVELOPMENT").tasks=canonicalTasks.map(t=>({
   id:t.id,status:t.status,completion_verified:t.status==="DONE"&&t.completion_verified===true,
   evidence_ref:t.evidence.join("; "),source_revision:event.source_revision}));
 if(action==="COMPLETE"&&canonicalTasks.some(t=>t.status!=="DONE"||t.completion_verified!==true))
   return fail("UNVERIFIED_LEDGER_TASK_COMPLETION","READBACK_PENDING");
 const present=preparePresenterDevelopment(persisted.ledger);
 const progress=renderProgress(present);
 return {status:"PDI_CANDIDATE_READBACK_BOUND",source_readback:true,ledger_persisted:true,
    ledger_blob_sha:persisted.blob_sha,source_revision:event.source_revision,event_id:event.event_id,
    pdi_candidate:candidate,development_position:developmentPosition(candidate),
    presenter:present,progress,
    pdi_committed:false,pointer_published:false,host_verified:false,plugin_parity_verified:false,
    peer_delivery_verified:false,foreign_mutation:false};
 }catch(e){return fail(String(e?.message??e));}
}
