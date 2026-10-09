// Advisory qualitative outcome, additive to CLIC's existing bounded planner.
export const OUTCOMES=Object.freeze(["HOLD","VERIFY","REPAIR","EXPLORE","EXECUTE","COMPLETE_NO_CHANGE"]);
export function suggestOutcome(input={}) {
  if(input.nativeAuthorityVerified!==true) return {outcome:"HOLD",reason:"NATIVE_AUTHORITY_NOT_VERIFIED",execute:false};
  if(input.foreignMutation===true||input.permissionDenied===true) return {outcome:"HOLD",reason:"AUTHORITY_BOUNDARY",execute:false};
  if(input.currentReadback!=="PASS"||input.contradictionUnresolved===true) return {outcome:"VERIFY",reason:"CURRENT_OR_CONTRADICTION_UNVERIFIED",execute:false};
  if(input.goalAlreadySatisfied===true && input.materialDeltaVerified===false) return {outcome:"COMPLETE_NO_CHANGE",reason:"NO_MEANINGFUL_DELTA",execute:false};
  if(input.regressionVerified===true && input.recoveryVerified===true) return {outcome:"REPAIR",reason:"VERIFIED_BOUNDED_REPAIR_CANDIDATE",execute:false};
  if(input.changeHypothesis===true && input.outcomeEvidence!==true) return {outcome:"EXPLORE",reason:"HYPOTHESIS_NE_VERIFIED_OUTCOME",execute:false};
  if(input.writeRequested===true && (input.userAuthorizedUpdate!==true||input.lockVerified!==true||input.backupVerified!==true)) return {outcome:"HOLD",reason:"WRITE_GOVERNANCE_REQUIRED",execute:false};
  return {outcome:"EXECUTE",reason:"AUTHORIZED_CANDIDATE_REQUIRES_STEP_LOCAL_VALIDATION",execute:false};
}
