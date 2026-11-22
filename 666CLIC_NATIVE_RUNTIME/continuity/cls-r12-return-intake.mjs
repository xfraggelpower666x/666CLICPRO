// CLIC R14 — read-only native CLS R12 return-receipt intake.
// Existing GitHub CAS, StarBridge, inbox and provenance governance own all writes.
const SHA=/^[0-9a-f]{40}$/i;
const expected=Object.freeze({
  'CLS-01':'PRESERVE','CLS-02':'PRESERVE','CLS-03':'PRESERVE',
  'CLS-04':'HOLD','CLS-05':'OPEN_SOURCE_GATES','CLS-06':'HOST_CHECK_OPEN','CLS-07':'PRESERVE'
});
const fail=reason=>({status:'CONFLICT_QUARANTINE',reason,verified_source_receipt:false,clic_native_receipt_intake:false,foreign_runtime_adopted:false,host_verified:false,foreign_write_authorized:false});
export function evaluateClsR12Return({original,receipt,proof}={}){
  if(!original||!receipt||!proof)return fail('PROVENANCE_INPUTS_REQUIRED');
  const same=(a,b)=>a===b;
  if(proof.source_commit!=='433afe3a71759556173e3f670f4983e962a72860'||
    proof.source_tree!=='d0d676c6f2121e7377b7202c75b22f82a4536a21'||
    proof.original_blob!=='f267809ed2ec9653994b7679cafac2abdc218b95'||
    proof.recipient_commit!=='26ed77554aa97e7619d872d596c44c466b1a2152'||
    proof.recipient_tree!=='cf9966996e1f3bb17be78ef78ca129b2e58dd5c7'||
    proof.recipient_blob!=='fe8efffef57114dd6ffc5a371eb8a2a0aa2a716a'||
    proof.independent_commit_tree_blob_readback!==true)return fail('INDEPENDENT_SOURCE_AND_RECIPIENT_GIT_PROOF_REQUIRED');
  if(original.handoff_id!=='CLIC-TO-666CLS-R12-20261122-01'||
    original.recipient?.system_id!=='666CLS-CORE-001'||
    receipt.receipt_id!=='666CLS-TO-666CLIC-R12-20261122-01'||
    receipt.handoff_id!==original.handoff_id||
    receipt.source?.commit!==proof.source_commit||
    receipt.source?.tree!==proof.source_tree||
    receipt.source?.handoff_blob!==proof.original_blob||
    receipt.recipient?.system_id!=='666CLS-CORE-001'||
    receipt.decision!=='REVIEWED_NO_RUNTIME_REPAIR_REQUIRED')return fail('IDENTITY_OR_ORIGINAL_SOURCE_MISMATCH');
  if(!Array.isArray(original.findings)||!Array.isArray(receipt.findings)||
    original.findings.length!==7||receipt.findings.length!==7)return fail('SEVEN_FINDINGS_REQUIRED');
  const ids=Object.keys(expected),old=original.findings.map(x=>x.id),got=receipt.findings.map(x=>x.id);
  if(new Set(old).size!==7||new Set(got).size!==7||
    !ids.every(id=>old.includes(id)&&got.includes(id)))return fail('FINDING_CARDINALITY_OR_ID_MISMATCH');
  const decisions=ids.map(id=>({id,original:original.findings.find(x=>x.id===id).status,decision:receipt.findings.find(x=>x.id===id).decision,expected:expected[id]}));
  if(decisions.some(x=>x.decision!==x.expected))return fail('DECISION_CONTRADICTS_NATIVE_HANDOFF');
  if(receipt.gates?.cures!=='HOLD_FUNCTIONAL_PAYLOAD_SOURCE_NOT_FOUND'||
    receipt.gates?.visual_host!=='OPEN'||
    receipt.gates?.external_source_currentness!=='PARTIAL'||
    receipt.gates?.clic_adoption!=='NOT_VERIFIED'||
    receipt.return_contract?.foreign_write_performed!==false||
    receipt.policy?.no_foreign_writes!==true||
    receipt.policy?.root_pointer_unchanged!==true||
    receipt.changes?.runtime_files?.length!==0||
    receipt.changes?.release_files?.length!==0||
    receipt.changes?.foreign_files?.length!==0)return fail('OWNER_HOLD_SCOPE_OR_AUTHORITY_CONTRADICTION');
  return {status:'CLIC_NATIVE_RECEIPT_INTAKE_EVIDENCE_CANDIDATE',
    receipt_id:receipt.receipt_id,handoff_id:original.handoff_id,
    decisions,decision_match_count:decisions.length,source_original_verified:true,
    verified_source_receipt:true,clic_native_receipt_intake:false,
    foreign_runtime_adopted:false,host_verified:false,foreign_write_authorized:false,
    holds:{cures:'PRESERVED',visual_host:'OPEN',external_source_currentness:'PARTIAL'},
    requires_git_persistence_readback:true,requires_existing_clic_governance:true,
    source_commit:proof.source_commit,recipient_commit:proof.recipient_commit,
    source_blob:proof.original_blob,recipient_blob:proof.recipient_blob};
}
