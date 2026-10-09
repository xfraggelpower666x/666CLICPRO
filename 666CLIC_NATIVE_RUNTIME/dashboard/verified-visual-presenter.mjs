import {renderProgress} from "./development_progress/progress-evidence.mjs";
import {systemHeader,juniorForeground} from "./unified-visual-header.mjs";
const STATES=new Set(["PREPARED","DELIVERED","ACKNOWLEDGED","ADOPTED","HOST_VERIFIED"]);
export function presentWholeClic(x={}){
 const junior=juniorForeground(x.junior);
 const header=systemHeader(x.identity);
 const led=x.development;
 const active=led?.status==="ACTIVE"&&led?.authority==="666CLIC_REPO_CURRENT";
 const verified=active?renderProgress(led):{visible:false,reason:"NO_VERIFIED_ACTIVE_CLIC_WORK"};
 const dev=active?{visible:true,progress:verified.visible?{done:verified.done,total:verified.total,percent:verified.percent}:null,reason:verified.visible?null:verified.reason,source_revision:verified.source_revision??null}:{visible:false,progress:null,reason:"NO_VERIFIED_ACTIVE_CLIC_WORK"};
 return {header,junior,developer:dev,presentation_only:true,authority:"NONE",
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
