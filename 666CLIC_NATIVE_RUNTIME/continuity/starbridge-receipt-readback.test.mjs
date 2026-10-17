import test from "node:test";import assert from "node:assert/strict";import {createHash} from "node:crypto";
import {bindStarbridgeReceipt,inspectPfsSb05NativeReceipts} from "./starbridge-receipt-readback.mjs";
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
   return {result:{content:JSON.stringify({truncated:false,tree:missing&&repo===dest?[]:[{path:entry.path,type:"blob",sha:stale&&repo===SOURCE&&url.includes(DEST_HEAD)?gitHash("mutated current source"):gitHash(entry.content)}]})}};
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
test("reject changed CLIC source blob after source snapshot",async()=>{const r=await bindStarbridgeReceipt({...connector({stale:true}),envelope,receipt_path:receiptPath});assert.equal(r.reason,"READBACK_FAILED:BLOB_CONTENT_MISMATCH")});
test("reject tampered recipient file despite claimed blob sha",async()=>{const r=await bindStarbridgeReceipt({...connector({badBlob:true}),envelope,receipt_path:receiptPath});assert.match(r.reason,/BLOB_CONTENT_MISMATCH/)});
test("reject missing recipient receipt in commit tree",async()=>{const r=await bindStarbridgeReceipt({...connector({missing:true}),envelope,receipt_path:receiptPath});assert.match(r.reason,/MISSING_COMMITTED_BLOB/)});
test("reject mismatched receipt source or target provenance",async()=>{const r=await bindStarbridgeReceipt({...connector({foreignReceipt:true}),envelope,receipt_path:receiptPath});assert.equal(r.reason,"RECEIPT_PROVENANCE_MISMATCH")});
test("reject HEAD moving mid-read",async()=>{const r=await bindStarbridgeReceipt({...connector({changed:true}),envelope,receipt_path:receiptPath});assert.equal(r.reason,"CONCURRENT_HEAD_CHANGE")});
test("reject unsupported target even when external connector provided",async()=>{const r=await bindStarbridgeReceipt({...connector(),envelope:{...envelope,target_system:"666MIRA"},receipt_path:receiptPath});assert.equal(r.reason,"INVALID_NATIVE_CHANNEL")});
test("reject missing connector and forged boolean evidence",async()=>{const r=await bindStarbridgeReceipt({envelope,receipt_path:receiptPath,source_blob_verified:true,recipient_repository_verified:true});assert.equal(r.reason,"TRUSTED_CONNECTOR_REQUIRED")});
test("PFS SB05 native channel is recognized but requires independent readback",async()=>{const e={...envelope,handoff_id:"CLIC-PFS-TEST",target_system:"666PFS",source_path:"666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-PFS-TEST.json"};const r=await bindStarbridgeReceipt({...connector(),envelope:e,receipt_path:"handoff/CLIC-PFS-TEST-RECEIPT.json"});assert.equal(r.status,"AWAIT_RECEIPT");assert.equal(r.delivery_verified,false)});

test("accept immutable pinned source across later CLIC commits without claiming adoption",async()=>{const c=connector();const base=c.fetch;c.fetch=async x=>x.url.includes("/branches/"+ "clic-migration-rev79-staging")?{result:{content:JSON.stringify({commit:{sha:"d".repeat(40)}})}}:base(x);const r=await bindStarbridgeReceipt({...c,envelope,receipt_path:receiptPath});assert.equal(r.status,"DELIVERED_EVIDENCED");assert.equal(r.source_head,SRC_HEAD);assert.equal(r.observed_source_head,"d".repeat(40));assert.equal(r.adoption_verified,false)});

test("persisted SB04 reconciliation pins independent receiver receipt without auto-adoption",async()=>{
 const {readFileSync}=await import("node:fs");
 const {fileURLToPath}=await import("node:url");
 const {resolve,dirname}=await import("node:path");
 const own=dirname(fileURLToPath(import.meta.url));
 const evidence=JSON.parse(readFileSync(resolve(own,"../inbox/LYVRA/receipts/CLIC-STARBRIDGE-SB04-20261017-01-DELIVERY-READBACK.json"),"utf8"));
 assert.equal(evidence.classification,"DELIVERED_EVIDENCED");
 assert.equal(evidence.handoff_id,"CLIC-STARBRIDGE-SB04-20261017-01");
 assert.equal(evidence.source_blob_sha,"a9490b43dfb2ad38f576210c548c262bf49d821a");
 assert.equal(evidence.envelope_blob_sha,"2f4bc9374a29c7ec4fe6f73ea224cee616dd7211");
 assert.equal(evidence.recipient_blob_sha,"498b52951597d4033b803460703349b10d4bcad4");
 assert.equal(evidence.recipient_observed_head,"4a16d994d06f5b19e61d0fa1bd921fdd8d4e4e2e");
 assert.equal(evidence.verification.source_tree_blob_equals_live_tree_blob,true);
 assert.equal(evidence.verification.provenance_fields_match,true);
 assert.equal(evidence.native_adoption_verified,false);
 assert.equal(evidence.host_verified,false);
 assert.equal(evidence.automatic_transport_verified,false);
 assert.equal(evidence.other_peer_sb05,"NOT_VERIFIED");
});

