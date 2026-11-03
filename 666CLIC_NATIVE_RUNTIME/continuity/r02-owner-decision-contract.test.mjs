import test from "node:test";
import assert from "node:assert/strict";
import {R02_RECEIPT as R} from "./r02-source-intake-create-only.mjs";
import {inspectR02OwnerDecision as inspect} from "./r02-owner-decision-contract.mjs";
const H="a".repeat(40),Q="b".repeat(64),ID="owner-decision-20261021",REF="recovery-owner-20261021";
const fixture=()=>({nowMs:1000,decision:{schema:"CLIC_R02_OWNER_DECISION_V1",governance_class:"SINGLE_ACCOUNT_OWNER_DECISION",owner:"xfraggelpower666x",operation:"CREATE_SOURCE_INTAKE_ONLY",repository:R.repository,branch:R.branch,receipt_path:R.path,handoff_id:R.handoff,source_repository:R.source_repo,source_branch:R.source_branch,source_path:R.source_path,source_commit:R.source_commit,source_blob:R.source_blob,independent_approval:false,native_approval_verified:false,write_authorized:false,expected_head:H,receipt_sha256:Q,decision_id:ID,recovery_ref:REF,expires_at_ms:2000},
ownerEvidence:{confirmed_exact_operation:true,owner_login:"xfraggelpower666x",confirmed_decision_id:ID,confirmed_head:H,confirmed_receipt_sha256:Q,independent_native_approval_claimed:false},
source:{pinned_commit_verified:true,live_blob_verified:true,supersession_cleared:true,commit:R.source_commit,blob:R.source_blob},
repository:{repo:R.repository,branch:R.branch,head:H,complete_tree:true,receipt_absent:true,duplicate_handoff_absent:true},
receipt:{path:R.path,sha256:Q,source_blob:R.source_blob,handoff_id:R.handoff,foreign_mutation:false,delivery_claimed:false,adoption_claimed:false,host_claimed:false},
recovery:{ref:REF,base_head:H,independent_readback_verified:true},
cas:{expected_sha:H,force:false,single_create_only_path:R.path},
replay:{decision_id:ID,already_used:false,duplicate_handoff_absent:true,ambiguous_outcome_never_auto_retry:true},
readback:{commit_parent_required:H,exact_tree_blob_required:true,receipt_sha256_required:Q,fresh_branch_head_required:true,failed_readback_blocks_pass:true}});
const t=(name,change,reason)=>test(name,()=>{const x=fixture();change?.(x);const o=inspect(x);assert.equal(o.reason,reason);assert.equal(o.status,"OWNER_DECISION_SOURCE_ONLY");assert.equal(o.independent_approval,false);assert.equal(o.native_approval_verified,false);assert.equal(o.receipt_write_authorized,false);assert.equal(o.receipt_written,false)});
t("even complete synthetic evidence cannot authorize write",null,"OWNER_DECISION_RECORDED_NOT_INDEPENDENT_APPROVAL_WRITE_BLOCKED");
t("owner evidence missing",x=>delete x.ownerEvidence,"OWNER_CONFIRMATION_NOT_VERIFIED");
t("wrong owner",x=>x.decision.owner="other","OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("native approval spoof",x=>x.decision.native_approval_verified=true,"OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("wrong governance class",x=>x.decision.governance_class="NATIVE_APPROVAL_VERIFIED","OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("self permission spoof",x=>x.decision.write_authorized=true,"OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("wrong repository",x=>x.decision.repository="other/repo","OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("wrong branch",x=>x.decision.branch="main","OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("wrong R02 receipt path",x=>x.decision.receipt_path="other/path","OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("wrong source blob",x=>x.decision.source_blob=H,"OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("malformed receipt digest",x=>x.decision.receipt_sha256=H,"OWNER_DECISION_EXACT_SCOPE_REQUIRED");
t("expired decision",x=>x.nowMs=2000,"OWNER_DECISION_EXPIRED_OR_CLOCK_UNTRUSTED");
t("untrusted clock",x=>delete x.nowMs,"OWNER_DECISION_EXPIRED_OR_CLOCK_UNTRUSTED");
t("owner confirmed other payload",x=>x.ownerEvidence.confirmed_receipt_sha256="c".repeat(64),"OWNER_CONFIRMATION_NOT_VERIFIED");
t("owner claimed independent approval",x=>x.ownerEvidence.independent_native_approval_claimed=true,"OWNER_CONFIRMATION_NOT_VERIFIED");
t("source supersession incomplete",x=>x.source.supersession_cleared=false,"SOURCE_PROVENANCE_NOT_VERIFIED");
t("race head mismatch",x=>x.repository.head="c".repeat(40),"CREATE_ONLY_OR_HEAD_CONFLICT");
t("receipt already exists",x=>x.repository.receipt_absent=false,"CREATE_ONLY_OR_HEAD_CONFLICT");
t("duplicate handoff",x=>x.repository.duplicate_handoff_absent=false,"CREATE_ONLY_OR_HEAD_CONFLICT");
t("receipt digest mismatch",x=>x.receipt.sha256="c".repeat(64),"RECEIPT_CONTENT_BINDING_MISMATCH");
t("false delivery claim",x=>x.receipt.delivery_claimed=true,"RECEIPT_CONTENT_BINDING_MISMATCH");
t("recovery wrong head",x=>x.recovery.base_head="c".repeat(40),"RECOVERY_NOT_VERIFIED");
t("unread recovery",x=>x.recovery.independent_readback_verified=false,"RECOVERY_NOT_VERIFIED");
t("CAS head wrong",x=>x.cas.expected_sha="c".repeat(40),"CAS_CONTRACT_MISMATCH");
t("CAS force prohibited",x=>x.cas.force=true,"CAS_CONTRACT_MISMATCH");
t("replayed decision",x=>x.replay.already_used=true,"REPLAY_OR_AMBIGUOUS_OUTCOME_BLOCKED");
t("ambiguous GitHub write must not retry",x=>x.replay.ambiguous_outcome_never_auto_retry=false,"REPLAY_OR_AMBIGUOUS_OUTCOME_BLOCKED");
t("postwrite parent wrong",x=>x.readback.commit_parent_required="c".repeat(40),"POSTWRITE_READBACK_INSUFFICIENT");
t("postwrite blob readback absent",x=>x.readback.exact_tree_blob_required=false,"POSTWRITE_READBACK_INSUFFICIENT");
t("postwrite hash readback wrong",x=>x.readback.receipt_sha256_required="c".repeat(64),"POSTWRITE_READBACK_INSUFFICIENT");
