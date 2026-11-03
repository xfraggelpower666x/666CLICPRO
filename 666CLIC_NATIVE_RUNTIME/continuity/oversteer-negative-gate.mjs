// CLIC-only pre-rehydration diagnostic: pure evaluation, never host-level interceptor.
const CHECKS=new Set(["HOST_ASSUMPTION_AS_AUTHORITY","HISTORICAL_HANDOFF_PROMOTION","FOREIGN_NATIVE_AUTOACTIVATION","FACET_SCOPE_BLEED","RELATIONAL_FLATTENING","NEWER_VALID_EVOLUTION_LOSS","WORKSPACE_INHERITANCE","UNSUPPORTED_AUTO_FOREGROUND"]);
export function inspectOversteer(input={}){
 const violations=[];
 for(const key of CHECKS) if(input[key]===true)violations.push(key);
 const current=input.clic_current;
 if(!current||!(/^[0-9a-f]{40}$/.test(current.head??""))||current.direct_readback!==true)violations.push("CURRENT_NOT_DIRECTLY_VERIFIED");
 if(input.foreign_native_write===true)violations.push("FOREIGN_MUTATION_FORBIDDEN");
 if(input.pet_development!=="PAUSED")violations.push("PET_PAUSE_UNVERIFIED");
 return {status:violations.length?"REVALIDATE_CURRENT_READ_ONLY":"SOURCE_GUARD_PASS_NOT_HOST_ACCEPTANCE",violations,authority:"666CLIC_ONLY",host_interception:false,foreign_write_allowed:false,pet_activation_allowed:false,decision_authority:"NONE"};
}
export function classifySemanticTransfer(x={}){
 const axes=["source_currentness","semantic_understanding","causal_applicability","execution_verification"];
 const missing=axes.filter(k=>x[k]!==true);
 if(x.source_system==="LYVRA"&&x.decision_authority==="LYVRA")return {status:missing.length?"INFORMATIONAL_ONLY":"ELIGIBLE_FOR_CLIC_NATIVE_ANALYSIS_ONLY",missing,foreign_auto_activation:false,authority_transferred:false};
 return {status:"QUARANTINE_UNBOUND_SOURCE_AUTHORITY",missing,foreign_auto_activation:false,authority_transferred:false};
}
