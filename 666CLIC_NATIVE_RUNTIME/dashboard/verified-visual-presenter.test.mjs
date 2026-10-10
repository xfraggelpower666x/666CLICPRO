import test from "node:test";import fs from "node:fs";import assert from "node:assert/strict";
import{presentWholeClic,checkNoticeRegistry}from "./verified-visual-presenter.mjs";
const identity={system_id:"666CLIC",name:"C.L.I.C.",type:"SYSTEM",status:"VERIFIED",authority:"GITHUB_CURRENT",evidence:"commit"};
test("Junior foreground independently of developer visibility",()=>{for(const development of [undefined,{status:"INACTIVE"},{status:"ACTIVE",authority:"UNKNOWN",tasks:[]}]){const r=presentWholeClic({identity,development});assert.equal(r.junior.visible,true);assert.equal(r.junior.pinned,true);assert.equal(r.developer.visible,false);assert.equal(r.junior.pet_development,"PAUSED")}});
test("verified task ledger required for numeric progress",()=>{const r=presentWholeClic({identity,development:{status:"ACTIVE",authority:"666CLIC_REPO_CURRENT",source_revision:"sha",tasks:[{id:"1",status:"DONE",evidence:["readback"]},{id:"2",status:"BLOCKED"}]}});assert.equal(r.developer.progress.done,1);assert.equal(r.developer.progress.total,2);assert.equal(r.developer.progress.percent,50)});
test("source revision missing means no progress",()=>{const r=presentWholeClic({identity,development:{status:"ACTIVE",authority:"666CLIC_REPO_CURRENT",tasks:[{id:"1",status:"DONE",evidence:["readback"]}]}});assert.equal(r.developer.progress,null)});
test("notice registry requires authentic receipts and host evidence",()=>{assert.equal(checkNoticeRegistry({notices:[{id:"A",state:"PREPARED"}]}).valid,true);assert.equal(checkNoticeRegistry({notices:[{id:"A",state:"DELIVERED"}]}).valid,false);assert.equal(checkNoticeRegistry({notices:[{id:"A",state:"HOST_VERIFIED",receipts:["ack"],native_authority_ref:"native",target_readback_ref:"commit"}]}).valid,false)});
test("duplicate notice IDs rejected",()=>assert.equal(checkNoticeRegistry({notices:[{id:"A",state:"PREPARED"},{id:"A",state:"PREPARED"}]}).valid,false));

test("real CLIC visual outbox registry has seven valid prepared notices",()=>{const registry=JSON.parse(fs.readFileSync("666CLIC_NATIVE_RUNTIME/outbox/visual/UNIFIED_NEON_VISUAL_NOTICE_REGISTRY_CURRENT.json","utf8"));const v=checkNoticeRegistry(registry);assert.equal(v.valid,true);assert.equal(v.total,7);assert.equal(v.prepared,7);assert.equal(v.delivery_confirmed,0);for(const n of registry.notices)assert.equal(fs.existsSync(n.source_path),true)});

import {classifyClicTrigger,selectVisualView} from "./verified-visual-presenter.mjs";
test("direct FORCE WEITER routes to safe continuation without writes",()=>{
 const r=classifyClicTrigger("666CLIC FORCE WEITER");
 assert.equal(r.recognized,true);assert.equal(r.action,"WEITER");assert.equal(r.force,true);
 assert.equal(r.continuation,true);assert.equal(r.write_authority,false);
 const p=presentWholeClic({identity,direct_command:"666CLIC FORCE WEITER",development:{status:"INACTIVE"}});
 assert.equal(p.trigger.action,"WEITER");assert.equal(p.junior.visible,true);
 assert.equal(p.visual.type,"COMPACT_STATUS");assert.equal(p.developer.visible,false);
});
test("direct normal UPDATE retains write classification but FORCE WEITER does not",()=>{
 assert.equal(classifyClicTrigger("666CLIC UPDATE").write_authority,true);
 assert.equal(classifyClicTrigger("666CLIC FORCE UPDATE").write_authority,true);
 assert.equal(classifyClicTrigger("666CLIC WEITER").write_authority,false);
 assert.equal(classifyClicTrigger("text 666CLIC FORCE WEITER").recognized,false);
});
test("visual selection prefers grounded recovery, card, progress and conflicts",()=>{
 const entry={label:"checkpoint",evidence:"commit sha"};
 assert.equal(selectVisualView({recovery:{steps:[entry]}},{action:"NEXT_CHAT"}).type,"REHYDRATION_TRACE");
 assert.equal(selectVisualView({card:{entries:[entry]}},{action:"CARD"}).type,"SYSTEM_CARD");
 assert.equal(selectVisualView({development:{status:"ACTIVE",authority:"666CLIC_REPO_CURRENT",milestones:[entry]}}).type,"DEVELOPMENT_POSITION");
 assert.equal(selectVisualView({conflict:{verified:true,entries:[entry]}}).type,"CONTRADICTION_MAP");
 assert.equal(selectVisualView({relations:{edges:[{from:"A",to:"B"}]}}).type,"COMPACT_STATUS");
});

