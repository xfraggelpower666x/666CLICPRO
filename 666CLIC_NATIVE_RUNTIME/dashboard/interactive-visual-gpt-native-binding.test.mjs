import test from "node:test";import assert from "node:assert/strict";import {createHash} from "node:crypto";
import {prepareClicNativeChatView,selectClicNativeChatView,toNativeUiModel,prepareClicCustomInputContinuation} from "./interactive-visual-gpt-native-binding.mjs";
const head="a".repeat(40),p="666CLIC_NATIVE_RUNTIME/CURRENT_POINTER.json",m="666CLIC_NATIVE_RUNTIME/REHYDRATION_MANIFEST.json";
const contents={[p]:'{"status":"CURRENT"}',[m]:'{"system":"666CLIC","authority":"GITHUB_REPO_CURRENT","required_order":["CURRENT_POINTER.json"]}'};
const hash=s=>{const b=Buffer.from(s);return createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex")};
const tree=Object.entries(contents).map(([path,text])=>({path,sha:hash(text),type:"blob"}));
const connector=(mutate={})=>({fetch:async ({url})=>url.includes("/branches/")?{result:{content:JSON.stringify({commit:{sha:mutate.stale?"b".repeat(40):head}})}}:{result:{content:JSON.stringify({truncated:false,tree})}},fetchFile:async({path})=>({result:{content:contents[path],sha:mutate.fakeSha?"c".repeat(40):hash(contents[path])}})});
const snapshot={source_commit:head,source_paths:[p],visual_type:"EVIDENCE_GRAPH",nodes:[{id:"a",label:"Node A",origin:"commit",evidence_class:"OBSERVED",evidence_refs:["source"]},{id:"b",label:"Node B",origin:"readback",evidence_class:"OBSERVED",evidence_refs:["commit"]}],edges:[{from:"a",to:"b",evidence_class:"INFERRED",origin:"source",evidence_refs:["source"],causal_claim_verified:true}],unknowns:["Host runtime unknown"],valid_actions:[{action:"DASHBOARD",native_system:"666CLIC",authorized_direct_trigger:true,evidence_verified:true,evidence_ref:"commit"}]};
test("trusted source creates host-neutral GPT control model with details",async()=>{const r=await prepareClicNativeChatView({connector:connector(),snapshot,selection:{node_id:"a"}});assert.equal(r.status,"READY_FOR_HOST_RENDER");assert.equal(r.ui.kind,"CLIC_NATIVE_INTERACTIVE_EVIDENCE_V1");assert.equal(r.ui.selector.value,"a");assert.equal(r.ui.details.label,"Node A");assert.equal(r.host_render_verified,false);assert.equal(r.ui.edges[0].causal_claim_verified,false)});
test("selection synchronizes control value and details without claiming host pass",async()=>{const r=await prepareClicNativeChatView({connector:connector(),snapshot});const s=selectClicNativeChatView(r,"b");assert.equal(s.ui.selector.value,"b");assert.equal(s.ui.details.id,"b");assert.equal(s.host_selection_verified,false);assert.equal(s.ui.actions[0].executed,false)});
test("invalid selection cannot retain unrelated details",async()=>{const r=await prepareClicNativeChatView({connector:connector(),snapshot,selection:{node_id:"a"}});const s=selectClicNativeChatView(r,"not-present");assert.equal(s.ui.details,null);assert.equal(s.ui.selected_id,null)});
test("unverified connector source fails closed to inert compact status",async()=>{const r=await prepareClicNativeChatView({connector:connector({stale:true}),snapshot});assert.equal(r.status,"SAFE_FALLBACK");assert.equal(r.ui.options.length,0);assert.equal(r.ui.actions.length,0);assert.equal(selectClicNativeChatView(r,"a").status,"SAFE_FALLBACK")});
test("forged blob and missing connector never create controls",async()=>{const a=await prepareClicNativeChatView({connector:connector({fakeSha:true}),snapshot});const b=await prepareClicNativeChatView({snapshot});assert.equal(a.ui.kind,"CLIC_NATIVE_STATUS");assert.equal(b.status,"SAFE_FALLBACK");assert.equal(toNativeUiModel({status:"UNVERIFIED_VIEW"}).actions.length,0)});

const previousContinuity=()=>({system_id:"666CLIC",source_head:"a".repeat(40),
 return_anchor:"PDI_EVENT_CAS_OPEN",streams:[{id:"CORE_DEVELOPMENT",return_anchor:"PDI_EVENT_CAS_OPEN"},{id:"VISUAL_INTELLIGENCE",return_anchor:"VISUAL_PICK"}],
 obligations:[{id:"CAS_GOVERNANCE"}],visual:{return_anchor:"VISUAL_PICK",selection:"node-b",foreground:true}});
test("custom questions preserve visual selection, parallel streams and development anchor",()=>{
 const input={kind:"QUESTION",text:"Was bedeutet der aktuelle Status?"};
 const r=prepareClicCustomInputContinuation({previous:previousContinuity(),input});
 assert.equal(r.status,"INGEST_THEN_RESUME");assert.equal(r.resume_anchor,"PDI_EVENT_CAS_OPEN");
 assert.equal(r.visual_selection,"node-b");assert.equal(r.visual_foreground,true);
 assert.equal(r.preserved_streams.length,2);assert.equal(r.preserved_obligations[0].id,"CAS_GOVERNANCE");
 assert.equal(r.host_verified,false);assert.equal(r.automatic_dispatch,false);assert.equal(r.pet,"PAUSED");
});
test("new task and correction are not implicit permanent redirects",()=>{
 for(const kind of ["NEW_TASK","CORRECTION","INFORMATION"]){
  const r=prepareClicCustomInputContinuation({previous:previousContinuity(),input:{kind,text:"Zwischeninformation"}});
  assert.equal(r.resume_anchor,"PDI_EVENT_CAS_OPEN");assert.equal(r.interrupted_lineage,null);
 }
});
test("redirect only with explicit decision; prior lineage survives",()=>{
 const input={kind:"EXPLICIT_REDIRECT",text:"Bitte stattdessen neues Thema"};
 assert.equal(prepareClicCustomInputContinuation({previous:previousContinuity(),input}).reason,"EXPLICIT_REDIRECT_AUTHORITY_REQUIRED");
 const r=prepareClicCustomInputContinuation({previous:previousContinuity(),input,decision:{explicit_user_redirect:true,new_return_anchor:"NEW_TOPIC"}});
 assert.equal(r.status,"EXPLICIT_REDIRECT_CARRIED");assert.equal(r.resume_anchor,"NEW_TOPIC");
 assert.equal(r.prior_anchor,"PDI_EVENT_CAS_OPEN");assert.equal(r.interrupted_lineage.return_anchor,"PDI_EVENT_CAS_OPEN");
});
test("forged state and invalid input never erase return anchors",()=>{
 assert.equal(prepareClicCustomInputContinuation({previous:{...previousContinuity(),source_head:"not-a-sha"},input:{kind:"QUESTION",text:"?"}}).status,"CONTINUITY_HOLD");
 assert.equal(prepareClicCustomInputContinuation({previous:previousContinuity(),input:{kind:"OTHER",text:"x"}}).status,"CONTINUITY_HOLD");
});
