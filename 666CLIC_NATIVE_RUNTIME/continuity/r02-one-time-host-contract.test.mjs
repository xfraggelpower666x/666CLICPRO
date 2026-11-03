import test from "node:test";
import assert from "node:assert/strict";
import {R02_RECEIPT as R} from "./r02-source-intake-create-only.mjs";
import {assessR02OneTimeHostContract as check} from "./r02-one-time-host-contract.mjs";
const H="a".repeat(40),D="b".repeat(64),N="nonce-20261020-00001",ID="approval-20261020-00001",REF="recovery-20261020-00001";
const make=()=>({nowMs:1000,
 approval:{schema:"CLIC_R02_ONE_TIME_APPROVAL_V1",operation:"CREATE_SOURCE_INTAKE_ONLY",repository:R.repository,branch:R.branch,receipt_path:R.path,handoff_id:R.handoff,source_commit:R.source_commit,source_blob:R.source_blob,create_only:true,authority_transfer:false,expected_head:H,receipt_sha256:D,approval_id:ID,nonce:N,nonce_digest:D,recovery_ref:REF,expires_at_ms:2000},
 host:{authenticated_approver_identity:true,native_reviewer_right_verified:true,independent_approval_carrier_verified:true,carrier_approval_id:ID,carrier_nonce_digest:D,carrier_source_blob:R.source_blob,carrier_expected_head:H},
 source:{original_commit_verified:true,live_blob_verified:true,supersession_cleared:true,blob:R.source_blob,commit:R.source_commit},
 repository:{repository:R.repository,branch:R.branch,head:H,tree_complete:true,receipt_path_absent:true,no_conflicting_handoff:true},
 transaction:{approval_id:ID,nonce_digest:D,atomic_nonce_reservation_verified:true,nonce_already_consumed:false,replay_register_independent:true,reservation_bound_expected_head:H,reservation_bound_receipt_sha256:D},
 recovery:{ref:REF,base_head:H,independent_ref_readback_verified:true},
 readback:{required:true,parent_binding_required:true,tree_blob_bytes_required:true,postwrite_head_required:true,uncertain_outcome_never_auto_retry:true}
});
const result=(mutate)=>{const x=make();mutate?.(x);return check(x)};
const deny=(name,mutate,reason)=>test(name,()=>{const x=result(mutate);assert.equal(x.status,"HOST_CONTRACT_BLOCKED");assert.equal(x.reason,reason);assert.equal(x.receipt_write_authorized,false);assert.equal(x.writes,0)});
deny("even ideal synthetic host evidence is not execution authority",null,"PRIVILEGED_EXECUTOR_AND_AUTHORITY_NOT_INSTALLED");
deny("missing approval blocked",x=>delete x.approval,"EXACT_APPROVAL_SCOPE_REQUIRED");
deny("wrong receipt path blocked",x=>x.approval.receipt_path="foreign/path","EXACT_APPROVAL_SCOPE_REQUIRED");
deny("wrong branch blocked",x=>x.approval.branch="main","EXACT_APPROVAL_SCOPE_REQUIRED");
deny("wrong source blob blocked",x=>x.approval.source_blob=H,"EXACT_APPROVAL_SCOPE_REQUIRED");
deny("expired approval blocked",x=>x.nowMs=2000,"APPROVAL_EXPIRED_OR_TIME_UNTRUSTED");
deny("untrusted time blocked",x=>delete x.nowMs,"APPROVAL_EXPIRED_OR_TIME_UNTRUSTED");
deny("self-asserted approver without independent carrier blocked",x=>x.host.independent_approval_carrier_verified=false,"INDEPENDENT_NATIVE_HOST_AUTHORITY_REQUIRED");
deny("host mismatch approval ID blocked",x=>x.host.carrier_approval_id="approval-other-20261020","INDEPENDENT_NATIVE_HOST_AUTHORITY_REQUIRED");
deny("host nonce mismatch blocked",x=>x.host.carrier_nonce_digest="c".repeat(64),"INDEPENDENT_NATIVE_HOST_AUTHORITY_REQUIRED");
deny("unverified source blocked",x=>x.source.original_commit_verified=false,"INDEPENDENT_SOURCE_BINDING_REQUIRED");
deny("superseded source blocked",x=>x.source.supersession_cleared=false,"INDEPENDENT_SOURCE_BINDING_REQUIRED");
deny("TOCTOU different HEAD blocked",x=>x.repository.head="c".repeat(40),"CREATE_ONLY_OR_FRESH_HEAD_REQUIRED");
deny("existing receipt blocked",x=>x.repository.receipt_path_absent=false,"CREATE_ONLY_OR_FRESH_HEAD_REQUIRED");
deny("conflicting ID blocked",x=>x.repository.no_conflicting_handoff=false,"CREATE_ONLY_OR_FRESH_HEAD_REQUIRED");
deny("replay consumed nonce blocked",x=>x.transaction.nonce_already_consumed=true,"REPLAY_OR_NONATOMIC_NONCE_BLOCKED");
deny("non atomic reservation blocked",x=>x.transaction.atomic_nonce_reservation_verified=false,"REPLAY_OR_NONATOMIC_NONCE_BLOCKED");
deny("reservation not tied to head blocked",x=>x.transaction.reservation_bound_expected_head="c".repeat(40),"REPLAY_OR_NONATOMIC_NONCE_BLOCKED");
deny("reservation not tied to exact payload blocked",x=>x.transaction.reservation_bound_receipt_sha256="c".repeat(64),"REPLAY_OR_NONATOMIC_NONCE_BLOCKED");
deny("recovery ref mismatch blocked",x=>x.recovery.ref="different-recovery-20261020","PRECHANGE_RECOVERY_UNVERIFIED");
deny("recovery origin mismatch blocked",x=>x.recovery.base_head="c".repeat(40),"PRECHANGE_RECOVERY_UNVERIFIED");
deny("recovery not independently read back blocked",x=>x.recovery.independent_ref_readback_verified=false,"PRECHANGE_RECOVERY_UNVERIFIED");
deny("no independent postwrite blob verification blocked",x=>x.readback.tree_blob_bytes_required=false,"POSTWRITE_READBACK_CONTRACT_INCOMPLETE");
deny("uncertain write auto-retry blocked",x=>x.readback.uncertain_outcome_never_auto_retry=false,"POSTWRITE_READBACK_CONTRACT_INCOMPLETE");
