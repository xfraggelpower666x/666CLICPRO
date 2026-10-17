import test from "node:test";import assert from "node:assert/strict";import {createHash} from "node:crypto";
import {bindStarbridgeReceipt} from "./starbridge-receipt-readback.mjs";
const SOURCE="xfraggelpower666x/666CLICPRO",SRC_HEAD="a".repeat(40),DEST_HEAD="b".repeat(40),RECEIPT_HEAD="c".repeat(40);
const path="666CLIC_NATIVE_RUNTIME/outbox/LYVRA/CLIC-LYVRA-R02.json",receiptPath="LYVRA_NATIVE_RUNTIME/handoffs/666CLIC/CLIC-LYVRA-R02-RECEIPT.json";
const envelope={handoff_id:"CLIC-LYVRA-R02",source_system:"666CLIC",target_system:"LYVRA",source_repository:SOURCE,source_head:SRC_HEAD,source_path:path,status:"PREPARED"};
const receipt={handoff_id:envelope.handoff_id,source_system:"666CLIC",target_system:"LYVRA",source_head:SRC_HEAD,source_path:path,receipt_id:"LYVRA-R02-RECEIPT",recipient_head:RECEIPT_HEAD};
const gitHash=s=>{const b=Buffer.from(s);return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
function connector({stale=false,changed=false,badBlob=false,missing=false,foreignReceipt=false}={}){
 const dest="xfraggelpower666x/LYVRA-Living-Yielding-Vibration-and-Resonance-Architecture";
 const records={[SOURCE]:{head:SRC_HEAD,path,content:JSON.stringify({kind:"handoff"})},[dest]:{head:DEST_HEAD,path:receiptPath,content:JSON.stringify(foreignReceipt?{...receipt,target_system:"666PFS"}:receipt)}};
 let branchCalls=0;
 return {
  fetch:async({url})=>{
   const repo=url.includes("/"+SOURCE+"/")?SOURCE:dest,entry=records[repo];
   if(url.includes("/branches/")){branchCalls++;const sha=repo===SOURCE&&stale?DEST_HEAD:changed&&branchCalls>2?"d".repeat(40):entry.head;return {result:{content:JSON.stringify({commit:{sha}})}};}
   return {result:{content:JSON.stringify({truncated:false,tree:missing&&repo===dest?[]:[{path:entry.path,type:"blob",sha:gitHash(entry.content)}]})}};
  },
  fetchFile:async({repository_full_name})=>{
   const entry=records[repository_full_name];return {result:{content:entry.content,sha:badBlob&&repository_full_name===dest?"e".repeat(40):gitHash(entry.content)}};
  }
 };
}
test("LYVRA SB04 independent git readback yields delivery only, no adoption or host PASS",async()=>{
 const r=await bindStarbridgeReceipt({...connector(),envelope,receipt_path:receiptPath});
 assert.equal(r.status,"DELIVERED_EVIDENCED");assert.equal(r.delivery_verified,true);
 assert.equal(r.adoption_verified,false);assert.equal(r.host_verified,false);assert.equal(r.may_mutate_foreign,false);
 assert.equal(r.recipient_head,DEST_HEAD);assert.equal(r.receipt_declared_recipient_head,RECEIPT_HEAD);
});
test("reject stale CLIC source HEAD",async()=>{const r=await bindStarbridgeReceipt({...connector({stale:true}),envelope,receipt_path:receiptPath});assert.equal(r.reason,"STALE_SOURCE_HEAD")});
test("reject tampered recipient file despite claimed blob sha",async()=>{const r=await bindStarbridgeReceipt({...connector({badBlob:true}),envelope,receipt_path:receiptPath});assert.match(r.reason,/BLOB_CONTENT_MISMATCH/)});
test("reject missing recipient receipt in commit tree",async()=>{const r=await bindStarbridgeReceipt({...connector({missing:true}),envelope,receipt_path:receiptPath});assert.match(r.reason,/MISSING_COMMITTED_BLOB/)});
test("reject mismatched receipt source or target provenance",async()=>{const r=await bindStarbridgeReceipt({...connector({foreignReceipt:true}),envelope,receipt_path:receiptPath});assert.equal(r.reason,"RECEIPT_PROVENANCE_MISMATCH")});
test("reject HEAD moving mid-read",async()=>{const r=await bindStarbridgeReceipt({...connector({changed:true}),envelope,receipt_path:receiptPath});assert.equal(r.reason,"CONCURRENT_HEAD_CHANGE")});
test("reject unsupported target even when external connector provided",async()=>{const r=await bindStarbridgeReceipt({...connector(),envelope:{...envelope,target_system:"666MIRA"},receipt_path:receiptPath});assert.equal(r.reason,"INVALID_NATIVE_CHANNEL")});
test("reject missing connector and forged boolean evidence",async()=>{const r=await bindStarbridgeReceipt({envelope,receipt_path:receiptPath,source_blob_verified:true,recipient_repository_verified:true});assert.equal(r.reason,"TRUSTED_CONNECTOR_REQUIRED")});
test("PFS SB05 native channel is recognized but requires independent readback",async()=>{const e={...envelope,handoff_id:"CLIC-PFS-TEST",target_system:"666PFS",source_path:"666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-PFS-TEST.json"};const r=await bindStarbridgeReceipt({...connector(),envelope:e,receipt_path:"handoff/CLIC-PFS-TEST-RECEIPT.json"});assert.equal(r.status,"AWAIT_RECEIPT");assert.equal(r.delivery_verified,false)});
