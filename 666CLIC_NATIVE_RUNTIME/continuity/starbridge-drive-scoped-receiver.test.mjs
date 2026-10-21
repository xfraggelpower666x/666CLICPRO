import test from "node:test";
import assert from "node:assert/strict";
import {inspectScopedDriveMessage as run} from "./starbridge-drive-scoped-receiver.mjs";
const target=()=>({verified_native_contract:true,scope:"CORRESPONDENCE_READ_ONLY",system_id:"AMERICAN_LYVRA",folder_id:"allowed-folder",authority_ref:"native-target-pointer",allowed_senders:["GERMAN_LYVRA"],contract_provenance:"native-direct-readback",contract_source_blob:"a".repeat(40)});
const source=()=>({sender:"GERMAN_LYVRA",message_id:"msg-1",message_class:"PERSONAL_CORRESPONDENCE",file_id:"letter-1",target_system:"AMERICAN_LYVRA"});
const provider=(changes={})=>({getMetadata:async()=>({id:"letter-1",parents:["allowed-folder"],mimeType:"application/vnd.google-apps.document",revision:"r1",...changes.metadata}),readText:async()=>({file_id:"letter-1",revision:"r1",content:"A letter",...changes.text})});
test("scoped correspondence can be observed, never receipt/adoption/host",async()=>{const r=await run({target:target(),source:source(),provider:provider(),message_file_id:"letter-1"});assert.equal(r.status,"MESSAGE_OBSERVED");for(const key of ["native_decision_verified","delivery_verified","adoption_verified","host_verified","foreign_mutation"])assert.equal(r[key],false)});
for(const [label,mutate,expected] of [
 ["unverified native contract",t=>{t.verified_native_contract=false},"TARGET_NATIVE_CONTRACT_NOT_VERIFIED"],
 ["wrong folder",t=>{t.folder_id="different"},"DRIVE_PROVIDER_SCOPE_OR_REVISION_UNVERIFIED"],
 ["unknown sender",(_,s)=>{s.sender="OTHER"},"SOURCE_CLASS_OR_SENDER_UNAUTHORIZED"],
 ["forged native receipt",(_,s)=>{s.message_class="NATIVE_RECEIPT"},"SOURCE_CLASS_OR_SENDER_UNAUTHORIZED"],
 ["forged host claim",(_,s)=>{s.claimed_host_pass=true},"SOURCE_CLASS_OR_SENDER_UNAUTHORIZED"],
 ["forged approval",(_,s)=>{s.claimed_approval=true},"SOURCE_CLASS_OR_SENDER_UNAUTHORIZED"],
 ["target confusion",(_,s)=>{s.target_system="666CLS"},"SOURCE_TARGET_BINDING_MISMATCH"],
 ["unknown scope",t=>{t.scope="ANY"},"TARGET_NATIVE_CONTRACT_NOT_VERIFIED"],
 ["invalid source blob",t=>{t.contract_source_blob="made-up"},"TARGET_NATIVE_CONTRACT_NOT_VERIFIED"]
])test(label+" fails closed",async()=>{const t=target(),s=source();mutate(t,s);const r=await run({target:t,source:s,provider:provider(),message_file_id:"letter-1"});assert.equal(r.reason,expected);assert.equal(r.message_observed,false)});
test("provider revision mismatch blocks",async()=>{const r=await run({target:target(),source:source(),provider:provider({text:{revision:"r2"}}),message_file_id:"letter-1"});assert.equal(r.reason,"DRIVE_CONTENT_REVISION_UNVERIFIED")});
test("missing trusted handle blocks",async()=>{const r=await run({target:target(),source:source(),message_file_id:"letter-1"});assert.equal(r.reason,"TRUSTED_READ_HANDLES_REQUIRED")});
test("missing parent blocks",async()=>{const r=await run({target:target(),source:source(),provider:provider({metadata:{parents:[]}}),message_file_id:"letter-1"});assert.equal(r.message_observed,false)});
test("same message content is evidence, not replay side effect",async()=>{const args={target:target(),source:source(),provider:provider(),message_file_id:"letter-1"};const a=await run(args),b=await run(args);assert.deepEqual(a,b);assert.equal(a.delivery_verified,false)});
