// CLIC-owned, source-only R02 receipt writer gate. NEVER invoke without separate CLIC-native authorization.
// Reuses existing authenticated GitHub tree/commit/ref CAS tools, no foreign writes or automatic adoption.
export const R02_RECEIPT=Object.freeze({
 repository:"xfraggelpower666x/666CLICPRO",branch:"clic-migration-rev79-staging",
 path:"666CLIC_NATIVE_RUNTIME/inbox/LYVRA/receipts/LYVRA-CLIC-FREE-FIRST-STARBRIDGE-AUTOMATION-20261018-R02.json",
 handoff:"LYVRA-CLIC-FREE-FIRST-STARBRIDGE-AUTOMATION-20261018-R02",
 source_repo:"xfraggelpower666x/LYVRA-Living-Yielding-Vibration-and-Resonance-Architecture",
 source_branch:"lyvra",source_commit:"bea8f8e65465534e205bbafecb467ca073b921b2",
 source_path:"LYVRA_NATIVE_RUNTIME/continuity/development_exchange/LYVRA_TO_CLIC_FREE_FIRST_STARBRIDGE_AUTOMATION_20261018_R02.json",
 source_blob:"8a26ae9f129061584e12fd308ff85bf7eb959ea9"
});
const SHA=/^[a-f0-9]{40}$/i;
const denied=(reason)=>({status:"WRITE_BLOCKED",reason,receipt_written:false,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false});
export function prepareR02ReceiptCreateOnly({authorization,source,head,tree,existingHandoffIds=[],receipt}={}){
 if(authorization?.owner!=="666CLIC"||authorization?.operation!=="CREATE_SOURCE_INTAKE_ONLY"||
    authorization?.path!==R02_RECEIPT.path||authorization?.branch!==R02_RECEIPT.branch||
    authorization?.source_handoff!==R02_RECEIPT.handoff||
    authorization?.native_approval_verified!==true||authorization?.separate_receipt_write_approved!==true)
  return denied("SEPARATE_CLIC_NATIVE_WRITE_APPROVAL_REQUIRED");
 if(!SHA.test(head??"")||authorization.expected_head!==head)return denied("EXPECTED_HEAD_REQUIRED");
 if(!tree||tree.truncated!==false||!Array.isArray(tree.tree))return denied("COMPLETE_CLIC_TREE_REQUIRED");
 if(tree.tree.some(e=>e.path===R02_RECEIPT.path))return denied("CREATE_ONLY_TARGET_ALREADY_PRESENT");
 if(!Array.isArray(existingHandoffIds))return denied("INVALID_IDEMPOTENCY_EVIDENCE");
 if(existingHandoffIds.includes(R02_RECEIPT.handoff))return denied("DUPLICATE_HANDOFF_ID_QUARANTINE");
 if(source?.repo!==R02_RECEIPT.source_repo||source?.branch!==R02_RECEIPT.source_branch||
    source?.commit!==R02_RECEIPT.source_commit||source?.blob!==R02_RECEIPT.source_blob||
    source?.path!==R02_RECEIPT.source_path||
    source?.pinned_blob_verified!==true||source?.live_blob_verified!==true||
    source?.supersession_checked!==true||!SHA.test(source?.live_head??""))
  return denied("INDEPENDENT_SOURCE_PROOF_REQUIRED");
 if(receipt?.schema!=="CLIC_LYVRA_SOURCE_INTAKE_EVIDENCE_V1"||
    receipt?.owner!=="666CLIC"||
    receipt?.classification!=="SOURCE_INTAKE_READBACK_VERIFIED_NOT_TARGET_DELIVERY"||
    receipt?.handoff_id!==R02_RECEIPT.handoff||
    receipt?.source?.repository!==R02_RECEIPT.source_repo||
    receipt?.source?.branch!==R02_RECEIPT.source_branch||
    receipt?.source?.source_head!==R02_RECEIPT.source_commit||
    receipt?.source?.blob!==R02_RECEIPT.source_blob||
    receipt?.source?.path!==R02_RECEIPT.source_path||
    receipt?.source?.observed_live_head!==source.live_head||
    receipt?.clic_base_head!==head||
    receipt?.own_receipt!=="SOURCE_ONLY"||
    receipt?.legacy_inbox_current!=="PRESERVE_UNMODIFIED"||
    receipt?.foreign_mutation!==false||
    receipt?.gates?.source!=="VERIFIED_CLIC_DIRECT_READ"||
    receipt?.gates?.delivery!=="NOT_VERIFIED_TO_NETWORK"||
    receipt?.gates?.adoption!=="NOT_VERIFIED_BY_TARGETS"||
    receipt?.gates?.host!=="NOT_VERIFIED")
  return denied("RECEIPT_SCHEMA_OR_GATE_MISMATCH");
 return {status:"AUTHORIZED_CREATE_PLAN_ONLY",receipt_written:false,may_create_only:true,
  repository:R02_RECEIPT.repository,branch:R02_RECEIPT.branch,path:R02_RECEIPT.path,
  expected_head:head,content:JSON.stringify(receipt,null,2)+"\n",
  requires_fresh_head:true,requires_prechange_recovery:true,requires_expected_sha_cas:true,
  requires_independent_tree_commit_blob_readback:true,
  delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false};
}
// Separate host must obtain CLIC-native approval and invoke existing GitHub create_tree->create_commit->update_ref.
// This module deliberately makes ZERO GitHub calls, writes, workflow dispatches or host-PASS claims.
