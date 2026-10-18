import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {createHash} from "node:crypto";
import {bindClsDriveReceipt} from "./starbridge-cls-drive-receipt.mjs";
const dir=dirname(fileURLToPath(import.meta.url));
const path="666CLIC_NATIVE_RUNTIME/outbox/666CLS/CLIC-STARBRIDGE-WHOLE-NET-666CLS-20261018-R01.json";
const source=readFileSync(resolve(dir,"../outbox/666CLS/CLIC-STARBRIDGE-WHOLE-NET-666CLS-20261018-R01.json"),"utf8");
const sha1=b=>createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const sha256=b=>createHash("sha256").update(b).digest("hex");
const blob=sha1(Buffer.from(source));
const HEAD="b".repeat(40),receiptFileId="cls-native-receipt-id";
const ptrId="1wobeCgpXgO4ifUxkE9ld-S6VCqEn6JBA",control="1Jr8MIYP49oB0VrYY4w4XxWnXfVg9pwgW";
const pointer=Buffer.from(JSON.stringify({system_id:"666CLS-CORE-001",current_version:"1.23.0",
 status:"COMPLETE_VERIFIED",runtime_authority:"05_LIVE_STATE_ONLY",scope_lock:"CLS_ARCHIVE_ONLY"}));
function fixture({noConnector=false,missingRevision=false,wrongScope=false,tamper=false,race=false,
 wrongReceipt=false,reject=false,forge=false,changedSource=false,wrongPointer=false}={}){
 let calls=0;
 const receipt=Buffer.from(JSON.stringify({
 schema:"666CLS_STARBRIDGE_DRIVE_SOURCE_RECEIPT_V1",
 handoff_id:"CLIC-STARBRIDGE-WHOLE-NET-666CLS-20261018-R01",
 receipt_id:"666CLS-CLIC-WHOLE-NET-20261018-R01-RECEIPT",
 receiver_system:wrongReceipt?"666MIRA-CORE-001":"666CLS-CORE-001",
 source_repository:"xfraggelpower666x/666CLICPRO",source_path:path,source_blob_sha:blob,
 source_sha256:sha256(Buffer.from(source)),native_pointer_id:ptrId,native_pointer_revision:"p1",
 native_version:"1.23.0",receive_decision:reject?"REJECT":"ACCEPT_SOURCE_REFERENCE_FOR_SCOPED_NATIVE_REVIEW_ONLY",
 scope:wrongScope?"FOREIGN_TRACK_DESIGN":"CLS_ARCHIVE_ONLY",foreign_runtime_adopted:false,
 foreign_mutation:false
 }));
 const github={
  fetch:async({url})=>{
   if(url.includes("/branches/")){calls++;return {result:{content:JSON.stringify({commit:{sha:race&&calls>1?"c".repeat(40):HEAD}})}}}
   return {result:{content:JSON.stringify({truncated:false,tree:[{type:"blob",path,sha:changedSource?"a".repeat(40):blob}]})}};
  },
  fetchFile:async()=>({result:{content:tamper?source+"tampered":source,sha:blob}})
 };
 const drive={
  getMetadata:async id=>({result:{id,parents:[control],mimeType:"application/json",
   revision:missingRevision?undefined:id===ptrId?"p1":"r1"}}),
  readRaw:async id=>({result:{file_id:id,revision:id===ptrId?"p1":"r1",
    bytes:id===ptrId?(wrongPointer?Buffer.from(JSON.stringify({...JSON.parse(pointer),current_version:"1.22.0"})):pointer):receipt}})
 };
 if(forge)return {github,drive:null,receipt_file_id:receiptFileId};
 return noConnector?{receipt_file_id:receiptFileId}:{github,drive,receipt_file_id:receiptFileId};
}
test("committed source and native readback bind to DELIVERY alone",async()=>{
 assert.equal(blob,"a075c30231fcdafd92d0968442c7a7c9c616fc6d");
 const x=await bindClsDriveReceipt(fixture());
 assert.equal(x.status,"DELIVERED_EVIDENCED");assert.equal(x.delivery_verified,true);
 assert.equal(x.adoption_verified,false);assert.equal(x.host_verified,false);
 assert.equal(x.concurrency,"READ_ONLY_DOUBLE_PROVIDER_REVISION_CHECK_NOT_CAS");
});
for(const [title,flags,reason] of [
 ["missing trusted connector",{noConnector:true},"TRUSTED_CONNECTORS_REQUIRED"],
 ["forged connector flags",{forge:true},"TRUSTED_CONNECTORS_REQUIRED"],
 ["missing revisions",{missingRevision:true},"PROVIDER_REVISION_NOT_VERIFIABLE"],
 ["foreign scope",{wrongScope:true},"NATIVE_RECEIVE_DECISION_OR_SCOPE_MISMATCH"],
 ["tampered source",{tamper:true},"READBACK_FAILED:SOURCE_CONTENT_BLOB_MISMATCH"],
 ["source tree mismatch",{changedSource:true},"SOURCE_BLOB_NOT_CURRENT"],
 ["incorrect receiver",{wrongReceipt:true},"NATIVE_RECEIPT_PROVENANCE_MISMATCH"],
 ["native rejection",{reject:true},"NATIVE_RECEIVE_DECISION_OR_SCOPE_MISMATCH"],
 ["concurrent source head",{race:true},"CONCURRENT_PROVIDER_OR_SOURCE_CHANGE"],
 ["stale native pointer",{wrongPointer:true},"NATIVE_POINTER_SCOPE_OR_VERSION_MISMATCH"]
]){
 test("fail closed: "+title,async()=>{const x=await bindClsDriveReceipt(fixture(flags));
 assert.equal(x.status,"AWAIT_RECEIPT");assert.equal(x.reason,reason);
 assert.equal(x.delivery_verified,false);assert.equal(x.adoption_verified,false);
 assert.equal(x.host_verified,false);});
}
