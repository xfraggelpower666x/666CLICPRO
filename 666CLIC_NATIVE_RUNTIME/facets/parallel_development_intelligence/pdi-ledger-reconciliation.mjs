// PDI second-stage reconciliation after a verified CAS ledger commit.
// It NEVER replays the event through the ledger. A failed second write stays resumable.
// Distinct file from metadata CURRENT_STATE.json; root Current belongs only to Whole CLIC UPDATE.
import {validatePdiState} from "./parallel-development.mjs";
import {CLIC_LEDGER_PATH} from "../../dashboard/development_progress/development-ledger-store.mjs";
export const PDI_LEDGER_PATH="666CLIC_NATIVE_RUNTIME/facets/parallel_development_intelligence/PDI_LEDGER_CURRENT.json";
const SHA=/^[a-f0-9]{40}$/i;
const pick=x=>x?.result??x;
const valid=x=>typeof x==="string"&&SHA.test(x);
const halt=(status,reason,anchor)=>({status,reason,ledger_replayed:false,pdi_persisted:false,
 pointer_published:false,host_verified:false,return_anchor:anchor??"RESUME_PDI_AFTER_LEDGER_CAS"});
export async function reconcilePdiLedger({event_id,ledger_commit,ledger_blob,pdi_candidate,github,repository,branch,
 expected_pdi_blob,verifyOrigin}={}){
 const anchor="REVALIDATE_LEDGER_"+String(event_id??"UNKNOWN")+"_THEN_PDI_ONLY";
 if(repository!=="xfraggelpower666x/666CLICPRO"||branch!=="clic-migration-rev79-staging"||
 !valid(ledger_commit)||!valid(ledger_blob)||!valid(expected_pdi_blob)||!event_id||
 typeof verifyOrigin!=="function"||!github||
 !["readBranch","fetchFile","updateFile","fetchTree","fetchCommit"].every(k=>typeof github[k]==="function"))
  return halt("WRITE_BLOCKED","MISSING_AUTHENTICATED_CLIC_SCOPE_OR_PROOF",anchor);
 try{validatePdiState(pdi_candidate);}catch{return halt("WRITE_BLOCKED","INVALID_PDI_CANDIDATE",anchor)}
 if(!pdi_candidate.processed_event_ids.includes(event_id))
  return halt("WRITE_BLOCKED","CANDIDATE_EVENT_ID_NOT_PRESENT",anchor);
 const readHead=async()=>{
  const z=pick(await github.readBranch({repository,branch}));
  const h=z?.commit?.sha??z?.head_sha??z?.sha;
  if(!valid(h))throw Error("INVALID_GITHUB_HEAD");
  return h;
 };
 try{
  const head=await readHead();
  const origin=await verifyOrigin({ledger_commit,ledger_blob,observed_head:head,event_id});
  if(origin?.verified!==true||origin?.ledger_event_verified!==true||origin?.lineage_verified!==true)
   return halt("READBACK_PENDING","LEDGER_COMMIT_AND_EVENT_LINEAGE_NOT_INDEPENDENTLY_VERIFIED",anchor);
  // Read both ledger and PDI with explicit blob identity; never reconstruct the event by rerunning CAS.
  const ledger=pick(await github.fetchFile({repository,path:CLIC_LEDGER_PATH,ref:branch}));
  const pdi=pick(await github.fetchFile({repository,path:PDI_LEDGER_PATH,ref:branch}));
  if(!valid(ledger?.sha)||!valid(pdi?.sha)||pdi.sha!==expected_pdi_blob)
   return halt("CONFLICT_QUARANTINE","STALE_PDI_BLOB_OR_MISSING_STATE",anchor);
  const ledgerState=JSON.parse(ledger.content),pdiState=JSON.parse(pdi.content);
  validatePdiState(pdiState);
  if(!Array.isArray(ledgerState.processed_event_ids)||!ledgerState.processed_event_ids.includes(event_id)||
   ledgerState.last_event_id!==event_id||origin.ledger_blob_sha!==ledger.sha)
   return halt("READBACK_PENDING","PERSISTED_LEDGER_EVENT_MISMATCH",anchor);
  const current=new Set(pdiState.processed_event_ids);
  if(current.has(event_id))
   return {status:"PDI_ALREADY_RECONCILED",pdi_persisted:true,ledger_replayed:false,pointer_published:false,
    readback_blob_sha:pdi.sha,return_anchor:"CONTINUE_CORE_DEVELOPMENT"};
  const coreOld=pdiState.streams.find(s=>s.id==="CORE_DEVELOPMENT");
  const coreNew=pdi_candidate.streams.find(s=>s.id==="CORE_DEVELOPMENT");
  const others=pdiState.streams.filter(s=>s.id!=="CORE_DEVELOPMENT");
  if(!coreOld||!coreNew||pdi_candidate.streams.filter(s=>s.id!=="CORE_DEVELOPMENT").some(s=>{
    const old=others.find(x=>x.id===s.id);return JSON.stringify(s)!==JSON.stringify(old);
  }))return halt("CONFLICT_QUARANTINE","OTHER_STREAM_CHANGED_OR_MISSING",anchor);
  if(coreOld.tasks.some(t=>!coreNew.tasks.some(x=>x.id===t.id))||
    coreOld.obligations.some(o=>!coreNew.obligations.some(x=>x.id===o.id))||
    coreOld.interruptions.length>coreNew.interruptions.length)
   return halt("CONFLICT_QUARANTINE","CORE_CONTINUITY_LOSS",anchor);
  // No intervening PDI events can be silently overwritten by a stale candidate.
  if(pdiState.processed_event_ids.some(id=>!pdi_candidate.processed_event_ids.includes(id)))
   return halt("CONFLICT_QUARANTINE","PDI_EVENT_HISTORY_SUPERSESSION",anchor);
  if(await readHead()!==head)return halt("CONFLICT_QUARANTINE","HEAD_MOVED_BEFORE_PDI_WRITE",anchor);
  const x=pick(await github.updateFile({repository,path:PDI_LEDGER_PATH,branch,sha:pdi.sha,
   content:JSON.stringify(pdi_candidate,null,2)+"\n",message:"chore(clic): reconcile persisted Core event into PDI state"}));
  const newCommit=x?.commit_sha??x?.commit?.sha,blob=x?.content_sha??x?.content?.sha;
  if(!valid(newCommit)||!valid(blob))return halt("READBACK_PENDING","PDI_WRITE_COMMIT_RECEIPT_MISSING",anchor);
  const [readback,live,commit,tree]=await Promise.all([
   github.fetchFile({repository,path:PDI_LEDGER_PATH,ref:branch}),
   github.readBranch({repository,branch}),
   github.fetchCommit({repository,sha:newCommit}),
   github.fetchTree({repository,ref:newCommit,recursive:true})
  ]);
  const verified=pick(readback),h=pick(live),c=pick(commit),t=pick(tree);
  const headAfter=h?.commit?.sha??h?.head_sha??h?.sha;
  if(headAfter!==newCommit||verified?.sha!==blob||t?.truncated===true||
    !t?.tree?.some(z=>z.path===PDI_LEDGER_PATH&&z.sha===blob)||
    !c?.parents?.some(p=>(p?.sha??p)===head)||
    JSON.stringify(JSON.parse(verified.content))!==JSON.stringify(pdi_candidate))
   return halt("READBACK_PENDING","PDI_COMMIT_TREE_BLOB_READBACK_MISMATCH",anchor);
  return {status:"PDI_READBACK_VERIFIED",pdi_persisted:true,ledger_replayed:false,
   pdi_blob_sha:blob,pdi_commit:newCommit,pointer_published:false,host_verified:false,
   return_anchor:"CONTINUE_CORE_DEVELOPMENT"};
 }catch(e){return halt("READBACK_PENDING",String(e?.message??e),anchor)}
}
