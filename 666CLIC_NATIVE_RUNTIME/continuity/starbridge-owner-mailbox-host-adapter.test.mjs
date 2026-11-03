import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {publishVerifiedClicOutbox,inspectSeparateClicReply,CLIC_OWNER_MAILBOX_HOST} from "./starbridge-owner-mailbox-host-adapter.mjs";
const head="a".repeat(40),path="666CLIC_NATIVE_RUNTIME/outbox/666CLS/CLIC-TEST-111.json";
const original=JSON.stringify({handoff_id:"CLIC-TEST-111",source_system:"666CLIC",target_system:"666CLS"});
const sha=s=>{let b=Buffer.from(s);return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
function gh(){return {fetch:async({url})=>({result:{content:JSON.stringify(url.includes("/branches/")?{commit:{sha:head}}:{truncated:false,tree:[{path,type:"blob",sha:sha(original)}]})}}),fetchFile:async()=>({result:{content:original,sha:sha(original)}})}}
function drive(){const f={};let count=0;const state={files:f,get count(){return count},fail:null};const api={
 list_folder:async()=>({result:{files:Object.values(f).filter(x=>x.parent_ids.includes("1vMFbTGGKwJXQERgFteCP_ofJmgssSXKs")).map(x=>({id:x.id,title:x.title}))}}),
 create_file:async({title,mime_type})=>{count++;f["doc-"+count]={id:"doc-"+count,title,mime_type,parent_ids:["root"],content:"",rev:"1"};return {result:{fileId:"doc-"+count,mimeType:mime_type}}},
 get_file_metadata:async({fileId})=>({result:fileId==="1vMFbTGGKwJXQERgFteCP_ofJmgssSXKs"?{id:fileId,permissions:[{type:"anyone",role:"writer"}]}:{id:fileId,parent_ids:[...f[fileId].parent_ids],mime_type:f[fileId].mime_type}}),
 get_document:async({document_id})=>({result:{documentId:document_id,revisionId:f[document_id].rev}}),
 batch_update_document:async({document_id,requests,write_control})=>{const x=f[document_id];if(x.rev!==write_control.requiredRevisionId)throw Error("CONFLICT");x.content=requests[0].insertText.text;x.rev="2";return {result:{revisionId:"2"}}},
 update_file:async({fileId,addParents})=>{if(state.fail==="MOVE")throw Error("MOVE_DENIED");f[fileId].parent_ids=[addParents];return {result:{success:true,parent_ids:[addParents]}}},
 list_file_revisions:async({fileId})=>({result:{fileId,currentRevisionId:"2",revisions:[{id:"2"}]}}),
 get_document_text:async({document_id})=>({result:{documentId:document_id,revisionId:f[document_id].rev,paragraphs:[{text:f[document_id].content}]}})
 };return {api,state}}
const approved={verify:async x=>({result:{valid:true,independentVerifier:true,proofId:"independent-proof",opaqueReceipt:"separately-authenticated-receipt",worldWritableRiskApproved:true,source_head:x.source_head,source_blob_sha:x.source_blob_sha,handoff_id:x.handoff_id,folder_id:x.folder_id,target_system:x.target_system}})};

test("prepare remains read only",async()=>{const d=drive();const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path});assert.equal(x.status,"MESSAGE_PREPARED");assert.equal(d.state.count,0)});
test("missing approval is HOLD before create",async()=>{const d=drive();const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true});assert.equal(x.reason,"INDEPENDENT_APPROVAL_SERVICE_REQUIRED");assert.equal(d.state.count,0)});
test("caller-supplied approval callback cannot initiate transaction",async()=>{const d=drive();const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true,approval:approved});assert.equal(x.status,"HOLD");assert.equal(x.reason,"HOST_AUTHENTICITY_AND_DURABLE_PRECREATE_RECOVERY_NOT_VERIFIED");assert.equal(x.recovery_state,"NO_TRANSACTION_STARTED");assert.equal(d.state.count,0)});
test("faked independent verifier and proof never create",async()=>{const d=drive();const a={verify:async q=>({result:{...(await approved.verify(q)).result,proofId:"fake-replay"}})};for(let i=0;i<2;i++){const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true,approval:a});assert.equal(x.provider_writes,0)}assert.equal(d.state.count,0)});
test("public writer permission doesn't grant publishing authority",async()=>{const d=drive();const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true,approval:approved});assert.equal(x.delivery_verified,false);assert.equal(x.host_verified,false);assert.equal(d.state.count,0)});
test("move cannot be reached on unverified recovery",async()=>{const d=drive();let moves=0;d.api.update_file=async()=>{moves++;throw Error("MOVE_DENIED")};const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true,approval:approved});assert.equal(x.status,"HOLD");assert.equal(moves,0);assert.equal(d.state.count,0)});
test("write cannot be reached on unverified recovery",async()=>{const d=drive();let writes=0;d.api.batch_update_document=async()=>{writes++;throw Error("REVISION_CONFLICT")};const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true,approval:approved});assert.equal(x.status,"HOLD");assert.equal(writes,0)});
test("bad source blob fails before approval and create",async()=>{const d=drive(),g=gh();g.fetchFile=async()=>({result:{content:original,sha:"b".repeat(40)}});const x=await publishVerifiedClicOutbox({github:g,drive:d.api,source_path:path,execute:true,approval:approved});assert.equal(x.status,"HOLD");assert.equal(d.state.count,0)});
test("missing provider handles fail closed",async()=>{const x=await publishVerifiedClicOutbox({github:gh(),drive:{},source_path:path,execute:true,approval:approved});assert.equal(x.status,"HOLD")});
test("no new background or foreign delivery authority",()=>{assert.equal(CLIC_OWNER_MAILBOX_HOST.background_dispatch,false);assert.equal(CLIC_OWNER_MAILBOX_HOST.receipt_promotion,false)});
test("reply requires independently read source/document",async()=>{const d=drive();const x=await inspectSeparateClicReply({github:gh(),drive:d.api,source_path:path,reply_file_id:"absent"});assert.equal(x.status,"HOLD")});