const PFS_REPO="xfraggelpower666x/666PFS_CSM";
const SB05_CONTEXT="666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-PFS-REPO-MIGRATION-CONTEXT-20261005-01.json";
const SB05_ENVELOPE="666CLIC_NATIVE_RUNTIME/outbox/666PFS/CLIC-STARBRIDGE-SB05-20261017-01.json";
const SB05_READ="handoff/receipts/CLIC-STARBRIDGE-SB05-20261017-01_PFS_READBACK.json";
const SB05_ADD="handoff/receipts/CLIC-STARBRIDGE-SB05-20261017-01_PFS_ADDITIVE_RECEIPT.json";
function nativePfsFixture({tamper=false,wrongTarget=false,changed=false,promote=false}={}){
 const context=JSON.stringify({kind:"historical-context"});
 const e={handoff_id:"CLIC-STARBRIDGE-SB05-20261017-01",source_system:"666CLIC",target_system:"666PFS",
  source_repository:SOURCE,source_head:SRC_HEAD,source_path:SB05_CONTEXT,status:"PREPARED"};
 const storedEnvelope=JSON.stringify(e);
 const rb={schema:"PFS_NATIVE_STARBRIDGE_READBACK_RECEIPT_V1",handoff_id:e.handoff_id,source_system:"666CLIC",
  receiver_system:wrongTarget?"666LYVRA":"666PFS-CORE-001",source_repository:SOURCE,
  source_origin_commit:SRC_HEAD,source_current_head:SRC_HEAD,source_context_path:SB05_CONTEXT,
  source_context_blob:gitHash(context),source_envelope_path:SB05_ENVELOPE,source_envelope_blob:gitHash(storedEnvelope),
  delivery_verified:false,adoption_verified:false,host_verified:false};
 const raw=JSON.stringify(rb);
 const ad={schema:"PFS_NATIVE_STARBRIDGE_ADDITIVE_RECEIPT_V1",handoff_id:e.handoff_id,
  source_system:"666CLIC",target_system:"666PFS-CORE-001",source_head:SRC_HEAD,
  source_path:SB05_CONTEXT,source_blob:gitHash(context),envelope_path:SB05_ENVELOPE,
  envelope_blob:gitHash(storedEnvelope),previous_receipt_path:SB05_READ,
  previous_receipt_blob:tamper?"f".repeat(40):gitHash(raw),recipient_head:DEST_HEAD,
  delivery_verified:promote,adoption_verified:false,host_verified:false};
 const files={[SOURCE]:{[SB05_CONTEXT]:context,[SB05_ENVELOPE]:storedEnvelope},
  [PFS_REPO]:{[SB05_READ]:raw,[SB05_ADD]:JSON.stringify(ad)}};
 let c=0;
 const fetch=async({url})=>{
  const r=url.includes("/"+PFS_REPO+"/")?PFS_REPO:SOURCE;
  if(url.includes("/branches/")){c++;return {result:{content:JSON.stringify({commit:{sha:changed&&c>2?"d".repeat(40):r===SOURCE?SRC_HEAD:DEST_HEAD}})}}}
  return {result:{content:JSON.stringify({truncated:false,tree:Object.entries(files[r]).map(([path,value])=>({path,type:"blob",sha:gitHash(value)}))})}};
 };
 const fetchFile=async({repository_full_name,path})=>({result:{content:files[repository_full_name][path],sha:gitHash(files[repository_full_name][path])}});
 return {fetch,fetchFile,envelope:e};
}
test("PFS native dual-receipt readback yields independent evidence but never delivery/adoption/host",async()=>{
 const x=await inspectPfsSb05NativeReceipts(nativePfsFixture());
 assert.equal(x.status,"NATIVE_SB05_READBACK_EVIDENCED_DELIVERY_PENDING");
 assert.equal(x.native_receipts_verified,true);assert.equal(x.delivery_verified,false);
 assert.equal(x.adoption_verified,false);assert.equal(x.host_verified,false);assert.equal(x.may_mutate_foreign,false);
});
test("PFS additive receipt cannot replace or forge preceding readback blob",async()=>{
 const x=await inspectPfsSb05NativeReceipts(nativePfsFixture({tamper:true}));
 assert.equal(x.reason,"SB05_NATIVE_RECEIPT_PROVENANCE_MISMATCH");
});
test("PFS native receiver mismatch and artificial promotion fail closed",async()=>{
 assert.equal((await inspectPfsSb05NativeReceipts(nativePfsFixture({wrongTarget:true}))).status,"AWAIT_RECEIPT");
 assert.equal((await inspectPfsSb05NativeReceipts(nativePfsFixture({promote:true}))).reason,"UNSUPPORTED_NATIVE_PROMOTION_CLAIM");
});
test("SB05 native receipts fail on racing heads or absent trusted connector",async()=>{
 assert.equal((await inspectPfsSb05NativeReceipts(nativePfsFixture({changed:true}))).reason,"CONCURRENT_HEAD_CHANGE");
 assert.equal((await inspectPfsSb05NativeReceipts({envelope:nativePfsFixture().envelope})).reason,"TRUSTED_CONNECTOR_REQUIRED");
});
