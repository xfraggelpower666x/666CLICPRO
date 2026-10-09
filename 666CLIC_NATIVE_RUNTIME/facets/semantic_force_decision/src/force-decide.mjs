// Pure semantic FORCE work-plan selection; no side effects or write/decision authority.
export const FORCE_SCHEMA="666CLIC_FORCE_PLAN_V1";
export function decideForce({request,current,candidates=[]}={}) {
  if (!request || request.direct_trigger!==true || request.system!=="666CLIC") return {status:"HOLD",reason:"DIRECT_CLIC_TRIGGER_REQUIRED",steps:[]};
  if (!current || current.readback!=="PASS" || !current.head || !current.pointer) return {status:"HOLD",reason:"CURRENT_REHYDRATION_REQUIRED",steps:[]};
  const safe=[],blocked=[];
  for (const c of candidates) {
    if (!c || !c.id) continue;
    const reasons=[];
    if (c.foreign_mutation===true) reasons.push("FOREIGN_MUTATION_FORBIDDEN");
    if (c.native_write===true && request.authorized_update!==true) reasons.push("NATIVE_UPDATE_TRIGGER_REQUIRED");
    if (c.write===true && (!c.permission||!c.backup||!c.lock_verified)) reasons.push("WRITE_GOVERNANCE_MISSING");
    if (c.source_verified!==true) reasons.push("SOURCE_NOT_VERIFIED");
    if (c.dependency_verified===false) reasons.push("UNVERIFIED_DEPENDENCY");
    if (c.stale===true) reasons.push("STALE_STATE");
    if (c.superseded_valid_evolution===true) reasons.push("NO_SILENT_ROLLBACK");
    if (reasons.length) {blocked.push({id:c.id,reasons});continue;}
    const impact=Number.isFinite(c.causal_impact)?Math.max(0,Math.min(10,c.causal_impact)):0;
    const urgency=Number.isFinite(c.urgency)?Math.max(0,Math.min(10,c.urgency)):0;
    const evidence=Number.isFinite(c.evidence_strength)?Math.max(0,Math.min(10,c.evidence_strength)):0;
    const risk=Number.isFinite(c.risk)?Math.max(0,Math.min(10,c.risk)):10;
    const score=4*evidence+3*impact+urgency-5*risk;
    safe.push({id:c.id,score,why:{evidence,impact,urgency,risk},write:c.write===true});
  }
  safe.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  return {schema:FORCE_SCHEMA,status:blocked.length?"PARTIAL":"PLAN_READY",steps:safe,blocked,execution_authority:"NONE",requires_runtime_gate_for_each_step:true,return_anchor:request.return_anchor||"WHOLE_CLIC_VERIFIED_CURRENT"};
}
