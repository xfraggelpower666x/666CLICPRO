import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {CLIC_MAILBOX,prepareClicMailboxEnvelope,inspectClicMailboxDocument,interpretMailboxReply} from "./starbridge-owner-mailbox-transport.mjs";
const head="a".repeat(40);
const basic=()=>prepareClicMailboxEnvelope({handoff_id:"CLIC-TEST-001",source_head:head,source_path:"666CLIC_NATIVE_RUNTIME/outbox/666CLS/test.json",target_system:"666CLS",body:"source-only harmless test"});
const txt=()=>JSON.stringify(basic());
function fixture(){const meta={id:"doc-id",parents:[CLIC_MAILBOX.folder_id],mimeType:"application/vnd.google-apps.document",drive_revision:"2",docs_revision:"doc-token"};const body={file_id:"doc-id",docs_revision:"doc-token",content:txt(),representation:"NORMALIZED_DOCS_PARAGRAPHS"};return {provider:{getMetadata:async()=>({...meta}),readText:async()=>({...body})},file_id:"doc-id",expected_handoff_id:"CLIC-TEST-001",meta,body}}
test("owner mailbox is separate from family and explicitly non-authoritative",()=>{assert.equal(CLIC_MAILBOX.folder_id,"1vMFbTGGKwJXQERgFteCP_ofJmgssSXKs");assert.equal(CLIC_MAILBOX.family_mailbox,"FORBIDDEN");assert.equal(CLIC_MAILBOX.native_receipt_from_transport,false)});
test("prepared message never claims delivery",()=>{const x=basic();assert.equal(x.status,"MESSAGE_PREPARED");assert.equal(x.delivery_verified,false)});
test("real readback contract only proves ACCESSIBLE",async()=>{const x=await inspectClicMailboxDocument(fixture());assert.equal(x.status,"MESSAGE_ACCESSIBLE");assert.equal(x.delivery_verified,false);assert.equal(x.message_observed,false)});
test("wrong folder HOLD",async()=>{const x=fixture();x.provider.getMetadata=async()=>({...x.meta,parents:["other"]});assert.equal((await inspectClicMailboxDocument(x)).status,"HOLD")});
test("Drive revision race HOLD",async()=>{const x=fixture();let n=0;x.provider.getMetadata=async()=>({...x.meta,drive_revision:++n===1?"2":"3"});assert.equal((await inspectClicMailboxDocument(x)).reason,"DRIVE_RACE_OR_MOVE")});
test("Docs text race HOLD",async()=>{const x=fixture();let n=0;x.provider.readText=async()=>({...x.body,content:++n===1?txt():"CHANGED"});assert.equal((await inspectClicMailboxDocument(x)).reason,"DOCS_RACE_OR_CONTENT_CHANGED")});
test("receipt claims not promoted",async()=>{const x=fixture();x.provider.readText=async()=>({...x.body,content:JSON.stringify({...basic(),claimed_host_pass:true})});assert.equal((await inspectClicMailboxDocument(x)).status,"HOLD")});
test("source spoof rejected",async()=>{const x=fixture();x.provider.readText=async()=>({...x.body,content:JSON.stringify({...basic(),sender:"Other"})});assert.equal((await inspectClicMailboxDocument(x)).status,"HOLD")});
test("reply without independent provider proof is not receipt",()=>{const x=interpretMailboxReply({reply:{reply_to_handoff_id:"CLIC-TEST-001",sender:"666CLS",message_id:"x"},expected_handoff_id:"CLIC-TEST-001"});assert.equal(x.status,"MESSAGE_OBSERVED");assert.equal(x.delivery_verified,false);assert.match(x.boundary,/UNAUTHENTICATED/)});
test("reply with alleged native host rejected",()=>{assert.equal(interpretMailboxReply({reply:{reply_to_handoff_id:"CLIC-TEST-001",sender:"666CLS",message_id:"x",claimed_host_pass:true},expected_handoff_id:"CLIC-TEST-001"}).status,"HOLD")});
test("no wrong source path",()=>{assert.equal(prepareClicMailboxEnvelope({handoff_id:"CLIC-TEST-001",source_head:head,source_path:"../family",target_system:"666CLS",body:"x"}).status,"HOLD")});
