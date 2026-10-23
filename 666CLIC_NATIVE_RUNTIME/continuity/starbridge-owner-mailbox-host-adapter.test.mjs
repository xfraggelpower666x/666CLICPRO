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
 get_file_metadata:async({fileId})=>({result:{id:fileId,parent_ids:[...f[fileId].parent_ids],mime_type:f[fileId].mime_type}}),
 get_document:async({document_id})=>({result:{documentId:document_id,revisionId:f[document_id].rev}}),
 batch_update_document:async({document_id,requests,write_control})=>{const x=f[document_id];if(x.rev!==write_control.requiredRevisionId)throw Error("CONFLICT");x.content=requests[0].insertText.text;x.rev="2";return {result:{revisionId:"2"}}},
 update_file:async({fileId,addParents})=>{if(state.fail==="MOVE")throw Error("MOVE_DENIED");f[fileId].parent_ids=[addParents];return {result:{success:true,parent_ids:[addParents]}}},
 list_file_revisions:async({fileId})=>({result:{fileId,currentRevisionId:"2",revisions:[{id:"2"}]}}),
 get_document_text:async({document_id})=>({result:{documentId:document_id,revisionId:f[document_id].rev,paragraphs:[{text:f[document_id].content}]}})
 };return {api,state}}
test("explicit execution required",async()=>{const d=drive();const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path});assert.equal(x.status,"MESSAGE_PREPARED");assert.equal(d.state.count,0)});
test("create/write/move/double readback source remains not native delivery",async()=>{const d=drive();const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true});assert.equal(x.status,"MESSAGE_ACCESSIBLE",JSON.stringify(x));assert.equal(x.delivery_verified,false);assert.equal(d.state.count,1)});
test("idempotent second call doesn't create duplicate",async()=>{const d=drive();await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true});const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true});assert.equal(x.reused,true,JSON.stringify(x));assert.equal(d.state.count,1)});
test("missing trusted handle fail closed",async()=>{assert.equal((await publishVerifiedClicOutbox({github:gh(),drive:{},source_path:path,execute:true})).status,"HOLD")});
test("unverified source fail closed before any write",async()=>{const d=drive();const g=gh();g.fetchFile=async()=>({result:{content:original,sha:"b".repeat(40)}});assert.equal((await publishVerifiedClicOutbox({github:g,drive:d.api,source_path:path,execute:true})).status,"HOLD");assert.equal(d.state.count,0)});
test("move failure returns file id for recovery, no fabricated publication",async()=>{const d=drive();d.state.fail="MOVE";const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true});assert.equal(x.status,"HOLD");assert.equal(x.stage,"MOVE");assert.equal(x.file_id,"doc-1")});
test("tampered duplicate must not promote",async()=>{const d=drive();await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true});d.state.files["doc-1"].content="{}";const x=await publishVerifiedClicOutbox({github:gh(),drive:d.api,source_path:path,execute:true});assert.equal(x.status,"HOLD");assert.equal(d.state.count,1)});
test("reply requires trusted separate document",async()=>{const d=drive();const x=await inspectSeparateClicReply({github:gh(),drive:d.api,source_path:path,reply_file_id:"absent"});assert.equal(x.status,"HOLD")});
test("no automatic background dispatch or native decision",()=>{assert.equal(CLIC_OWNER_MAILBOX_HOST.background_dispatch,false);assert.equal(CLIC_OWNER_MAILBOX_HOST.receipt_promotion,false)});