import {recoverForeground,evaluateHostRecovery} from "./verified-visual-presenter.mjs";
test("VORNE remains nonmutating and requires current",()=>{
 const t=classifyClicTrigger("666CLIC VORNE");
 assert.equal(t.action,"VORNE");assert.equal(t.write_authority,false);
 assert.equal(recoverForeground({}).status,"PARTIAL");
 const r=presentWholeClic({identity,direct_command:"666CLIC VORNE",current:{head:"sha",pointer_ref:"pointer",manifest_verified:true}});
 assert.equal(r.foreground.foreground,"WHOLE_CLIC");assert.equal(r.junior.visible,true);
});
test("host recovery alarm is not drift proof",()=>{
 const command=["FUCK","HORST"].join(" ");
 assert.equal(classifyClicTrigger(command).action,"HOST_RECOVERY");
 assert.equal(classifyClicTrigger(command).write_authority,false);
 assert.equal(evaluateHostRecovery({}).status,"PARTIAL");
 const r=evaluateHostRecovery({current:{head:"sha",pointer_ref:"pointer",manifest_verified:true}});
 assert.equal(r.status,"NO_VERIFIED_DRIFT");
 assert.equal(r.drift_confirmed,false);
});

import {makeDevelopmentHandoff,assessHandoffState,nextDevelopmentExchange} from "../continuity/development-handoff.mjs";
test("development handoff remains PREPARED until verified receipt",()=>{
 const p=makeDevelopmentHandoff({handoff_id:"CLIC-LYVRA-SAMPLE",target:"LYVRA",source:{head:"source-sha"},source_refs:["outbox/LYVRA/source"]});
 assert.equal(p.valid,true);
 assert.equal(p.handoff.status,"PREPARED");
 assert.equal(nextDevelopmentExchange({handoff:p.handoff}).status,"AWAITING_NATIVE_CONSUMER_OR_RECEIPT");
 assert.equal(assessHandoffState({...p.handoff,status:"DELIVERED"}).valid,false);
 assert.equal(assessHandoffState({...p.handoff,status:"DELIVERED",delivery_receipt:"target-receipt"}).valid,true);
 assert.equal(assessHandoffState({...p.handoff,status:"ADOPTED",delivery_receipt:"receipt"}).valid,false);
});

import {validatePeerEnvelope,reconcilePeerReceipt,peerExchangeNextStep,CLIC_LYVRA_CHANNEL} from "../continuity/repo-peer-channel.mjs";
test("peer channel blocks false delivery and accepts only verified target-native receipt",()=>{
 const envelope={handoff_id:"CLIC-LYVRA-CHANNEL-ADOPTION-20261010-R01",source_system:"666CLIC",target_system:"LYVRA",source_head:"7de801e76502b351b4b3483b4d416541b7d9f34f",source_path:CLIC_LYVRA_CHANNEL.producer.outbox+"/CLIC-LYVRA-CHANNEL-ADOPTION-20261010-R01.json",status:"PREPARED"};
 assert.equal(validatePeerEnvelope(envelope).valid,true);
 assert.equal(peerExchangeNextStep(envelope).status,"AWAIT_RECEIPT");
 const receipt={handoff_id:envelope.handoff_id,sender:"LYVRA",recipient:"666CLIC",lyvra_head:"03dfabb12254cc9c7ca6c4ca048c5fe2d72f06ab",receipt_id:"LYVRA-ACK-20261010-R01",source_path:envelope.source_path};
 assert.equal(reconcilePeerReceipt(envelope,receipt).status,"AWAIT_RECEIPT");
 assert.equal(reconcilePeerReceipt(envelope,{...receipt,recipient_repository_readback_verified:true}).status,"DELIVERED_EVIDENCED");
 assert.equal(validatePeerEnvelope({...envelope,status:"DELIVERED"}).valid,false);
});

