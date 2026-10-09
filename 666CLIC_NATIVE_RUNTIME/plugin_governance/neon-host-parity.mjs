import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
export function evaluateNeonSourceParity(paths={}) {
 const errors=[];
 for(const key of ["dashboard","visual","reference"]){
  if(typeof paths[key]!=="string"||!paths[key]){errors.push("MISSING_"+key.toUpperCase());continue}
  const body=read(paths[key]);
  for(const token of ["NEON_PINK","JUNIOR","PET"]){
   if(!body.includes(token))errors.push(key.toUpperCase()+"_MISSING_"+token)
  }
 }
 return {status:errors.length?"SOURCE_BLOCKED":"SOURCE_READY_HOST_UNVERIFIED",errors,plugin_live_release:"0.1.22_UNCHANGED",host_tested:false,binary_verified:false,publish_allowed:false};
}
export function gateHostAcceptance(p={}){
 const missing=[];
 for(const key of ["original_archive_hash","live_logo_hash","host_render_receipt","host_trigger_receipt","release_id_readback","native_current_readback"]){
  if(typeof p[key]!=="string"||!p[key])missing.push(key)
 }
 if(p.pet_mutated===true)missing.push("PET_MUTATION_FORBIDDEN");
 return {status:missing.length?"WRITE_BLOCKED":"ELIGIBLE_FOR_NATIVE_RELEASE_REVIEW",missing,automatic_publication:false};
}
