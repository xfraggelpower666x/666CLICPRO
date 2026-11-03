// CLIC native ONE-TIME R02 host contract: pure negative preflight, NEVER a write grant.
import {R02_RECEIPT} from "./r02-source-intake-create-only.mjs";
const SHA=/^[a-f0-9]{40}$/i;
const DIGEST=/^[a-f0-9]{64}$/i;
const blocked=(reason)=>({schema:"CLIC_R02_ONE_TIME_HOST_CONTRACT_V1",status:"HOST_CONTRACT_BLOCKED",reason,host_authorized:false,receipt_write_authorized:false,writes:0,delivery_verified:false,adoption_verified:false,host_verified:false,foreign_mutation:false});
const isObject=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const safeToken=x=>typeof x==="string"&&/^[A-Za-z0-9_.-]{16,128}$/.test(x);
export function assessR02OneTimeHostContract({approval,host,source,repository,transaction,recovery,readback,nowMs}={}){
 const r=R02_RECEIPT;
 if(!isObject(approval)||approval.schema!=="CLIC_R02_ONE_TIME_APPROVAL_V1"||
    approval.operation!=="CREATE_SOURCE_INTAKE_ONLY"||approval.repository!==r.repository||
    approval.branch!==r.branch||approval.receipt_path!==r.path||
    approval.handoff_id!==r.handoff||approval.source_commit!==r.source_commit||
    approval.source_blob!==r.source_blob||approval.create_only!==true||
    approval.authority_transfer!==false||!SHA.test(approval.expected_head??"")||
    !DIGEST.test(approval.receipt_sha256??"")||!safeToken(approval.approval_id)||
    !safeToken(approval.nonce)||!safeToken(approval.recovery_ref)||
    !Number.isSafeInteger(approval.expires_at_ms))
   return blocked("EXACT_APPROVAL_SCOPE_REQUIRED");
 if(!Number.isSafeInteger(nowMs)||nowMs>=approval.expires_at_ms)return blocked("APPROVAL_EXPIRED_OR_TIME_UNTRUSTED");
 if(!isObject(host)||host.authenticated_approver_identity!==true||
    host.native_reviewer_right_verified!==true||host.independent_approval_carrier_verified!==true||
    host.carrier_approval_id!==approval.approval_id||
    host.carrier_nonce_digest!==approval.nonce_digest||
    !DIGEST.test(approval.nonce_digest??"")||
    host.carrier_source_blob!==approval.source_blob||
    host.carrier_expected_head!==approval.expected_head)
   return blocked("INDEPENDENT_NATIVE_HOST_AUTHORITY_REQUIRED");
 // The host truth fields above must come from a genuine external trusted source, not JSON.
 // The gate remains non-executable even if a caller spoofs the entire host object.
 if(!isObject(source)||source.original_commit_verified!==true||
    source.live_blob_verified!==true||source.supersession_cleared!==true||
    source.blob!==r.source_blob||source.commit!==r.source_commit)
   return blocked("INDEPENDENT_SOURCE_BINDING_REQUIRED");
 if(!isObject(repository)||repository.repository!==r.repository||
    repository.branch!==r.branch||repository.head!==approval.expected_head||
    repository.tree_complete!==true||repository.receipt_path_absent!==true||
    repository.no_conflicting_handoff===false||repository.no_conflicting_handoff!==true)
   return blocked("CREATE_ONLY_OR_FRESH_HEAD_REQUIRED");
 if(!isObject(transaction)||transaction.approval_id!==approval.approval_id||
    transaction.nonce_digest!==approval.nonce_digest||
    transaction.atomic_nonce_reservation_verified!==true||
    transaction.nonce_already_consumed!==false||
    transaction.replay_register_independent!==true||
    transaction.reservation_bound_expected_head!==approval.expected_head||
    transaction.reservation_bound_receipt_sha256!==approval.receipt_sha256)
   return blocked("REPLAY_OR_NONATOMIC_NONCE_BLOCKED");
 if(!isObject(recovery)||recovery.ref!==approval.recovery_ref||
    recovery.base_head!==approval.expected_head||recovery.independent_ref_readback_verified!==true)
   return blocked("PRECHANGE_RECOVERY_UNVERIFIED");
 if(!isObject(readback)||readback.required!==true||
    readback.parent_binding_required!==true||
    readback.tree_blob_bytes_required!==true||
    readback.postwrite_head_required!==true||
    readback.uncertain_outcome_never_auto_retry!==true)
   return blocked("POSTWRITE_READBACK_CONTRACT_INCOMPLETE");
 return blocked("PRIVILEGED_EXECUTOR_AND_AUTHORITY_NOT_INSTALLED");
}
