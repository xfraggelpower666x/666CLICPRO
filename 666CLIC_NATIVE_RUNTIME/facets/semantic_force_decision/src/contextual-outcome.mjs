// Advisory qualitative outcome, additive to CLIC's existing bounded planner.
export const OUTCOMES=Object.freeze(["HOLD","VERIFY","REPAIR","EXPLORE","EXECUTE","COMPLETE_NO_CHANGE"]);
// Optional operation-local evidence. Positive outcomes elsewhere never unlock a denied operation.
export function assessOperationEvidence(input={}) {
 const op=typeof input.operationId==="string"&&input.operationId.trim()?input.operationId:null;
 const record=Array.isArray(input.operationOutcomes)?input.operationOutcomes:[];
 if(!op)return {status:"UNSCOPED",reason:"NO_OPERATION_ID",execute:false};
 const local=record.filter(x=>x&&x.operationId===op);
 if(local.some(x=>x.permissionDenied===true||x.actionDenied===true))
  return {status:"DENIED",reason:"OPERATION_LOCAL_DENIAL",execute:false};
 if(local.some(x=>x.hostAuthorityVerified!==true&&x.hostActionRequested===true))
  return {status:"UNVERIFIED",reason:"HOST_AUTHORITY_NOT_VERIFIED",execute:false};
 const successes=local.filter(x=>x.currentReadback==="PASS"&&x.independentReadback===true&&typeof x.evidenceRef==="string"&&x.evidenceRef.length>0);
 if(successes.length)return {status:"READBACK_VERIFIED",reason:"INDEPENDENT_OPERATION_OUTCOME",execute:false,evidence_count:successes.length};
 return {status:"OPEN",reason:"NO_OPERATION_LOCAL_POSITIVE_EVIDENCE",execute:false};
}
export function suggestOutcome(input={}) {
 const local=assessOperationEvidence(input);
 if(local.status==="DENIED")return {outcome:"HOLD",reason:"OPERATION_LOCAL_DENIAL",execute:false};
 if(local.status==="UNVERIFIED")return {outcome:"HOLD",reason:"HOST_AUTHORITY_NOT_VERIFIED",execute:false};
  if(input.nativeAuthorityVerified!==true) return {outcome:"HOLD",reason:"NATIVE_AUTHORITY_NOT_VERIFIED",execute:false};
  if(input.foreignMutation===true||input.permissionDenied===true) return {outcome:"HOLD",reason:"AUTHORITY_BOUNDARY",execute:false};
  if(input.currentReadback!=="PASS"||input.contradictionUnresolved===true) return {outcome:"VERIFY",reason:"CURRENT_OR_CONTRADICTION_UNVERIFIED",execute:false};
  if(input.goalAlreadySatisfied===true && input.materialDeltaVerified===false) return {outcome:"COMPLETE_NO_CHANGE",reason:"NO_MEANINGFUL_DELTA",execute:false};
  if(input.regressionVerified===true && input.recoveryVerified===true) return {outcome:"REPAIR",reason:"VERIFIED_BOUNDED_REPAIR_CANDIDATE",execute:false};
  if(input.changeHypothesis===true && input.outcomeEvidence!==true) return {outcome:"EXPLORE",reason:"HYPOTHESIS_NE_VERIFIED_OUTCOME",execute:false};
  if(input.writeRequested===true && (input.userAuthorizedUpdate!==true||input.lockVerified!==true||input.backupVerified!==true)) return {outcome:"HOLD",reason:"WRITE_GOVERNANCE_REQUIRED",execute:false};
  return {outcome:"EXECUTE",reason:"AUTHORIZED_CANDIDATE_REQUIRES_STEP_LOCAL_VALIDATION",execute:false};
}

/**
 * Advisory goal-preservation assessment, not a retry or send authorization.
 * Semantic identity must be independently supplied; operation IDs alone cannot
 * distinguish a genuinely new action from replay of a denied action.
 */
export function assessGoalContinuity(input={}) {
 const goalId=typeof input.goalId==="string"&&input.goalId.trim()?input.goalId:null;
 const operationId=typeof input.operationId==="string"&&input.operationId.trim()?input.operationId:null;
 const goalStatus=input.goalStatus==="OPEN_NOT_DELIVERED"?"OPEN_NOT_DELIVERED":"UNVERIFIED";
 const records=Array.isArray(input.operationOutcomes)?input.operationOutcomes:[];
 const operation=assessOperationEvidence({operationId,operationOutcomes:records});
 const semanticKey=typeof input.semanticActionKey==="string"&&input.semanticActionKey.trim()?input.semanticActionKey:null;
 const deniedKeys=records.filter(x=>x&&(x.actionDenied===true||x.permissionDenied===true))
  .map(x=>x.semanticActionKey).filter(x=>typeof x==="string"&&x.trim());
 const sameSemanticDenial=semanticKey!==null&&deniedKeys.includes(semanticKey);
 const denied=records.filter(x=>x&&(x.actionDenied===true||x.permissionDenied===true));
 const hasPriorDenial=denied.length>0;
 // A semantic key is a hint, not proof: preserve goal identity across renaming.
 const keyGoal=x=>typeof x==="string"&&x.includes(":")?x.slice(0,x.indexOf(":")):null;
 const sameGoalDenial=goalId!==null&&denied.some(x=>
  (typeof x.goalId==="string"&&x.goalId===goalId)||
  (typeof x.goalId!=="string"&&keyGoal(x.semanticActionKey)===goalId));
 // Referenced provenance can be audited by an independent host; this pure
 // advisory function cannot itself authenticate that reference.
 const proof=input.independenceEvidence;
 const provenancePresent=proof&&typeof proof==="object"&&
  proof.goalId===goalId&&
  typeof proof.evidenceRef==="string"&&proof.evidenceRef.trim().length>0&&
  proof.source==="INDEPENDENT_REVIEW"&&
  Array.isArray(proof.deniedOperationIds)&&
  denied.every(x=>typeof x.operationId==="string"&&
   proof.deniedOperationIds.includes(x.operationId));
 const unresolvedIdentity=hasPriorDenial&&!sameSemanticDenial&&
  (sameGoalDenial||!semanticKey||!goalId||!provenancePresent);
 const operationStatus=(operation.status==="DENIED"||sameSemanticDenial)?"DENIED":
  unresolvedIdentity?"REVIEW_REQUIRED":operation.status;
 return {goalId,goalStatus,operationId,operationStatus,
  reason:sameSemanticDenial?"SEMANTIC_DENIAL_NO_REPLAY":
   sameGoalDenial?"SAME_GOAL_DENIAL_REQUIRES_REVIEW":
   unresolvedIdentity?"INDEPENDENCE_PROVENANCE_NOT_VERIFIED":operation.reason,
  execute:false,sendAuthorized:false};
}
