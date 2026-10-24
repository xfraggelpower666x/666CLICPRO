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

import {inspectClsDocsIntake} from "./starbridge-cls-drive-receipt.mjs";
const docsIntakeId="1OXX4trmZeJLXaEpuVsf2lkIvXy0mlGS1qyIjEAt9ap8";
const docsFolder="1KTKbJBVT5PIO4zTvL49HwRXlEHm9iJGV";
const docsParagraphs=[
"SYSTEM_ID=666CLS-CORE-001","LAST_CHECKED_CLS_VERSION=1.23.0",
"SOURCE_GIT_BLOB=a075c30231fcdafd92d0968442c7a7c9c616fc6d",
"SOURCE_CLIC_BLOB=a075c30231fcdafd92d0968442c7a7c9c616fc6d",
"HANDOFF_ID=CLIC-STARBRIDGE-WHOLE-NET-666CLS-20261018-R01",
"NATIVE_AUTHORITY=GOOGLE_DRIVE_05_LIVE_STATE_ONLY",
"DECISION_AUTHORITY=666CLS-CORE-001","DECISION_SCOPE=CLS_ARCHIVE_ONLY",
"NATIVE_DECISION=PENDING",
"NATIVE_RECEIVE_DECISION=ACCEPT_SOURCE_REFERENCE_FOR_SCOPED_NATIVE_REVIEW_ONLY",
"STATUS=SOURCE_INTAKE_ONLY_NOT_NATIVE_DELIVERY_RECEIPT",
"NATIVE_RECEIPT_PUBLICATION=BLOCKED_NOT_ISSUED",
"CLIC_INDEPENDENT_DELIVERY=NOT_VERIFIED",
"SOURCE_REPO=xfraggelpower666x/666CLICPRO","FOREIGN_RUNTIME_IMPORT=FALSE",
"CURRENT_POINTER_WRITE=NONE","RECEIPT_FILE_ID=NOT_PUBLISHED",
"DELIVERY_VERIFIED=FALSE"].map(text=>({text}));
function docsFixture({folder=docsFolder,revision="d1",race=false,paragraphs=docsParagraphs,
 version="1.23.0",pointerRevision="p1",missingRevision=false,wrongMime=false,
 forgedReceipt=false}={}){
 let calls=0;const pbuf=Buffer.from(JSON.stringify({system_id:"666CLS-CORE-001",current_version:version,
 status:"COMPLETE_VERIFIED",runtime_authority:"05_LIVE_STATE_ONLY",scope_lock:"CLS_ARCHIVE_ONLY"}));
 const actual=forgedReceipt?[...paragraphs,{text:"RECEIPT_FILE_ID=FORGED"}]:paragraphs;
 const github={fetch:async({url})=>{
  if(url.includes("/branches/")){calls++;return {result:{content:JSON.stringify({commit:{sha:race&&calls>1?"c".repeat(40):HEAD}})}}}
  return {result:{content:JSON.stringify({truncated:false,tree:[{type:"blob",path,sha:blob}]})}};
 },fetchFile:async()=>({result:{content:source,sha:blob}})};
 const drive={
  getMetadata:async id=>({result:{id,parent_ids:[id===ptrId?control:folder],
   mime_type:id===ptrId?"application/json":wrongMime?"application/json":"application/vnd.google-apps.document"}}),
  getRevision:async()=>({result:{currentRevisionId:missingRevision?null:pointerRevision}}),
  readRaw:async()=>({result:{file_id:ptrId,revision:pointerRevision,bytes:pbuf}}),
  getDocument:async()=>({result:{documentId:docsIntakeId,revisionId:revision}}),
  getDocumentText:async()=>({result:{documentId:docsIntakeId,revisionId:revision,paragraphs:actual}})
 };
 return {github,drive};
}
test("native Docs intake decision remains separate from DELIVERY",async()=>{
 const x=await inspectClsDocsIntake(docsFixture());
 assert.equal(x.status,"NATIVE_DECISION_EVIDENCED_RECEIPT_PENDING");
 assert.equal(x.native_decision_verified,true);assert.equal(x.source_verified,true);
 assert.equal(x.delivery_verified,false);assert.equal(x.receipt_verified,false);
 assert.equal(x.adoption_verified,false);assert.equal(x.host_verified,false);
});
test("newer valid CLS native pointer remains accepted as newer evolution",async()=>{
 const x=await inspectClsDocsIntake(docsFixture({version:"1.24.0"}));
 assert.equal(x.native.version,"1.24.0");assert.equal(x.delivery_verified,false);
});
for(const [name,flags,reason] of [
 ["wrong Docs folder",{folder:control},"INVALID_NATIVE_PROVIDER_SCOPE"],
 ["wrong MIME",{wrongMime:true},"INVALID_NATIVE_PROVIDER_SCOPE"],
 ["missing pointer revision",{missingRevision:true},"DOCS_OR_POINTER_REVISION_UNVERIFIED"],
 ["old pointer regression",{version:"1.22.0"},"NATIVE_POINTER_SCOPE_OR_VERSION_MISMATCH"],
 ["duplicate conflicting native decisions",{paragraphs:[...docsParagraphs,{text:"NATIVE_RECEIVE_DECISION=REJECT"}]},"INCOMPLETE_CONFLICTING_OR_FORGED_DOCS_EVIDENCE"],
 ["forged receipt",{forgedReceipt:true},"INCOMPLETE_CONFLICTING_OR_FORGED_DOCS_EVIDENCE"],
 ["source head changes during read",{race:true},"CONCURRENT_PROVIDER_OR_SOURCE_CHANGE"],
 ["missing native decision",{paragraphs:docsParagraphs.filter(p=>!p.text.startsWith("NATIVE_RECEIVE_DECISION="))},"INCOMPLETE_CONFLICTING_OR_FORGED_DOCS_EVIDENCE"],
 ["false purported delivery",{paragraphs:[...docsParagraphs,{text:"DELIVERY_VERIFIED=TRUE"}]},"INCOMPLETE_CONFLICTING_OR_FORGED_DOCS_EVIDENCE"]
])test("Docs fail closed: "+name,async()=>{
 const x=await inspectClsDocsIntake(docsFixture(flags));
 assert.equal(x.status,"AWAIT_RECEIPT");assert.equal(x.reason,reason);
 assert.equal(x.delivery_verified,false);assert.equal(x.adoption_verified,false);
});
