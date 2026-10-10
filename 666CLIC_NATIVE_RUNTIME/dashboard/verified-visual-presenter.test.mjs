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
