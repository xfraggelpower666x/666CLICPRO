// Native CLIC + Junior producer acceptance. Pure preflight only; cannot connect or deploy.
const sha=v=>typeof v==="string"&&/^[a-f0-9]{40}$/.test(v);
const ok=v=>v===true;
const trustedActors=new Set(["CLIC","JUNIOR","JOINT"]);
export function inspectNativeProducerBinding(x={}) {
  const blockers=[];
  if(x.parentSystem!=="666CLIC")blockers.push("WRONG_PARENT_OR_MISSING_AUTHORITY");
  if(!sha(x.clicCurrentHead)||!ok(x.clicCurrentReadback))blockers.push("CLIC_CURRENT_UNVERIFIED");
  if(!x.juniorSource||typeof x.juniorSource!=="string"||!sha(x.juniorCurrentHead)||!ok(x.juniorCurrentReadback))blockers.push("JUNIOR_NATIVE_CURRENT_UNVERIFIED");
  if(!ok(x.nativeAuthorityApproval)||!ok(x.scopedReadPermission))blockers.push("NATIVE_APPROVAL_OR_SCOPE_MISSING");
  if(!ok(x.signedProducerBound)||!ok(x.trustedKeyBindingReadback))blockers.push("SIGNED_PRODUCER_OR_KEYS_UNBOUND");
  if(!ok(x.actorIsolationProven)||!trustedActors.has(x.actor)||x.actor==="JOINT"&&!ok(x.jointAuthorityProven))blockers.push("ACTOR_AUTHORITY_NOT_PROVEN");
  if(!ok(x.exactRevisionBinding)||!ok(x.antiReplayAcceptance))blockers.push("PROVENANCE_OR_REPLAY_GATE_OPEN");
  if(!ok(x.budgetDurableObjectBound)||!ok(x.budgetLiveReadback))blockers.push("DURABLE_BUDGET_NOT_LIVE_VERIFIED");
  if(!ok(x.workerLiveDeployment)||!ok(x.workerEndpointReadback))blockers.push("WORKER_RUNTIME_NOT_VERIFIED");
  if(!ok(x.visualHostAcceptance))blockers.push("PET_APP_VISUAL_HOST_NOT_ACCEPTED");
  if(x.foreignMutation===true)blockers.push("FOREIGN_MUTATION_FORBIDDEN");
  return {schema:"CLIC_PET_NATIVE_PRODUCER_ACCEPTANCE_V1",status:blockers.length?"BLOCKED":"ELIGIBLE_FOR_OWNER_FINAL_ACCEPTANCE",blockers,connected:false,deploy:false,write_authority:"NONE"};
}
