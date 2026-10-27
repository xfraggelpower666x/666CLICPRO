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

export function assessEvidenceStages(input={}) {
 const op=input.operationId;
 if(typeof op!=='string'||!op.trim())return {status:'UNSCOPED',execute:false};
 const a=Array.isArray(input.observations)?input.observations.filter(e=>e?.operationId===op):[];
 const valid=e=>e.sourceGrade==='DIRECT_PROVIDER'&&e.independentReadback===true&&typeof e.evidenceRef==='string'&&e.evidenceRef.length>0;
 const storage=a.some(e=>valid(e)&&e.storedContentReadback===true&&e.targetParentVerified===true);
 const delivery=a.some(e=>valid(e)&&e.deliveryReceiptVerified===true);
 const recipient=a.some(e=>valid(e)&&e.recipientAcknowledgementVerified===true);
 const denied=a.some(e=>e.permissionDenied===true||e.actionDenied===true||e.safetyRefusal===true);
 const contradiction=a.some(e=>e.contradictionUnresolved===true);
 return {status:denied?'DENIED':contradiction?'CONTRADICTORY':storage&&delivery&&recipient?'STAGES_VERIFIED':'PARTIAL_EVIDENCE',storage,delivery,recipient,denied,contradiction,rootCause:'UNKNOWN',execute:false,adoption:false,host:false};
}
