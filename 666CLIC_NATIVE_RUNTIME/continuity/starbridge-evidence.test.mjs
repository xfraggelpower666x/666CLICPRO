import test from "node:test";
import assert from "node:assert/strict";
import {validateStarbridgeEnvelope,classifyStarbridgeReceipt,reconcileStarbridgeInbox,resumeStarbridgeWork} from "./starbridge-evidence.mjs";
const SHA="a".repeat(40),HEAD="b".repeat(40);
const base={handoff_id:"CLIC-LYVRA-R02-TEST",source_system:"666CLIC",target_system:"LYVRA",source_repository:"xfraggelpower666x/666CLICPRO",source_head:SHA,source_path:"666CLIC_NATIVE_RUNTIME/outbox/LYVRA/r02.json",status:"PREPARED"};
test("valid prepared only means prepared, not delivered",()=>{assert.equal(validateStarbridgeEnvelope(base).valid,true);assert.equal(classifyStarbridgeReceipt(base).status,"AWAIT_RECEIPT")});
test("source path traversal or forged same-system is rejected",()=>{assert.equal(validateStarbridgeEnvelope({...base,source_path:"../bad"}).valid,false);assert.equal(validateStarbridgeEnvelope({...base,target_system:"666CLIC"}).valid,false)});
test("no delivery from receipt fields without independent source and recipient readbacks",()=>{
 const receipt={handoff_id:base.handoff_id,source_system:base.source_system,target_system:base.target_system,source_head:base.source_head,source_path:base.source_path,receipt_id:"LYVRA-R02-RECEIPT",recipient_head:HEAD};
 assert.equal(classifyStarbridgeReceipt(base,receipt).status,"AWAIT_RECEIPT");
 assert.equal(classifyStarbridgeReceipt(base,{...receipt,source_head:HEAD},{recipient_repository_verified:true,receipt_blob_verified:true,source_blob_verified:true}).status,"AWAIT_RECEIPT");
 assert.equal(classifyStarbridgeReceipt(base,receipt,{recipient_repository_verified:true,receipt_blob_verified:true,source_blob_verified:true}).status,"DELIVERED_EVIDENCED");
});
test("duplicate id is idempotent; conflicting source with same id quarantines",()=>{const x=reconcileStarbridgeInbox([base,{...base},{...base,source_head:HEAD}]);assert.equal(x.accepted.length,1);assert.equal(x.duplicates.length,1);assert.equal(x.conflicts[0].reason,"CONFLICT_QUARANTINE_SOURCE_ID_REUSE")});
test("foreign authorization and host proof cannot be inferred",()=>{assert.equal(validateStarbridgeEnvelope({...base,status:"ADOPTED",receipt_id:"LYVRA-R02-RECEIPT",recipient_head:HEAD}).valid,false);assert.equal(validateStarbridgeEnvelope({...base,status:"HOST_VERIFIED",receipt_id:"LYVRA-R02-RECEIPT",recipient_head:HEAD,native_readback_head:SHA,native_adoption_verified:true}).valid,false)});
test("verified work anchor survives unrelated event and only verified supersession replaces it",()=>{
 const before={work_scope:"WHOLE_CLIC",return_anchor:"CLIC-OPEN-WORK"};
 assert.equal(resumeStarbridgeWork(before,{new_return_anchor:"UNVERIFIED"}).return_anchor,"CLIC-OPEN-WORK");
 assert.equal(resumeStarbridgeWork(before,{supersession_verified:true,new_return_anchor:"CLIC-VALID-NEW-WORK"}).return_anchor,"CLIC-VALID-NEW-WORK");
 assert.equal(resumeStarbridgeWork({},{}).status,"PARTIAL");
});
