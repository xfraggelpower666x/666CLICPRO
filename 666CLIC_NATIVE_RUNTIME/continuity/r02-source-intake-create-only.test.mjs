import test from "node:test";
import assert from "node:assert/strict";
import {R02_RECEIPT,prepareR02ReceiptCreateOnly} from "./r02-source-intake-create-only.mjs";
const HEAD="a".repeat(40),LIVE="b".repeat(40);
const fixture=()=>{
 const r=R02_RECEIPT;
 return {
  authorization:{owner:"666CLIC",operation:"CREATE_SOURCE_INTAKE_ONLY",path:r.path,branch:r.branch,source_handoff:r.handoff,native_approval_verified:true,separate_receipt_write_approved:true,expected_head:HEAD},
  head:HEAD,tree:{truncated:false,tree:[]},existingHandoffIds:[],
  source:{repo:r.source_repo,branch:r.source_branch,commit:r.source_commit,blob:r.source_blob,path:r.source_path,pinned_blob_verified:true,live_blob_verified:true,supersession_checked:true,live_head:LIVE},
  receipt:{schema:"CLIC_LYVRA_SOURCE_INTAKE_EVIDENCE_V1",owner:"666CLIC",classification:"SOURCE_INTAKE_READBACK_VERIFIED_NOT_TARGET_DELIVERY",
   handoff_id:r.handoff,source:{repository:r.source_repo,branch:r.source_branch,source_head:r.source_commit,blob:r.source_blob,path:r.source_path,observed_live_head:LIVE},
   clic_base_head:HEAD,own_receipt:"SOURCE_ONLY",legacy_inbox_current:"PRESERVE_UNMODIFIED",foreign_mutation:false,
   gates:{source:"VERIFIED_CLIC_DIRECT_READ",delivery:"NOT_VERIFIED_TO_NETWORK",adoption:"NOT_VERIFIED_BY_TARGETS",host:"NOT_VERIFIED"}}
 };
};
const reject=(change,reason)=>{const f=fixture();change(f);const x=prepareR02ReceiptCreateOnly(f);assert.equal(x.status,"WRITE_BLOCKED");assert.equal(x.reason,reason);assert.equal(x.receipt_written,false)};
test("valid supplied evidence only yields a plan, never performs a write",()=>{const x=prepareR02ReceiptCreateOnly(fixture());assert.equal(x.status,"AUTHORIZED_CREATE_PLAN_ONLY");assert.equal(x.receipt_written,false);assert.equal(x.expected_head,HEAD);assert.equal(x.path,R02_RECEIPT.path);assert.equal(x.delivery_verified,false)});
test("missing native approval fails closed",()=>reject(f=>delete f.authorization,"SEPARATE_CLIC_NATIVE_WRITE_APPROVAL_REQUIRED"));
test("generic approval cannot replace receipt-specific approval",()=>reject(f=>f.authorization.separate_receipt_write_approved=false,"SEPARATE_CLIC_NATIVE_WRITE_APPROVAL_REQUIRED"));
test("foreign path fails",()=>reject(f=>f.authorization.path="other/repo","SEPARATE_CLIC_NATIVE_WRITE_APPROVAL_REQUIRED"));
test("wrong native branch fails",()=>reject(f=>f.authorization.branch="main","SEPARATE_CLIC_NATIVE_WRITE_APPROVAL_REQUIRED"));
test("expected HEAD CAS mismatch fails",()=>reject(f=>f.authorization.expected_head=LIVE,"EXPECTED_HEAD_REQUIRED"));
test("incomplete tree fails",()=>reject(f=>f.tree.truncated=true,"COMPLETE_CLIC_TREE_REQUIRED"));
test("existing target file fails create-only",()=>reject(f=>f.tree.tree.push({path:R02_RECEIPT.path,sha:HEAD}),"CREATE_ONLY_TARGET_ALREADY_PRESENT"));
test("duplicate handoff ID fails idempotence",()=>reject(f=>f.existingHandoffIds.push(R02_RECEIPT.handoff),"DUPLICATE_HANDOFF_ID_QUARANTINE"));
test("forged source blob fails",()=>reject(f=>f.source.blob=HEAD,"INDEPENDENT_SOURCE_PROOF_REQUIRED"));
test("absent supersession evidence fails",()=>reject(f=>f.source.supersession_checked=false,"INDEPENDENT_SOURCE_PROOF_REQUIRED"));
test("receipt falsely claiming delivery fails",()=>reject(f=>f.receipt.gates.delivery="DELIVERED","RECEIPT_SCHEMA_OR_GATE_MISMATCH"));
test("receipt falsely claiming host fails",()=>reject(f=>f.receipt.gates.host="VERIFIED","RECEIPT_SCHEMA_OR_GATE_MISMATCH"));
test("receipt foreign-mutation claim fails",()=>reject(f=>f.receipt.foreign_mutation=true,"RECEIPT_SCHEMA_OR_GATE_MISMATCH"));
test("old native inbox overwrite forbidden",()=>reject(f=>f.receipt.legacy_inbox_current="OVERWRITE","RECEIPT_SCHEMA_OR_GATE_MISMATCH"));
