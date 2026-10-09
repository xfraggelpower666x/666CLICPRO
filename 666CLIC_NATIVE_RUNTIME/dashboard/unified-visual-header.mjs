// CLIC-native presentation only; no writes or authority.
export const colors={pink:"#FF2DAA",cyan:"#00E5FF",lila:"#A855F7",rosa:"#FF8ACD"};
export function systemHeader(x={}){
 const required=["system_id","name","type","status","authority","evidence"];
 const missing=required.filter(k=>!x[k]||typeof x[k]!=="string");
 return {ready:missing.length===0,missing,...x,created_at:x.created_at??"UNKNOWN",modified_at:x.modified_at??"UNKNOWN",
 logo:x.logo_verified===true?x.logo:null,visual_tokens:colors,copyright:"Copyright © 2026 by fragglepower666 - 666SOUNDsDESIGn",presentation_only:true};
}
export function developerPanel(x={}){
 if(x.active!==true)return{visible:false,progress:null};
 if(!Array.isArray(x.tasks)||x.tasks.length===0)return{visible:true,progress:null,reason:"NO_VERIFIED_TASK_UNIVERSE"};
 const ids=x.tasks.map(t=>t.id);if(ids.some(v=>!v)||new Set(ids).size!==ids.length)return{visible:true,progress:null,reason:"INVALID_TASK_IDS"};
 const done=x.tasks.filter(t=>t.state==="DONE");if(done.some(t=>!t.evidence))return{visible:true,progress:null,reason:"MISSING_COMPLETION_EVIDENCE"};
 return {visible:true,progress:{done:done.length,total:x.tasks.length,percent:100*done.length/x.tasks.length},junior:{foreground:true,pet_development:"PAUSED",worker:"NOT_AUTO_ACTIVATED"}};
}
