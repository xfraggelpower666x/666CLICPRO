// CLIC-native presentation only; no writes or authority.
export const colors={pink:"#FF2DAA",cyan:"#00E5FF",lila:"#A855F7",rosa:"#FF8ACD"};
export function systemHeader(x={}){
 const required=["system_id","name","type","status","authority","evidence"];
 const missing=required.filter(k=>!x[k]||typeof x[k]!=="string");
 return {ready:missing.length===0,missing,...x,created_at:x.created_at??"UNKNOWN",modified_at:x.modified_at??"UNKNOWN",
 logo:x.logo_verified===true?x.logo:null,visual_tokens:colors,copyright:"Copyright © 2026 by fragglepower666 - 666SOUNDsDESIGn",presentation_only:true};
}
export function juniorForeground(x={}){
 return {visible:true,pinned:true,role:"CLIC_FOREGROUND_COMPANION",system_id:"666CLIC",status:x.status??"UNKNOWN",evidence:x.evidence??"NOT_VERIFIED",next_action:x.next_action??"VERIFY_CURRENT",pet_development:"PAUSED",worker_execution:"NOT_AUTO_ACTIVATED",write_authority:"NONE"};
}
export function developerPanel(x={}){
 const junior=juniorForeground(x.junior??{});
 if(x.active!==true)return{visible:false,progress:null,junior};
 if(!Array.isArray(x.tasks)||x.tasks.length===0)return{visible:true,progress:null,reason:"NO_VERIFIED_TASK_UNIVERSE",junior};
 const ids=x.tasks.map(t=>t.id);if(ids.some(v=>!v)||new Set(ids).size!==ids.length)return{visible:true,progress:null,reason:"INVALID_TASK_IDS",junior};
 const done=x.tasks.filter(t=>t.state==="DONE");if(done.some(t=>!t.evidence))return{visible:true,progress:null,reason:"MISSING_COMPLETION_EVIDENCE",junior};
 return {visible:true,progress:{done:done.length,total:x.tasks.length,percent:100*done.length/x.tasks.length},junior};
}
