// CLIC-owned native TDI R11 receipt intake. Source evidence is inert.
// This module never performs repository or foreign-system writes.
const REQUIRED=Object.freeze({
  'TDI-01':'ACCEPTED_INVENTORY_VERIFIED',
  'TDI-02':'ACCEPTED_NO_ROLLBACK',
  'TDI-03':'REPAIRED_OPTIONAL_AUDIO_DEPENDENCY',
  'TDI-04':'PRESERVED_SCOPED_LEARNING_NO_GLOBAL_PROMOTION',
  'TDI-05':'OPTIONAL_REAL_AUDIO_GATE_OPEN',
  'TDI-06':'VISUAL_HOST_PARITY_NOT_VERIFIED'
});
const VALUES=Object.values(REQUIRED);
const DENY=reason=>({status:'CONFLICT_QUARANTINE',reason,ack_eligible:false,foreign_runtime_adopted:false,host_accepted:false,foreign_write_authorized:false});
export function evaluateTdiR11Return({handoff,receipt,proof}={}){
  if(!handoff||!receipt||!proof)return DENY('ALL_THREE_INPUTS_REQUIRED');
  if(proof.source_commit!=='0d955834f58181cf1b0cb94c8c81dc299c07dbfe'||
     proof.source_tree!=='f39f2dd42562d0d171346335f905a3ca8b22c615'||
     proof.handoff_blob!=='b9dfe4a3e153dc494f3966e216787cbf8918c529'||
     proof.integration_commit!=='0fe9dd81570aaaee2251072d0a2111d68a0f0196'||
     proof.integration_tree!=='bb9886c2ab31ff67844bad6a36c992ed436c11c2'||
     proof.integration_tdi_tree!=='05e459598d8fd79b421c8d59ba3db665d7e08293'||
     proof.receipt_blob!=='f37865eb6984a9b1cffd5e98422b986f12f2de28'||
     proof.independent_git_readback!==true)return DENY('IMMUTABLE_GIT_PROVENANCE_REQUIRED');
  if(handoff.handoff_id!=='CLIC-TO-666TDI-R11-20261122-01'||
     handoff.source_system!=='666CLIC'||
     handoff.target_system_id!=='666TDI-001'||
     handoff.target_repo!=='xfraggelpower666x/666MAIN_BRAIN_MYCEL_SYSTEM'||
     handoff.status!=='PREPARED_SOURCE_REPO_ONLY_NOT_DELIVERED'||
     receipt.handoff_id!==handoff.handoff_id||
     receipt.receipt_id!=='666TDI-TO-666CLIC-R11-20261122-01'||
     receipt.producer!=='666TDI-001'||receipt.recipient!=='666CLIC'||
     receipt.native_repo!==handoff.target_repo||
     receipt.native_branch!=='666MAIN_BRAIN'||
     receipt.native_root!=='PROJECTS/666TDI'||
     receipt.source_repo!=='xfraggelpower666x/666CLICPRO'||
     receipt.source_branch!=='clic-migration-rev79-staging'||
     receipt.source_commit!==proof.source_commit||
     receipt.source_tree!==proof.source_tree||
     receipt.source_handoff_blob!==proof.handoff_blob||
     receipt.native_integration_commit_verified!==proof.integration_commit||
     receipt.native_integration_tree_verified!==proof.integration_tree||
     receipt.native_tdi_tree_verified!==proof.integration_tdi_tree)return DENY('HANDOFF_OR_RECEIPT_IDENTITY_CONFLICT');
  if(!Array.isArray(handoff.findings)||handoff.findings.length!==6||
     !Array.isArray(receipt.decisions)||receipt.decisions.length!==6)return DENY('SIX_FINDINGS_REQUIRED');
  const sourceIds=handoff.findings.map(x=>x.id);
  const decisions=receipt.decisions;
  const returnedIds=decisions.map(x=>x.id);
  const expectedIds=Object.keys(REQUIRED);
  if(new Set(sourceIds).size!==6||new Set(returnedIds).size!==6||
     !expectedIds.every(id=>sourceIds.includes(id)&&returnedIds.includes(id)))return DENY('TDI_01_06_ID_CONFLICT');
  if(decisions.some(x=>x.decision!==REQUIRED[x.id]))return DENY('TDI_DECISION_CONFLICT');
  if(receipt.decision_status!=='NATIVE_ADOPTED_SOURCE_SCOPE_ONLY'||
     receipt.foreign_repo_write!==false||
     receipt.no_foreign_activation!==true||
     receipt.no_cross_system_merge!==true||
     receipt.recipient_delivery_verified!==false||
     receipt.recipient_adoption_verified!==false||
     receipt.root_pointer_last_required!==true||
     receipt.tests?.real_audio!=='NOT_EXECUTED'||
     receipt.tests?.host_gui!=='NOT_EXECUTED'||
     receipt.tests?.github_ci!=='NOT_EXECUTED')return DENY('SCOPE_HOST_OR_EVIDENCE_OVERCLAIM');
  return {status:'CLIC_TDI_R11_NATIVE_SOURCE_ACCEPTANCE_CANDIDATE',
    ack_eligible:true,receipt_id:receipt.receipt_id,handoff_id:handoff.handoff_id,
    verified_decisions:expectedIds.map(id=>({id,decision:REQUIRED[id]})),
    source_commit:proof.source_commit,recipient_integration_commit:proof.integration_commit,
    source_blob:proof.handoff_blob,recipient_blob:proof.receipt_blob,
    foreign_runtime_adopted:false,host_accepted:false,foreign_write_authorized:false,
    real_audio_required:false,visual_host:'OPEN',clic_persistence_requires_git_readback:true};
}
