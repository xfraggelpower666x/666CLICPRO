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

export function prepublishEvidence(p={}){
 const missing=[];
 for(const k of ["source_current_sha","original_archive_sha256","live_logo_sha256","candidate_archive_sha256","candidate_logo_sha256","prechange_backup_sha","authority_approval"]){
  if(typeof p[k]!=="string"||!p[k].trim())missing.push(k);
 }
 if(p.pet_mutated===true)missing.push("PET_MUTATION_FORBIDDEN");
 if(p.foreign_mutated===true)missing.push("FOREIGN_MUTATION_FORBIDDEN");
 if(p.source_current_sha&&p.prechange_backup_sha&&p.source_current_sha!==p.prechange_backup_sha)missing.push("BACKUP_HEAD_MISMATCH");
 return {stage:"PREPUBLISH",status:missing.length?"WRITE_BLOCKED":"ELIGIBLE_FOR_NATIVE_PUBLICATION_REVIEW",missing,may_publish_automatically:false};
}
export function postpublishEvidence(p={}){
 const missing=[];
 for(const k of ["published_release_id","published_archive_sha256","host_render_receipt","card_host_trigger_receipt","force_host_trigger_receipt","current_readback_sha"]){
  if(typeof p[k]!=="string"||!p[k].trim())missing.push(k);
 }
 if(p.foreign_mutated===true)missing.push("FOREIGN_MUTATION_FORBIDDEN");
 return {stage:"POSTPUBLISH",status:missing.length?"READBACK_PENDING":"ELIGIBLE_FOR_HOST_ACCEPTANCE_REVIEW",missing,live_accepted:false};
}
