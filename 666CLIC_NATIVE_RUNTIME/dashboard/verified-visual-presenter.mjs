import {renderProgress} from "./development_progress/progress-evidence.mjs";
import {applyClicDevelopmentEvent,preparePresenterDevelopment} from "./development_progress/development-event-adapter.mjs";
import {systemHeader,juniorForeground} from "./unified-visual-header.mjs";
const STATES=new Set(["PREPARED","DELIVERED","ACKNOWLEDGED","ADOPTED","HOST_VERIFIED"]);

const TRIGGER_ACTIONS=new Set(["SYSTEMSTART","UPDATE","WEITER","VORNE","HOST_RECOVERY","NEW_CHAT","NEXT_CHAT","DASHBOARD","CARD","VISUAL","INTEGRATION_AUDIT"]);
export function classifyClicTrigger(raw=""){
 if(typeof raw!=="string")return {recognized:false,reason:"NOT_A_DIRECT_COMMAND",write_authority:false};
 const normalized=raw.trim().toUpperCase().replace(/\s+/g," ");
 // Recovery is an explicit direct phrase, not an inferred FORCE or ordinary chat remark.
 if(normalized==="FUCK HORST"||normalized==="666CLIC FUCK HORST")
  return {recognized:true,action:"HOST_RECOVERY",force:false,continuation:false,write_authority:false,requires_current_readback:true,presentation_only:true};
 const match=/^666CLIC(?:\s+FORCE)?\s+(INTEGRATION\s+AUDIT|SYSTEMSTART|UPDATE|WEITER|VORNE|NEW\s+CHAT|NEXT\s+CHAT|DASHBOARD|CARD|VISUAL)(?:\b|$)/.exec(normalized);
 if(!match)return {recognized:false,reason:"NOT_A_DIRECT_CLIC_TRIGGER",write_authority:false};
 const action=match[1].replace(/\s+/g,"_");
 const force=normalized.startsWith("666CLIC FORCE ");
 if(!TRIGGER_ACTIONS.has(action))return {recognized:false,reason:"UNKNOWN_ACTION",write_authority:false};
 return {recognized:true,action,force,continuation:action==="WEITER"||action==="VORNE",foreground_recovery:action==="VORNE",write_authority:action==="UPDATE",presentation_only:true};
}
export function evaluateHostRecovery(x={}){
 // A signal requests an investigation; it never establishes drift without evidence.
 const current=x.current;
 const verified=typeof current?.head==="string"&&current.head.length>0
  &&typeof current?.pointer_ref==="string"&&current.pointer_ref.length>0
  &&current.manifest_verified===true;
 if(!verified)return {status:"PARTIAL",drift_confirmed:false,reason:"CURRENT_HEAD_POINTER_MANIFEST_READBACK_REQUIRED",repairs:[],write_authority:false};
 const findings=Array.isArray(x.host_findings)?x.host_findings.filter(f=>f&&f.verified===true&&typeof f.evidence==="string"&&f.evidence.trim()&&typeof f.kind==="string"):[];
 const drift=findings.filter(f=>["STALE_STATE","HOST_OVERSTEER","RELATIONAL_FLATTENING","AUTHORITY_CONFLICT","UNSUPPORTED_FOREGROUND"].includes(f.kind));
 return {status:drift.length?"VERIFIED_DRIFT":"NO_VERIFIED_DRIFT",drift_confirmed:drift.length>0,findings:drift,repairs:drift.length?["DISCARD_UNVERIFIED_CHAT_ASSUMPTIONS","REHYDRATE_FROM_CURRENT_READ_ONLY","PRESERVE_VALID_NEWER_EVOLUTION"]:[],write_authority:false};
}
export function recoverForeground(x={}){
 const current=x.current;
 const verified=typeof current?.head==="string"&&current.head.length>0&&typeof current?.pointer_ref==="string"&&current.pointer_ref.length>0&&current.manifest_verified===true;
 if(!verified)return {status:"PARTIAL",foreground:"UNVERIFIED",reason:"CURRENT_HEAD_POINTER_MANIFEST_READBACK_REQUIRED",write_authority:false};
 return {status:"VERIFIED_CURRENT_BOUND",foreground:"WHOLE_CLIC",current_head:current.head,return_anchor:typeof x.return_anchor==="string"?x.return_anchor:null,relations_preserved:true,facets_not_reset:true,write_authority:false};
}
export function selectVisualView(x={},trigger={}){
 const action=trigger.action??"";
 const valid=(a)=>Array.isArray(a)&&a.length>0&&a.every(e=>e&&typeof e==="object"&&typeof e.evidence==="string"&&e.evidence.trim());
 const view=(type,entries=[],reason="")=>({type,entries,reason,evidence_bound:true,presentation_only:true});
 if(x.conflict?.verified===true&&valid(x.conflict.entries))return view("CONTRADICTION_MAP",x.conflict.entries,"VERIFIED_CONFLICT");
 if((action==="NEW_CHAT"||action==="NEXT_CHAT"||x.recovery?.verified===true)&&valid(x.recovery?.steps))return view("REHYDRATION_TRACE",x.recovery.steps,"GROUNDED_RECOVERY");
 if((action==="CARD"||x.card?.verified===true)&&valid(x.card?.entries))return view("SYSTEM_CARD",x.card.entries,"VERIFIED_CARD");
 if(x.development?.status==="ACTIVE"&&x.development?.authority==="666CLIC_REPO_CURRENT"&&valid(x.development?.milestones))return view("DEVELOPMENT_POSITION",x.development.milestones,"ACTIVE_EVIDENCED_WORK");
 if(valid(x.relations?.edges))return view("RELATION_GRAPH",x.relations.edges,"EVIDENCED_RELATIONS_NOT_CAUSATION");
 if(valid(x.handoff?.entries))return view("HANDOFF_CHAIN",x.handoff.entries,"RECEIPTS_CHECK_SEPARATELY");
 return view("COMPACT_STATUS",[],"NO_RELEVANT_VERIFIED_DIAGRAM_DATA");
}