import {applyClicDevelopmentEvent} from "./development_progress/development-event-adapter.mjs";
test("verified development event feeds real progress and pinned Junior",()=>{
 const rev="f9a3b3e1acf3345b9945cc6b24c2523f834b1992";
 const e={type:"START",source_revision:rev,event_id:"clic-evt-start-1",evidence_ref:"commit-readback",title:"Visual presenter",tasks:[{id:"implement",status:"DONE",evidence:["source-readback"],completion_verified:true},{id:"host",status:"OPEN",evidence:["host-open-gate"]}]};
 const context={source_readback_verified:true,seen_event_ids:new Set()};
 const result=presentWholeClic({identity,direct_command:"666CLIC UPDATE",development_event:e,development_event_context:context});
 assert.equal(result.developer.visible,true);assert.equal(result.developer.progress.percent,50);assert.equal(result.junior.visible,true);
 assert.equal(result.development_event_error,null);
 assert.throws(()=>applyClicDevelopmentEvent(null,e,{source_readback_verified:false,seen_event_ids:new Set()}));
 const previous=applyClicDevelopmentEvent(null,e,context);
 const change={type:"TASK_STATUS",source_revision:rev,event_id:"clic-evt-done-2",evidence_ref:"host-pass",task_id:"host",task_status:"DONE",completion_verified:true};
 const updated=applyClicDevelopmentEvent(previous,change,context);
 assert.equal(updated.tasks.filter(x=>x.status==="DONE").length,2);
 assert.throws(()=>applyClicDevelopmentEvent(previous,{...change,event_id:e.event_id}, {source_readback_verified:true,seen_event_ids:new Set([e.event_id])}));
});
test("unverified development event cannot create invented dashboard progress",()=>{
 const e={type:"START",source_revision:"invalid",event_id:"event",evidence_ref:"evidence",title:"Bad",tasks:[]};
 const result=presentWholeClic({identity,development_event:e,development_event_context:{source_readback_verified:true,seen_event_ids:new Set()}});
 assert.equal(result.developer.visible,false);assert.equal(result.junior.visible,true);
 assert.ok(result.development_event_error);
});

// Native source regression: ledger carries replay evidence across a new caller context.
test("persisted event IDs reject replay across reconstructed caller context",()=>{
 const rev="f9a3b3e1acf3345b9945cc6b24c2523f834b1992";
 const e={type:"START",source_revision:rev,event_id:"persist-replay-1",evidence_ref:"verified-source",title:"Audit",tasks:[{id:"task-1",status:"OPEN",evidence:["verified-task-source"]}]};
 const ledger=applyClicDevelopmentEvent(null,e,{source_readback_verified:true,seen_event_ids:new Set()});
 assert.deepEqual(ledger.processed_event_ids,["persist-replay-1"]);
 assert.throws(()=>applyClicDevelopmentEvent(ledger,{...e,type:"TASK_STATUS",task_id:"task-1",task_status:"DONE",completion_verified:true},{source_readback_verified:true,seen_event_ids:new Set()}),/EVENT_REPLAY_OR_SOURCE_UNVERIFIED/);
});
test("active verified tasks select DEVELOPMENT_POSITION visual",()=>{
 const rev="f9a3b3e1acf3345b9945cc6b24c2523f834b1992";
 const e={type:"START",source_revision:rev,event_id:"visual-milestone-1",evidence_ref:"verified-source",title:"Audit",tasks:[{id:"task-1",status:"DONE",completion_verified:true,evidence:["readback"]},{id:"task-2",status:"OPEN",evidence:["pending-host"]}]};
 const r=presentWholeClic({identity,development_event:e,development_event_context:{source_readback_verified:true,seen_event_ids:new Set()}});
 assert.equal(r.visual.type,"DEVELOPMENT_POSITION");assert.equal(r.visual.entries.length,2);assert.equal(r.developer.progress.percent,50);
});
