// CLIC repository-ledger CAS adapter: caller owns authenticated repository I/O.
// No background sensor, autonomous network, host dispatch or foreign writes.
import {applyClicDevelopmentEvent} from "./development-event-adapter.mjs";
export const CLIC_LEDGER_PATH="666CLIC_NATIVE_RUNTIME/dashboard/development_progress/DEVELOPMENT_PROGRESS_CURRENT.json";
const hex40=/^[0-9a-f]{40}$/i;
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const encode=x=>JSON.stringify(x);
export async function persistClicDevelopmentEvent(event,transport={}){
 const {readCurrent,compareAndSwap,readBack,verifyEventSource}=transport;
 if([readCurrent,compareAndSwap,readBack,verifyEventSource].some(f=>typeof f!=="function"))
  return {status:"WRITE_BLOCKED",reason:"AUTHENTICATED_ATOMIC_REPOSITORY_TRANSPORT_REQUIRED",persisted:false};
 // The injected adapter must implement expected blob-SHA rejection without force.
 const before=await readCurrent(CLIC_LEDGER_PATH);
 if(!before||!hex40.test(before.blob_sha??"")||!before.ledger||before.version_locked!==true)
  return {status:"WRITE_BLOCKED",reason:"LOCKED_CURRENT_BLOB_SHA_REQUIRED",persisted:false};
 if(!hex40.test(event?.source_revision??""))
  return {status:"WRITE_BLOCKED",reason:"INVALID_EVENT_SOURCE_REVISION",persisted:false};
 const proof=await verifyEventSource(event);
 if(proof?.verified!==true||proof.source_revision!==event.source_revision||!proof.evidence_ref_verified)
  return {status:"WRITE_BLOCKED",reason:"SOURCE_EVIDENCE_READBACK_NOT_VERIFIED",persisted:false};
 let next;
 try{
  next=applyClicDevelopmentEvent(before.ledger,event,{
   seen_event_ids:new Set(),source_readback_verified:true
  });
 }catch(e){return {status:"WRITE_BLOCKED",reason:String(e.message??e),persisted:false}}
 // Never mutate current, or report success from a staged candidate alone.
 let write;
 try{
  write=await compareAndSwap(CLIC_LEDGER_PATH,before.blob_sha,next);
 }catch(e){return {status:"WRITE_BLOCKED",reason:"CAS_WRITE_FAILED",persisted:false}}
 if(write?.cas_accepted!==true||!hex40.test(write.new_blob_sha??""))
  return {status:"CONFLICT_QUARANTINE",reason:"CAS_NOT_ACCEPTED",persisted:false};
 const after=await readBack(CLIC_LEDGER_PATH);
 if(!after||after.blob_sha!==write.new_blob_sha||encode(after.ledger)!==encode(next))
  return {status:"READBACK_PENDING",reason:"POST_WRITE_EXACT_LEDGER_READBACK_MISMATCH",persisted:false};
 return {status:"LEDGER_READBACK_VERIFIED",persisted:true,event_id:event.event_id,blob_sha:write.new_blob_sha,ledger:next,
  host_dispatch_verified:false,source_sensor_verified:false,pointer_published:false};
}
