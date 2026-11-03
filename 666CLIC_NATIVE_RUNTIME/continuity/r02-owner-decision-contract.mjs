// Lower assurance owner-decision source validator. No GitHub API calls and NO write grant.
import {R02_RECEIPT as R} from "./r02-source-intake-create-only.mjs";
const S=/^[0-9a-f]{40}$/i,D=/^[0-9a-f]{64}$/i;
const blocked=reason=>({schema:"CLIC_R02_OWNER_DECISION_V1",status:"OWNER_DECISION_SOURCE_ONLY",reason,governance_class:"SINGLE_ACCOUNT_OWNER_DECISION",independent_approval:false,native_approval_verified:false,receipt_write_authorized:false,receipt_written:false,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false});
const object=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const id=x=>typeof x==="string"&&/^[a-zA-Z0-9._-]{16,128}$/.test(x);
export function inspectR02OwnerDecision({decision,ownerEvidence,source,repository,recovery,cas,replay,readback,receipt,nowMs}={}){
 if(!object(decision)||decision.schema!=="CLIC_R02_OWNER_DECISION_V1"||
 decision.governance_class!=="SINGLE_ACCOUNT_OWNER_DECISION"||decision.owner!=="xfraggelpower666x"||
 decision.operation!=="CREATE_SOURCE_INTAKE_ONLY"||decision.repository!==R.repository||
 decision.branch!==R.branch||decision.receipt_path!==R.path||decision.handoff_id!==R.handoff||
 decision.source_repository!==R.source_repo||decision.source_branch!==R.source_branch||
 decision.source_path!==R.source_path||decision.source_commit!==R.source_commit||
 decision.source_blob!==R.source_blob||decision.independent_approval!==false||
 decision.native_approval_verified!==false||decision.write_authorized!==false||
 !S.test(decision.expected_head??"")||!D.test(decision.receipt_sha256??"")||
 !id(decision.decision_id)||!id(decision.recovery_ref)||!Number.isSafeInteger(decision.expires_at_ms))
 return blocked("OWNER_DECISION_EXACT_SCOPE_REQUIRED");
 if(!Number.isSafeInteger(nowMs)||nowMs>=decision.expires_at_ms)return blocked("OWNER_DECISION_EXPIRED_OR_CLOCK_UNTRUSTED");
 if(!object(ownerEvidence)||ownerEvidence.confirmed_exact_operation!==true||
 ownerEvidence.owner_login!=="xfraggelpower666x"||
 ownerEvidence.confirmed_decision_id!==decision.decision_id||
 ownerEvidence.confirmed_head!==decision.expected_head||
 ownerEvidence.confirmed_receipt_sha256!==decision.receipt_sha256||
 ownerEvidence.independent_native_approval_claimed!==false)
 return blocked("OWNER_CONFIRMATION_NOT_VERIFIED");
 if(!object(source)||source.pinned_commit_verified!==true||
 source.live_blob_verified!==true||source.supersession_cleared!==true||
 source.commit!==R.source_commit||source.blob!==R.source_blob)
 return blocked("SOURCE_PROVENANCE_NOT_VERIFIED");
 if(!object(repository)||repository.repo!==R.repository||repository.branch!==R.branch||
 repository.head!==decision.expected_head||repository.complete_tree!==true||
 repository.receipt_absent!==true||repository.duplicate_handoff_absent!==true)
 return blocked("CREATE_ONLY_OR_HEAD_CONFLICT");
 if(!object(receipt)||receipt.path!==R.path||receipt.sha256!==decision.receipt_sha256||
 receipt.source_blob!==R.source_blob||receipt.handoff_id!==R.handoff||
 receipt.foreign_mutation!==false||receipt.delivery_claimed!==false||
 receipt.adoption_claimed!==false||receipt.host_claimed!==false)
 return blocked("RECEIPT_CONTENT_BINDING_MISMATCH");
 if(!object(recovery)||recovery.ref!==decision.recovery_ref||
 recovery.base_head!==decision.expected_head||
 recovery.independent_readback_verified!==true)
 return blocked("RECOVERY_NOT_VERIFIED");
 if(!object(cas)||cas.expected_sha===undefined||cas.expected_sha!==decision.expected_head||
 cas.force!==false||cas.single_create_only_path!==R.path)
 return blocked("CAS_CONTRACT_MISMATCH");
 if(!object(replay)||replay.decision_id!==decision.decision_id||
 replay.already_used!==false||replay.duplicate_handoff_absent!==true||
 replay.ambiguous_outcome_never_auto_retry!==true)
 return blocked("REPLAY_OR_AMBIGUOUS_OUTCOME_BLOCKED");
 if(!object(readback)||readback.commit_parent_required!==decision.expected_head||
 readback.exact_tree_blob_required!==true||readback.receipt_sha256_required!==decision.receipt_sha256||
 readback.fresh_branch_head_required!==true||readback.failed_readback_blocks_pass!==true)
 return blocked("POSTWRITE_READBACK_INSUFFICIENT");
 // A caller may forge every claimed field; only an independently authenticated executor
 // could ever approve a real write, and none is installed by this source-only module.
 return blocked("OWNER_DECISION_RECORDED_NOT_INDEPENDENT_APPROVAL_WRITE_BLOCKED");
}