export function presentWholeClic(x={}){
 const trigger=classifyClicTrigger(x.direct_command);
 let development=x.development;
 let development_event_error=null;
 if(x.development_event!==undefined){
  try{
   const ledger=applyClicDevelopmentEvent(x.development_previous,x.development_event,x.development_event_context);
   development=preparePresenterDevelopment(ledger);
  }catch(err){
   development={status:"INACTIVE",authority:"666CLIC_REPO_CURRENT"};
   development_event_error=String(err.message??err);
  }
 }
 // Project evidenced tasks into the visual milestone shape without inventing completion.
 const milestones=development?.status==="ACTIVE"&&Array.isArray(development.tasks)?development.tasks.filter(t=>t&&typeof t.id==="string"&&Array.isArray(t.evidence)&&t.evidence.length>0).map(t=>({label:t.id,status:t.status,evidence:t.evidence.join("; ")})):[];
 const contextual={...x,development:development?.status==="ACTIVE"?{...development,milestones}:development};
 const visual=selectVisualView(contextual,trigger);
 const foreground=trigger.foreground_recovery?recoverForeground(x):null;
 const host_recovery=trigger.action==="HOST_RECOVERY"?evaluateHostRecovery(x):null;
 const junior=juniorForeground({...x.junior,next_action:x.junior?.next_action??(trigger.continuation?"CONTINUE_VERIFIED_WORK":"VERIFY_CURRENT")});
 const header=systemHeader(x.identity);
 const led=development;
 const active=led?.status==="ACTIVE"&&led?.authority==="666CLIC_REPO_CURRENT";
 const verified=active?renderProgress(led):{visible:false,reason:"NO_VERIFIED_ACTIVE_CLIC_WORK"};
 const dev=active?{visible:true,progress:verified.visible?{done:verified.done,total:verified.total,percent:verified.percent}:null,reason:verified.visible?null:verified.reason,source_revision:verified.source_revision??null}:{visible:false,progress:null,reason:"NO_VERIFIED_ACTIVE_CLIC_WORK"};
 return {header,junior,developer:dev,development_event_error,trigger,visual,foreground,host_recovery,presentation_only:true,authority:"NONE",
 diagram_policy:"EVIDENCE_FIRST_NO_CAUSATION_FROM_ARROW",live_host_acceptance:false};
}
export function checkNoticeRegistry(registry={}){
 const notices=registry.notices;
 if(!Array.isArray(notices))return {valid:false,errors:["NO_NOTICE_ARRAY"]};
 const ids=new Set(),errors=[];
 for(const n of notices){
  if(!n||typeof n.id!=="string"||ids.has(n.id)||!n.id){errors.push("DUPLICATE_OR_INVALID_NOTICE_ID");continue}
  ids.add(n.id);
  if(!STATES.has(n.state))errors.push("INVALID_NOTICE_STATE:"+n.id);
  if(n.state!=="PREPARED"&&(!Array.isArray(n.receipts)||!n.receipts.length))errors.push("MISSING_EXTERNAL_RECEIPT:"+n.id);
  if(n.state==="ADOPTED"||n.state==="HOST_VERIFIED"){
   if(!n.native_authority_ref||!n.target_readback_ref)errors.push("MISSING_NATIVE_ADOPTION_EVIDENCE:"+n.id);
  }
  if(n.state==="HOST_VERIFIED"&&!n.host_render_evidence)errors.push("MISSING_HOST_RENDER_EVIDENCE:"+n.id);
 }
 return {valid:errors.length===0,errors,prepared:notices.filter(n=>n.state==="PREPARED").length,total:notices.length,delivery_confirmed:notices.filter(n=>n.state!=="PREPARED"&&!errors.some(e=>e.endsWith(":"+n.id))).length};
}
